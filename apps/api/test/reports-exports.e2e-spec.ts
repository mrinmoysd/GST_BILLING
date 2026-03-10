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

describe('Phase 05 - Reports + Exports (e2e)', () => {
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

  it('can return sales summary, outstanding list, top products, and generate + download GSTR1 CSV export job', async () => {
    const password = 'P@ssw0rd!' + Date.now();

    const company = await prisma.company.create({
      data: { name: rnd('rpt_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('rpt_user')}@example.com`,
        name: 'Reports User',
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

    // Create customer + product
    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Acme', email: `${rnd('acme')}@example.com` })
      .expect(201);

    const customerId = customerRes.body.data.id;

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Widget', price: '100', tax_rate: '18' })
      .expect(201);

    const productId = productRes.body.data.id;

    // Seed stock
    await http(app.getHttpServer())
      .post(
        `/api/companies/${companyId}/products/${productId}/stock-adjustment`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 10, reason: 'init' })
      .expect(201);

    // Create + issue an invoice (so we have report data)
    const draftRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `idem-${Date.now()}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: '2', unit_price: '100' }],
      })
      .expect(201);

    const invoiceId = draftRes.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    // Sales summary
    const summaryRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/reports/sales/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(summaryRes.body.data.count).toBeGreaterThanOrEqual(1);

    // Outstanding (should include the invoice until paid)
    const outRes = await http(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/reports/sales/outstanding?page=1&limit=10`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(outRes.body.data.length).toBeGreaterThanOrEqual(1);

    // Top products
    const topRes = await http(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/reports/sales/top-products?limit=5&sort_by=amount`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(topRes.body.data.length).toBeGreaterThanOrEqual(1);

    // Export job + download
    const exportRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/exports/gstr1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const jobId = exportRes.body.data.id;
    expect(jobId).toBeTruthy();

    const jobRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/exports/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(jobRes.body.data.status).toBe('succeeded');

    const dl = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/exports/${jobId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(String(dl.headers['content-type'] ?? '')).toContain('text/csv');
  });
});
