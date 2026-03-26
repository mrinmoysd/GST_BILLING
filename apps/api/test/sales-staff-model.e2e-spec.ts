/// <reference types="jest" />
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const http = (server: any) =>
  ((request as any).default ?? (request as any))(server);

function rnd(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

describe('Sales staff model (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('propagates salesperson attribution from customer through quote, order, invoice, payment, and reports', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: {
        name: rnd('d4_co'),
        businessType: 'WHOLESALE',
        allowNegativeStock: true,
      },
    });

    const owner = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d4_owner')}@example.com`,
        name: 'Owner User',
        role: 'ADMIN',
        passwordHash,
        isActive: true,
      },
    });

    const salesperson = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d4_sales')}@example.com`,
        name: 'Field Rep',
        role: 'salesperson',
        passwordHash,
        isActive: true,
      },
    });

    await prisma.invoiceSeries.upsert({
      where: { companyId_code: { companyId: company.id, code: 'DEFAULT' } },
      update: { isActive: true },
      create: {
        companyId: company.id,
        code: 'DEFAULT',
        prefix: 'INV-',
        nextNumber: 1,
        isActive: true,
      },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: owner.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const salespeopleRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/users/salespeople`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(salespeopleRes.body.data.some((row: any) => row.id === salesperson.id)).toBe(true);

    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Rep Assigned Customer',
        email: `${rnd('cust')}@example.com`,
        salesperson_user_id: salesperson.id,
      })
      .expect(201);

    expect(customerRes.body.data.salesperson.id).toBe(salesperson.id);

    const customerId = customerRes.body.data.id;

    const customerDetailRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/customers/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(customerDetailRes.body.data.salesperson.id).toBe(salesperson.id);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'D4 Product', price: '100', tax_rate: '18' })
      .expect(201);

    const quotationRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productRes.body.data.id, quantity: '2', unit_price: '100' }],
      })
      .expect(201);

    expect(quotationRes.body.data.salesperson.id).toBe(salesperson.id);

    const salesOrderRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations/${quotationRes.body.data.id}/convert-to-sales-order`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(salesOrderRes.body.data.salesperson.id).toBe(salesperson.id);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/sales-orders/${salesOrderRes.body.data.id}/confirm`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const invoiceDraftRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/sales-orders/${salesOrderRes.body.data.id}/convert-to-invoice`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(invoiceDraftRes.body.data.salesperson.id).toBe(salesperson.id);

    const invoiceId = invoiceDraftRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ series_code: 'DEFAULT' })
      .expect(201);

    const paymentRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        invoice_id: invoiceId,
        amount: '50',
        method: 'cash',
        payment_date: '2026-03-25',
      })
      .expect(201);

    const paymentId = paymentRes.body.data.id;
    const paymentRow = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(paymentRow?.salespersonUserId).toBe(salesperson.id);

    const salesReportRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/distributor/sales-by-salesperson?from=2026-03-01&to=2026-03-31`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const salesRow = salesReportRes.body.data.find(
      (row: any) => row.salesperson_user_id === salesperson.id,
    );
    expect(salesRow).toBeTruthy();
    expect(salesRow.invoices_count).toBe(1);
    expect(salesRow.gross_sales).toBeCloseTo(236, 5);
    expect(salesRow.amount_paid).toBeCloseTo(50, 5);
    expect(salesRow.amount_due).toBeCloseTo(186, 5);

    const collectionsReportRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/distributor/collections-by-salesperson?from=2026-03-01&to=2026-03-31`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const collectionsRow = collectionsReportRes.body.data.find(
      (row: any) => row.salesperson_user_id === salesperson.id,
    );
    expect(collectionsRow.collections_amount).toBeCloseTo(50, 5);

    const outstandingReportRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/distributor/outstanding-by-salesperson?as_of=2026-03-31`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const outstandingRow = outstandingReportRes.body.data.find(
      (row: any) => row.salesperson_user_id === salesperson.id,
    );
    expect(outstandingRow.outstanding_amount).toBeCloseTo(186, 5);
  });
});
