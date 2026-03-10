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

describe('Phase 03 - Invoices (e2e)', () => {
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

  it('can create draft invoice, issue it (stock movement), record payment, then block cancel', async () => {
    const password = 'P@ssw0rd!' + Date.now();

    const company = await prisma.company.create({
      data: { name: rnd('inv_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('inv_user')}@example.com`,
        name: 'Invoice User',
        role: 'ADMIN',
        passwordHash: password,
      },
    });

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    // Ensure DEFAULT series exists for this company.
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
    const companyId = company.id;

    // Create customer
    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Acme', email: 'acme@example.com' });

    expect(customerRes.status).toBe(201);
    const customerId = customerRes.body.data.id;

    // Create product
    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Widget', price: '100', tax_rate: '18' });

    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // Seed stock via adjustment endpoint
    const stockRes = await http(app.getHttpServer())
      .post(
        `/api/companies/${companyId}/products/${productId}/stock-adjustment`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 10, reason: 'init' });

    expect(stockRes.status).toBe(201);

    // Draft invoice (idempotent)
    const idemKey = `inv-create-${Date.now()}`;
    const draftPayload = {
      customer_id: customerId,
      items: [{ product_id: productId, quantity: '2', unit_price: '100' }],
    };

    const draftRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send(draftPayload);

    expect(draftRes.status).toBe(201);
    const invoiceId = draftRes.body.data.id;

    const draftRes2 = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send(draftPayload);

    expect(draftRes2.status).toBe(201);
    expect(draftRes2.body.data.id).toBe(invoiceId);

    const draftConflict = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ ...draftPayload, notes: 'different payload' });

    expect(draftConflict.status).toBe(409);

    // Issue invoice -> should decrement stock and create stock movement with source_type=invoice
    const issueRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    if (issueRes.status !== 201) {
      // eslint-disable-next-line no-console
      console.log('issue invoice failed', issueRes.status, issueRes.body);
    }
    expect(issueRes.status).toBe(201);
    expect(issueRes.body.data.status).toBe('issued');
    expect(
      issueRes.body.data.invoiceNumber || issueRes.body.data.invoice_number,
    ).toBeTruthy();

    const movements = await http(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/stock-movements?product_id=${productId}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(movements.status).toBe(200);
    const last = movements.body.data[0];
    expect(last.sourceType || last.source_type).toBe('invoice');
    expect(last.sourceId || last.source_id).toBe(invoiceId);

    // Record payment (idempotent) - pay full amount to flip status=paid
    const payKey = `pay-${Date.now()}`;
    const payRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', payKey)
      .send({ invoice_id: invoiceId, amount: '236', method: 'cash' });

    expect(payRes.status).toBe(201);

    const payRes2 = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', payKey)
      .send({ invoice_id: invoiceId, amount: '236', method: 'cash' });

    expect(payRes2.status).toBe(201);
    expect(payRes2.body.data.id).toBe(payRes.body.data.id);

    const invAfterPay = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(invAfterPay.status).toBe(200);
    expect(invAfterPay.body.data.status).toBe('paid');

    // PDF regenerate + fetch
    const regen = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices/${invoiceId}/pdf/regenerate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(regen.status).toBe(201);

    const pdfRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/invoices/${invoiceId}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(pdfRes.status).toBe(200);
    // Express may return application/pdf or application/octet-stream depending on headers.
    expect(String(pdfRes.headers['content-type'] ?? '')).toContain(
      'application',
    );

    // Cancel should be blocked due to payment
    const cancelRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices/${invoiceId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(cancelRes.status).toBe(409);
  });
});
