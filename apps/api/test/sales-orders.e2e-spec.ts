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

describe('Sales orders (e2e)', () => {
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

  it('captures, confirms, partially fulfills, and fully fulfills a sales order', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('d2_so_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d2_so_user')}@example.com`,
        name: 'Sales Order User',
        role: 'ADMIN',
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
      .send({ email: user.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Sales Order Customer', email: `${rnd('cust')}@example.com` })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Sales Order Widget', price: '100', tax_rate: '18' })
      .expect(201);

    const customerId = customerRes.body.data.id;
    const productId = productRes.body.data.id;

    const createRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/sales-orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        order_date: '2026-03-25',
        items: [{ product_id: productId, quantity: '5', unit_price: '100' }],
      })
      .expect(201);

    const salesOrderId = createRes.body.data.id;
    expect(createRes.body.data.orderNumber).toMatch(/^SO-/);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/sales-orders/${salesOrderId}/confirm`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const detailRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const itemId = detailRes.body.data.items[0].id;

    const partialInvoiceRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/sales-orders/${salesOrderId}/convert-to-invoice`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [{ sales_order_item_id: itemId, quantity: '2' }],
      })
      .expect(201);

    expect(partialInvoiceRes.body.data.status).toBe('draft');
    expect(partialInvoiceRes.body.data.salesOrderId).toBe(salesOrderId);

    const afterPartialRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(afterPartialRes.body.data.status).toBe('partially_fulfilled');
    expect(afterPartialRes.body.data.items[0].quantityFulfilled.toString()).toBe('2');

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/sales-orders/${salesOrderId}/convert-to-invoice`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const afterFullRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(afterFullRes.body.data.status).toBe('fulfilled');
    expect(afterFullRes.body.data.invoices).toHaveLength(2);
  });

  it('converts a quotation into a sales order and links the source quote', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('d2_q2so_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d2_q2so_user')}@example.com`,
        name: 'Quote to Order User',
        role: 'ADMIN',
        passwordHash,
        isActive: true,
      },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;

    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Quote Order Customer', email: `${rnd('cust')}@example.com` })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Quote Order Widget', price: '150', tax_rate: '18' })
      .expect(201);

    const quotationRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerRes.body.data.id,
        items: [{ product_id: productRes.body.data.id, quantity: '3', unit_price: '150' }],
      })
      .expect(201);

    const quotationId = quotationRes.body.data.id;

    const salesOrderRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations/${quotationId}/convert-to-sales-order`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(salesOrderRes.body.data.quotationId).toBe(quotationId);
    expect(salesOrderRes.body.data.items).toHaveLength(1);

    const quotationDetailRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/quotations/${quotationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(quotationDetailRes.body.data.status).toBe('converted');
  });
});
