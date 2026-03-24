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

describe('Masters CRUD and ledger coverage (e2e)', () => {
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

  it('covers customer and supplier CRUD, list filtering, and ledger views', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('masters_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('masters_user')}@example.com`,
        name: 'Masters User',
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
      .send({
        name: 'Alpha Retail',
        email: 'alpha@example.com',
        phone: '9999999999',
        gstin: '29ABCDE1234F1Z5',
        state_code: '29',
        billing_address: { city: 'Bengaluru' },
        shipping_address: { city: 'Bengaluru' },
      })
      .expect(201);

    const customerId = customerRes.body.data.id;

    const customerListRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/customers?q=Alpha`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(customerListRes.body.data).toHaveLength(1);

    await http(app.getHttpServer())
      .patch(`/api/companies/${company.id}/customers/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Alpha Retail Pvt Ltd',
        phone: '8888888888',
        shipping_address: { city: 'Mysuru' },
      })
      .expect(200);

    const customerGetRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/customers/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(customerGetRes.body.data.name).toBe('Alpha Retail Pvt Ltd');
    expect(customerGetRes.body.data.phone).toBe('8888888888');

    const supplierRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Supply Partner',
        email: 'supplier@example.com',
        phone: '7777777777',
        gstin: '29PQRSX1234A1Z5',
        state_code: '29',
        address: { city: 'Bengaluru' },
      })
      .expect(201);

    const supplierId = supplierRes.body.data.id;

    const supplierListRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/suppliers?q=Supply`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(supplierListRes.body.data).toHaveLength(1);

    await http(app.getHttpServer())
      .patch(`/api/companies/${company.id}/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Supply Partner Updated',
        phone: '6666666666',
      })
      .expect(200);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Ledger Widget', price: '100', tax_rate: '18' })
      .expect(201);

    const productId = productRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products/${productId}/stock-adjustment`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 5, reason: 'masters-seed' })
      .expect(201);

    const invoiceDraftRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: '2', unit_price: '100' }],
      })
      .expect(201);

    const invoiceId = invoiceDraftRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ invoice_id: invoiceId, amount: '236', method: 'cash' })
      .expect(201);

    const customerLedgerRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/customers/${customerId}/ledger`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(customerLedgerRes.body.data.rows.length).toBeGreaterThanOrEqual(2);
    expect(
      customerLedgerRes.body.data.rows.map((row: any) => row.type),
    ).toEqual(expect.arrayContaining(['invoice', 'payment']));

    const purchaseDraftRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierId,
        items: [{ product_id: productId, quantity: '3', unit_cost: '80' }],
      })
      .expect(201);

    const purchaseId = purchaseDraftRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases/${purchaseId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        purchase_id: purchaseId,
        amount: '100',
        method: 'bank_transfer',
      })
      .expect(201);

    const supplierLedgerRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/suppliers/${supplierId}/ledger`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(supplierLedgerRes.body.data.rows.length).toBeGreaterThanOrEqual(2);
    expect(
      supplierLedgerRes.body.data.rows.map((row: any) => row.type),
    ).toEqual(expect.arrayContaining(['purchase', 'payment']));

    await http(app.getHttpServer())
      .delete(`/api/companies/${company.id}/customers/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await http(app.getHttpServer())
      .delete(`/api/companies/${company.id}/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/customers/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('accepts legacy snake_case product payload aliases for tax and cost price', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('product_alias_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('product_alias_user')}@example.com`,
        name: 'Product Alias User',
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

    const createRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Alias Widget',
        price: '100',
        tax_rate: 18,
        cost_price: '60',
      })
      .expect(201);

    expect(String(createRes.body.data.taxRate)).toBe('18');
    expect(String(createRes.body.data.costPrice)).toBe('60');

    const productId = createRes.body.data.id;

    const updateRes = await http(app.getHttpServer())
      .patch(`/api/companies/${company.id}/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tax_rate: 12,
        cost_price: '55',
      })
      .expect(200);

    expect(String(updateRes.body.data.taxRate)).toBe('12');
    expect(String(updateRes.body.data.costPrice)).toBe('55');
  });
});
