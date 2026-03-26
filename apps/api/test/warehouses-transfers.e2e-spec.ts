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

describe('Warehouses and transfers (e2e)', () => {
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

  it('tracks warehouse-aware purchase receipt, invoice issue, and stock transfer without changing company stock', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('d3_co'), businessType: 'WHOLESALE' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d3_user')}@example.com`,
        name: 'Warehouse User',
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

    const warehouseA = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/warehouses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Main Warehouse',
        code: 'MAIN',
        is_default: true,
      })
      .expect(201);

    const warehouseB = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/warehouses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Branch Warehouse',
        code: 'BR01',
      })
      .expect(201);

    const supplierRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Warehouse Supplier', email: `${rnd('supp')}@example.com` })
      .expect(201);

    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Warehouse Customer', email: `${rnd('cust')}@example.com` })
      .expect(201);

    const productRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Transfer Widget', price: '120', tax_rate: '18' })
      .expect(201);

    const purchaseDraft = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierRes.body.data.id,
        warehouse_id: warehouseA.body.data.id,
        purchase_date: '2026-03-25',
        items: [
          {
            product_id: productRes.body.data.id,
            quantity: '10',
            unit_cost: '90',
          },
        ],
      })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases/${purchaseDraft.body.data.id}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const warehouseAStockAfterPurchase = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/warehouses/${warehouseA.body.data.id}/stock?page=1&limit=20`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(warehouseAStockAfterPurchase.body.data[0].quantity.toString()).toBe('10');

    const invoiceDraft = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerRes.body.data.id,
        warehouse_id: warehouseA.body.data.id,
        items: [
          {
            product_id: productRes.body.data.id,
            quantity: '2',
            unit_price: '120',
          },
        ],
      })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceDraft.body.data.id}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ series_code: 'DEFAULT' })
      .expect(201);

    const warehouseAStockAfterInvoice = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/warehouses/${warehouseA.body.data.id}/stock?page=1&limit=20`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(warehouseAStockAfterInvoice.body.data[0].quantity.toString()).toBe('8');

    const productAfterInvoice = await prisma.product.findUnique({
      where: { id: productRes.body.data.id },
    });
    expect(productAfterInvoice?.stock.toString()).toBe('8');

    const transferRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/stock-transfers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        from_warehouse_id: warehouseA.body.data.id,
        to_warehouse_id: warehouseB.body.data.id,
        transfer_date: '2026-03-25',
        items: [
          {
            product_id: productRes.body.data.id,
            quantity: '3',
          },
        ],
      })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/stock-transfers/${transferRes.body.data.id}/dispatch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const warehouseAStockAfterDispatch = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/warehouses/${warehouseA.body.data.id}/stock?page=1&limit=20`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(warehouseAStockAfterDispatch.body.data[0].quantity.toString()).toBe('5');

    const companyStockAfterDispatch = await prisma.product.findUnique({
      where: { id: productRes.body.data.id },
    });
    expect(companyStockAfterDispatch?.stock.toString()).toBe('8');

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/stock-transfers/${transferRes.body.data.id}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const warehouseBStockAfterReceive = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/warehouses/${warehouseB.body.data.id}/stock?page=1&limit=20`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(warehouseBStockAfterReceive.body.data[0].quantity.toString()).toBe('3');

    const companyStockAfterReceive = await prisma.product.findUnique({
      where: { id: productRes.body.data.id },
    });
    expect(companyStockAfterReceive?.stock.toString()).toBe('8');
  });
});
