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

describe('Quotations (e2e)', () => {
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

  it('creates, updates, transitions, and converts a quotation to invoice draft', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('d1_quote_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d1_quote_user')}@example.com`,
        name: 'Quotation User',
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
      .send({ name: 'Quotation Customer', email: `${rnd('cust')}@example.com` })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Quotation Widget', price: '250', tax_rate: '18' })
      .expect(201);

    const customerId = customerRes.body.data.id;
    const productId = productRes.body.data.id;

    const createRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        issue_date: '2026-03-25',
        expiry_date: '2026-03-31',
        notes: 'Initial commercial offer',
        items: [{ product_id: productId, quantity: '2', unit_price: '250' }],
      })
      .expect(201);

    const quotationId = createRes.body.data.id;
    expect(createRes.body.data.quoteNumber).toMatch(/^QTN-/);

    const patchRes = await http(app.getHttpServer())
      .patch(`/api/companies/${company.id}/quotations/${quotationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        notes: 'Updated commercial offer',
        items: [{ product_id: productId, quantity: '3', unit_price: '240', discount: '20' }],
      })
      .expect(200);

    expect(String(patchRes.body.data.total)).toBeTruthy();

    const sendRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations/${quotationId}/send`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(sendRes.body.data.status).toBe('sent');

    const approveRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations/${quotationId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(approveRes.body.data.status).toBe('approved');

    const convertRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations/${quotationId}/convert-to-invoice`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(convertRes.body.data.status).toBe('draft');
    expect(convertRes.body.data.quotationId).toBe(quotationId);

    const quotationDetailRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/quotations/${quotationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(quotationDetailRes.body.data.status).toBe('converted');
    expect(quotationDetailRes.body.data.invoices).toHaveLength(1);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/quotations/${quotationId}/convert-to-invoice`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(409);
  });
});
