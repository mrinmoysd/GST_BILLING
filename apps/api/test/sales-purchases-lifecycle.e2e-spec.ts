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

describe('Sales and purchase lifecycle coverage (e2e)', () => {
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

  it('covers invoice share, credit note, and sales return lifecycle', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('lt3_inv_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('lt3_inv_user')}@example.com`,
        name: 'Lifecycle Invoice User',
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
      .send({ name: 'Lifecycle Customer', email: `${rnd('cust')}@example.com` })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Lifecycle Widget', price: '100', tax_rate: '18' })
      .expect(201);

    const customerId = customerRes.body.data.id;
    const productId = productRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products/${productId}/stock-adjustment`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 4, reason: 'lt3-init' })
      .expect(201);

    const draftRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: '2', unit_price: '100' }],
      })
      .expect(201);

    const invoiceId = draftRes.body.data.id;

    const issueRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(issueRes.body.data.status).toBe('issued');

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/share`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        channel: 'email',
        recipient: 'buyer@example.com',
        message: 'Please find the invoice attached.',
      })
      .expect(201);

    const salesReturnRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/credit-notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kind: 'sales_return',
        restock: true,
        notes: 'Returned one unit',
        items: [{ product_id: productId, quantity: '1' }],
      })
      .expect(201);

    expect(salesReturnRes.body.data.kind).toBe('sales_return');
    expect(Number(salesReturnRes.body.data.total)).toBeGreaterThan(0);

    const creditNoteRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/credit-notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kind: 'credit_note',
        restock: false,
        notes: 'Commercial credit for one unit',
        items: [{ product_id: productId, quantity: '1' }],
      })
      .expect(201);

    expect(creditNoteRes.body.data.kind).toBe('credit_note');

    const invoiceDetailRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(invoiceDetailRes.body.data.status).toBe('credited');
    expect(invoiceDetailRes.body.data.creditNotes).toHaveLength(2);
    expect(invoiceDetailRes.body.data.shares).toHaveLength(1);
    expect(
      invoiceDetailRes.body.data.lifecycleEvents.map((event: any) => event.eventType),
    ).toEqual(
      expect.arrayContaining([
        'invoice.shared',
        'invoice.credit_noted',
      ]),
    );

    const productAfterReturn = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(productAfterReturn?.stock.toString()).toBe('3');
  });

  it('covers purchase payment, bill attachment, and partial purchase return lifecycle', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('lt3_pur_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('lt3_pur_user')}@example.com`,
        name: 'Lifecycle Purchase User',
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
    expect(accessToken).toBeTruthy();

    const supplierRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Lifecycle Supplier', email: `${rnd('sup')}@example.com` })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Lifecycle Purchase Item', price: '120', tax_rate: '18' })
      .expect(201);

    const supplierId = supplierRes.body.data.id;
    const productId = productRes.body.data.id;

    const draftRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierId,
        items: [{ product_id: productId, quantity: '5', unit_cost: '80' }],
      })
      .expect(201);

    const purchaseId = draftRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases/${purchaseId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const paymentRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        purchase_id: purchaseId,
        amount: '236',
        method: 'bank_transfer',
      })
      .expect(201);

    expect(String(paymentRes.body.data.amount)).toBe('236');

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases/${purchaseId}/bill`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('sample purchase bill'), 'purchase-bill.txt')
      .expect(201);

    const billDownloadRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/purchases/${purchaseId}/bill`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(String(billDownloadRes.text ?? '')).toContain('sample purchase bill');

    const returnRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases/${purchaseId}/returns`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        notes: 'Return two units',
        items: [{ product_id: productId, quantity: '2' }],
      })
      .expect(201);

    expect(Number(returnRes.body.data.total)).toBeGreaterThan(0);

    const purchaseDetailRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/purchases/${purchaseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(purchaseDetailRes.body.data.status).toBe('returned_partial');
    expect(purchaseDetailRes.body.data.purchaseReturns).toHaveLength(1);
    expect(purchaseDetailRes.body.data.billUrl).toContain(`/purchases/${purchaseId}/bill`);
    expect(
      purchaseDetailRes.body.data.lifecycleEvents.map((event: any) => event.eventType),
    ).toEqual(
      expect.arrayContaining([
        'purchase.payment_recorded',
        'purchase.bill_attached',
        'purchase.return_created',
      ]),
    );

    const productAfterReturn = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(productAfterReturn?.stock.toString()).toBe('3');
  });
});
