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

describe('Compliance and accounting coverage (e2e)', () => {
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

  it('covers GST report edges and accounting statement/report generation', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: {
        name: rnd('compliance_co'),
        businessType: 'RETAIL',
        gstin: '27ABCDE1234F1Z5',
        stateCode: '27',
      },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('compliance_user')}@example.com`,
        name: 'Compliance User',
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

    const supplierRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Registered Supplier',
        gstin: '27PQRSX1234A1Z5',
        state_code: '27',
      })
      .expect(201);

    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'B2B Customer',
        gstin: '29AAAAA0000A1Z5',
        state_code: '29',
        billing_address: { state_code: '29' },
        shipping_address: { state_code: '29' },
      })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'GST Product',
        price: '100',
        gstRate: 18,
        hsn: '8471',
        costPrice: '60',
      })
      .expect(201);

    const supplierId = supplierRes.body.data.id;
    const customerId = customerRes.body.data.id;
    const productId = productRes.body.data.id;

    const purchaseDraftRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierId,
        items: [{ product_id: productId, quantity: '5', unit_cost: '80' }],
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
      .send({
        invoice_id: invoiceId,
        amount: '236',
        method: 'cash',
      })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/credit-notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kind: 'sales_return',
        restock: true,
        items: [{ product_id: productId, quantity: '1' }],
      })
      .expect(201);

    const gstr1Res = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/gst/gstr1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(gstr1Res.body.data.summary).toMatchObject({
      invoice_count: 1,
      b2b_count: 1,
      b2c_count: 0,
      credit_note_count: 1,
    });
    expect(gstr1Res.body.data.b2b[0].customer_gstin).toBe('29AAAAA0000A1Z5');
    expect(Number(gstr1Res.body.data.b2b[0].igst_amount)).toBeGreaterThan(0);
    expect(gstr1Res.body.data.cdnr).toHaveLength(1);

    const gstr3bRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/gst/gstr3b`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      Number(gstr3bRes.body.data.outward_taxable_supplies.taxable_value),
    ).toBeGreaterThan(0);

    const hsnRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/gst/hsn-summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(hsnRes.body.data.rows.length).toBeGreaterThanOrEqual(1);
    expect(hsnRes.body.data.rows[0].hsn_code).toBe('8471');

    const itcRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/gst/itc`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Number(itcRes.body.data.eligible_itc.taxable_value)).toBeGreaterThan(0);

    const journalsRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/journals`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      journalsRes.body.data.map((row: any) => row.source_type),
    ).toEqual(
      expect.arrayContaining([
        'purchase_receive',
        'purchase_payment',
        'invoice_issue',
        'invoice_payment',
        'credit_note',
      ]),
    );

    const trialBalanceRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/trial-balance`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Math.abs(Number(trialBalanceRes.body.data.totals.difference))).toBeLessThan(0.001);

    const profitLossRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/profit-loss`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Number(profitLossRes.body.data.summary.income)).toBeGreaterThan(0);

    const balanceSheetRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/balance-sheet`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      Math.abs(Number(balanceSheetRes.body.data.summary.difference)),
    ).toBeLessThan(0.001);
    expect(Array.isArray(balanceSheetRes.body.data.assets)).toBe(true);
    expect(Array.isArray(balanceSheetRes.body.data.liabilities)).toBe(true);
    expect(Array.isArray(balanceSheetRes.body.data.equity)).toBe(true);

    const cashBookRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/books/cash?from=2026-01-01&to=2026-12-31`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(cashBookRes.body.data)).toBe(true);

    const bankBookRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/books/bank?from=2026-01-01&to=2026-12-31`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(bankBookRes.body.data)).toBe(true);
  });
});
