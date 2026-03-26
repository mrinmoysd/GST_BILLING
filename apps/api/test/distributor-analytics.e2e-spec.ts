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

describe('Distributor analytics (e2e)', () => {
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

  it('returns owner-facing distributor analytics across reps, customers, warehouses, and movement', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 8)}01`;

    const company = await prisma.company.create({
      data: {
        name: rnd('d5_co'),
        businessType: 'WHOLESALE',
        allowNegativeStock: false,
      },
    });

    const owner = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d5_owner')}@example.com`,
        name: 'Distributor Owner',
        role: 'ADMIN',
        passwordHash,
        isActive: true,
      },
    });

    const salesperson = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('d5_sales')}@example.com`,
        name: 'Area Rep',
        role: 'salesperson',
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
      .send({ email: owner.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const mainWarehouse = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/warehouses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Main Godown',
        code: 'MAIN',
        is_default: true,
      })
      .expect(201);

    const secondaryWarehouse = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/warehouses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'North Branch',
        code: 'NORTH',
      })
      .expect(201);

    const supplierRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/suppliers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Movement Supplier', email: `${rnd('supp')}@example.com` })
      .expect(201);

    const customerRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/customers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Outstanding Retailer',
        email: `${rnd('cust')}@example.com`,
        salesperson_user_id: salesperson.id,
      })
      .expect(201);

    const fastProductRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Fast SKU',
        price: '100',
        cost_price: '70',
        tax_rate: '18',
        reorder_level: '5',
      })
      .expect(201);

    const slowProductRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/products`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Slow SKU',
        price: '80',
        cost_price: '40',
        tax_rate: '18',
        reorder_level: '2',
      })
      .expect(201);

    const purchaseDraft = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierRes.body.data.id,
        warehouse_id: mainWarehouse.body.data.id,
        purchase_date: today,
        items: [
          { product_id: fastProductRes.body.data.id, quantity: '12', unit_cost: '70' },
          { product_id: slowProductRes.body.data.id, quantity: '4', unit_cost: '40' },
        ],
      })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/purchases/${purchaseDraft.body.data.id}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const transferRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/stock-transfers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        from_warehouse_id: mainWarehouse.body.data.id,
        to_warehouse_id: secondaryWarehouse.body.data.id,
        transfer_date: today,
        items: [{ product_id: slowProductRes.body.data.id, quantity: '1' }],
      })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/stock-transfers/${transferRes.body.data.id}/dispatch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/stock-transfers/${transferRes.body.data.id}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const invoiceDraft = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerRes.body.data.id,
        warehouse_id: mainWarehouse.body.data.id,
        items: [
          { product_id: fastProductRes.body.data.id, quantity: '5', unit_price: '100' },
          { product_id: slowProductRes.body.data.id, quantity: '1', unit_price: '80' },
        ],
      })
      .expect(201);

    const invoiceId = invoiceDraft.body.data.id;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ series_code: 'DEFAULT' })
      .expect(201);

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        invoice_id: invoiceId,
        amount: '200',
        method: 'cash',
        payment_date: today,
      })
      .expect(201);

    const outstandingByCustomerRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/distributor/outstanding-by-customer?as_of=${today}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const dueCustomer = outstandingByCustomerRes.body.data.find(
      (row: any) => row.customer_id === customerRes.body.data.id,
    );
    expect(dueCustomer).toBeTruthy();
    expect(dueCustomer.salesperson_user_id).toBe(salesperson.id);
    expect(dueCustomer.outstanding_amount).toBeGreaterThan(0);

    const stockByWarehouseRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/reports/distributor/stock-by-warehouse`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const mainWarehouseRow = stockByWarehouseRes.body.data.find(
      (row: any) => row.warehouse_id === mainWarehouse.body.data.id,
    );
    const secondaryWarehouseRow = stockByWarehouseRes.body.data.find(
      (row: any) => row.warehouse_id === secondaryWarehouse.body.data.id,
    );
    expect(mainWarehouseRow).toBeTruthy();
    expect(mainWarehouseRow.stock_value).toBeGreaterThan(0);
    expect(secondaryWarehouseRow.total_quantity).toBe(1);

    const movementRes = await http(app.getHttpServer())
      .get(
        `/api/companies/${company.id}/reports/distributor/product-movement?from=${monthStart}&to=${today}&limit=5`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(movementRes.body.data.fast_moving.length).toBeGreaterThan(0);
    expect(movementRes.body.data.fast_moving[0].product_id).toBe(
      fastProductRes.body.data.id,
    );

    const dashboardRes = await http(app.getHttpServer())
      .get(
        `/api/companies/${company.id}/reports/distributor/dashboard?from=${monthStart}&to=${today}&as_of=${today}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(dashboardRes.body.data.totals.gross_sales).toBeGreaterThan(0);
    expect(dashboardRes.body.data.totals.collections).toBeCloseTo(200, 5);
    expect(dashboardRes.body.data.top_salespeople[0].salesperson_user_id).toBe(
      salesperson.id,
    );
    expect(dashboardRes.body.data.top_due_customers[0].customer_id).toBe(
      customerRes.body.data.id,
    );
    expect(dashboardRes.body.data.warehouse_snapshot.length).toBe(2);
    expect(dashboardRes.body.data.fast_moving[0].product_id).toBe(
      fastProductRes.body.data.id,
    );
  });
});
