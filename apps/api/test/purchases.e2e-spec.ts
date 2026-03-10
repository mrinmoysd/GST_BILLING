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

describe('Phase 04 - Purchases (e2e)', () => {
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

  it('can draft purchase -> receive (stock+) -> cancel (reverse stock) and keep ledger consistent', async () => {
    const password = 'P@ssw0rd!' + Date.now();

    const company = await prisma.company.create({
      data: { name: rnd('pur_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('pur_user')}@example.com`,
        name: 'Purchase User',
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

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const companyId = company.id;

    // supplier
    const supplierRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Supplier One', email: `${rnd('sup')}@example.com` })
      .expect(201);

    const supplierId = supplierRes.body.data.id;

    // product
    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Widget', price: '100', tax_rate: '18' })
      .expect(201);

    const productId = productRes.body.data.id;

    // draft purchase
    const draftRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/purchases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierId,
        items: [{ product_id: productId, quantity: '5', unit_cost: '80' }],
      });

    expect(draftRes.status).toBe(201);
    const purchaseId = draftRes.body.data.id;

    // receive increases stock
    const recvRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/purchases/${purchaseId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(recvRes.status).toBe(201);
    expect(recvRes.body.data.status).toBe('received');

    const prodAfterRecv = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(prodAfterRecv?.stock.toString()).toBe('5');

    // movement source should be purchase
    const movements1 = await http(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/stock-movements?product_id=${productId}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const last1 = movements1.body.data[0];
    expect(last1.sourceType || last1.source_type).toBe('purchase');
    expect(last1.sourceId || last1.source_id).toBe(purchaseId);

    // cancel: reverse stock
    const cancelRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/purchases/${purchaseId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(cancelRes.status).toBe(201);
    expect(cancelRes.body.data.status).toBe('cancelled');

    const prodAfterCancel = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(prodAfterCancel?.stock.toString()).toBe('0');

    const movements2 = await http(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/stock-movements?product_id=${productId}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const last2 = movements2.body.data[0];
    expect(last2.sourceType || last2.source_type).toBe('purchase_return');
    expect(last2.sourceId || last2.source_id).toBe(purchaseId);

    // Ledger consistency: latest movement balance == product.stock
    expect(String(last2.balanceQty || last2.balance_qty)).toBe('0');
  });
});
