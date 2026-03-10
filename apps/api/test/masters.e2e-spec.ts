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

describe('Phase 02 Masters (e2e)', () => {
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

  it('enforces tenant scoping across customers/suppliers/products', async () => {
    const password = 'P@ssw0rd!' + Date.now();

    const companyA = await prisma.company.create({
      data: { name: rnd('cA'), businessType: 'RETAIL' },
    });
    const companyB = await prisma.company.create({
      data: { name: rnd('cB'), businessType: 'RETAIL' },
    });

    const userA = await prisma.user.create({
      data: {
        companyId: companyA.id,
        email: `${rnd('uA')}@example.com`,
        name: 'User A',
        role: 'ADMIN',
        passwordHash: password,
      },
    });

    // Set password hash correctly.
    // AuthService expects bcrypt hash; easiest is to call login only after we set a bcrypt hash.
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userA.id },
      data: { passwordHash: hash },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: userA.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    // Happy path: create customer under companyA
    const custRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyA.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: rnd('cust') })
      .expect(201);

    const customerId = custRes.body?.data?.id;
    expect(customerId).toBeTruthy();

    // Tenant mismatch should be forbidden
    await http(app.getHttpServer())
      .get(`/api/companies/${companyB.id}/customers/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    // Suppliers: create in A, fetch via B should 403
    const supRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyA.id}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: rnd('sup') })
      .expect(201);

    const supplierId = supRes.body?.data?.id;
    expect(supplierId).toBeTruthy();

    await http(app.getHttpServer())
      .get(`/api/companies/${companyB.id}/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    // Products: create in A, adjust stock, then mismatch fetch should 403
    const prodRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyA.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: rnd('prod'), price: 10, gstRate: 18 })
      .expect(201);

    const productId = prodRes.body?.data?.id;
    expect(productId).toBeTruthy();

    await http(app.getHttpServer())
      .post(
        `/api/companies/${companyA.id}/products/${productId}/stock-adjustment`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 5, reason: 'initial stock' })
      .expect(201);

    const movements = await http(app.getHttpServer())
      .get(
        `/api/companies/${companyA.id}/stock-movements?product_id=${productId}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(movements.body?.data?.length).toBeGreaterThan(0);

    const lowStock = await http(app.getHttpServer())
      .get(`/api/companies/${companyA.id}/inventory/low-stock?threshold=10`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(lowStock.body?.data)).toBe(true);

    await http(app.getHttpServer())
      .get(`/api/companies/${companyB.id}/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
