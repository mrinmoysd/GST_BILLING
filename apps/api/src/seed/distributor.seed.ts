import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

type Json = any;

const API_BASE_URL = process.env.SEED_API_BASE_URL ?? 'http://localhost:4000/api';
const COMPANY_ID =
  process.env.SEED_COMPANY_ID ?? '00000000-0000-0000-0000-000000000001';
const OWNER_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'owner@example.com';
const OWNER_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'password123';
const PASSWORD = process.env.SEED_DISTRIBUTOR_USER_PASSWORD ?? 'password123';
const PREFIX = process.env.SEED_PREFIX ?? 'DISTRO';

function assertOk(res: Response, bodyText: string) {
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText}: ${bodyText.slice(0, 500)}`,
    );
  }
}

async function apiLogin() {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
  });
  const text = await res.text();
  assertOk(res, text);
  const json = JSON.parse(text) as { data?: { access_token?: string } };
  const token = json?.data?.access_token;
  if (!token) throw new Error('Login succeeded but no access token returned');
  return token;
}

async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  const text = await res.text();
  assertOk(res, text);
  return JSON.parse(text) as T;
}

async function ensureUser(args: {
  prisma: PrismaClient;
  companyId: string;
  email: string;
  name: string;
  role: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(args.password, 10);
  const existing = await args.prisma.user.findFirst({
    where: {
      companyId: args.companyId,
      email: args.email,
    },
  });

  if (existing) {
    return args.prisma.user.update({
      where: { id: existing.id },
      data: {
        name: args.name,
        role: args.role,
        isActive: true,
        passwordHash,
      },
    });
  }

  return args.prisma.user.create({
    data: {
      companyId: args.companyId,
      email: args.email,
      name: args.name,
      role: args.role,
      isActive: true,
      passwordHash,
    },
  });
}

async function main() {
  const prisma = new PrismaClient();

  const company = await prisma.company.findUnique({ where: { id: COMPANY_ID } });
  if (!company) {
    throw new Error(
      `Company ${COMPANY_ID} not found. Run seed:auth first or set SEED_COMPANY_ID.`,
    );
  }

  await prisma.company.update({
    where: { id: COMPANY_ID },
    data: {
      name: process.env.SEED_COMPANY_NAME ?? `${PREFIX} Distribution Co.`,
      businessType: 'WHOLESALE',
      allowNegativeStock: false,
    },
  });

  const owner = await prisma.user.findFirst({
    where: { companyId: COMPANY_ID, email: OWNER_EMAIL },
  });
  if (!owner) {
    throw new Error(
      `Owner ${OWNER_EMAIL} not found. Run seed:auth first or set SEED_ADMIN_EMAIL.`,
    );
  }

  await prisma.invoiceSeries.upsert({
    where: {
      companyId_code: {
        companyId: COMPANY_ID,
        code: 'DEFAULT',
      },
    },
    update: { isActive: true },
    create: {
      companyId: COMPANY_ID,
      code: 'DEFAULT',
      prefix: 'INV-',
      nextNumber: 1,
      isActive: true,
    },
  });

  const billingUser = await ensureUser({
    prisma,
    companyId: COMPANY_ID,
    email: `billing.${PREFIX.toLowerCase()}@example.com`,
    name: 'Billing Desk',
    role: 'staff',
    password: PASSWORD,
  });

  const warehouseUser = await ensureUser({
    prisma,
    companyId: COMPANY_ID,
    email: `warehouse.${PREFIX.toLowerCase()}@example.com`,
    name: 'Warehouse Manager',
    role: 'staff',
    password: PASSWORD,
  });

  const northRep = await ensureUser({
    prisma,
    companyId: COMPANY_ID,
    email: `north.rep.${PREFIX.toLowerCase()}@example.com`,
    name: 'North Rep',
    role: 'salesperson',
    password: PASSWORD,
  });

  const southRep = await ensureUser({
    prisma,
    companyId: COMPANY_ID,
    email: `south.rep.${PREFIX.toLowerCase()}@example.com`,
    name: 'South Rep',
    role: 'salesperson',
    password: PASSWORD,
  });

  const categories = await Promise.all(
    [
      `${PREFIX} Batteries`,
      `${PREFIX} Cables`,
      `${PREFIX} Networking`,
      `${PREFIX} Accessories`,
    ].map(async (name) => {
      const existing = await prisma.category.findFirst({
        where: { companyId: COMPANY_ID, name },
      });
      return (
        existing ??
        (await prisma.category.create({
          data: { companyId: COMPANY_ID, name, isActive: true },
        }))
      );
    }),
  );

  const suppliers = [] as Array<{ id: string; name: string }>;
  for (const [index, name] of [
    `${PREFIX} Source Electronics`,
    `${PREFIX} Prime Components`,
  ].entries()) {
    const email = `supplier.${PREFIX.toLowerCase()}.${index + 1}@example.com`;
    const existing = await prisma.supplier.findFirst({
      where: { companyId: COMPANY_ID, email, deletedAt: null },
    });
    const supplier =
      existing ??
      (await prisma.supplier.create({
        data: {
          companyId: COMPANY_ID,
          name,
          email,
          phone: `88888888${index + 1}${index + 1}`,
        },
      }));
    suppliers.push({ id: supplier.id, name: supplier.name });
  }

  const customers = [] as Array<{ id: string; name: string; salespersonId: string }>;
  const customerDefinitions = [
    {
      name: `${PREFIX} Retail Hub North`,
      email: `customer.north.${PREFIX.toLowerCase()}@example.com`,
      salespersonId: northRep.id,
    },
    {
      name: `${PREFIX} Retail Hub South`,
      email: `customer.south.${PREFIX.toLowerCase()}@example.com`,
      salespersonId: southRep.id,
    },
    {
      name: `${PREFIX} Dealer Prime`,
      email: `customer.prime.${PREFIX.toLowerCase()}@example.com`,
      salespersonId: northRep.id,
    },
    {
      name: `${PREFIX} Dealer Plus`,
      email: `customer.plus.${PREFIX.toLowerCase()}@example.com`,
      salespersonId: southRep.id,
    },
  ];

  for (const definition of customerDefinitions) {
    const existing = await prisma.customer.findFirst({
      where: {
        companyId: COMPANY_ID,
        email: definition.email,
        deletedAt: null,
      },
    });
    const customer =
      existing ??
      (await prisma.customer.create({
        data: {
          companyId: COMPANY_ID,
          name: definition.name,
          email: definition.email,
          phone: '9999999999',
          salespersonUserId: definition.salespersonId,
        },
      }));

    if (customer.salespersonUserId !== definition.salespersonId) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { salespersonUserId: definition.salespersonId },
      });
    }

    customers.push({
      id: customer.id,
      name: customer.name,
      salespersonId: definition.salespersonId,
    });
  }

  const productDefinitions = [
    {
      name: `${PREFIX} Power Bank`,
      sku: `${PREFIX}-PB-01`,
      price: 1899,
      costPrice: 1350,
      taxRate: 18,
      reorderLevel: 10,
      categoryId: categories[0].id,
    },
    {
      name: `${PREFIX} USB-C Cable`,
      sku: `${PREFIX}-CB-01`,
      price: 299,
      costPrice: 140,
      taxRate: 18,
      reorderLevel: 20,
      categoryId: categories[1].id,
    },
    {
      name: `${PREFIX} Router`,
      sku: `${PREFIX}-NW-01`,
      price: 2499,
      costPrice: 1800,
      taxRate: 18,
      reorderLevel: 6,
      categoryId: categories[2].id,
    },
    {
      name: `${PREFIX} Wall Charger`,
      sku: `${PREFIX}-AC-01`,
      price: 699,
      costPrice: 390,
      taxRate: 18,
      reorderLevel: 12,
      categoryId: categories[3].id,
    },
  ];

  const products = [] as Array<{ id: string; name: string; price: number }>;
  for (const definition of productDefinitions) {
    const existing = await prisma.product.findFirst({
      where: {
        companyId: COMPANY_ID,
        sku: definition.sku,
        deletedAt: null,
      },
    });
    const product =
      existing ??
      (await prisma.product.create({
        data: {
          companyId: COMPANY_ID,
          name: definition.name,
          sku: definition.sku,
          hsn: '8504',
          categoryId: definition.categoryId,
          price: definition.price,
          costPrice: definition.costPrice,
          taxRate: definition.taxRate,
          reorderLevel: definition.reorderLevel,
        },
      }));
    products.push({
      id: product.id,
      name: product.name,
      price: Number((product as any).price ?? definition.price),
    });
  }

  const token = await apiLogin();

  let mainWarehouse = await prisma.warehouse.findFirst({
    where: { companyId: COMPANY_ID, code: 'MAIN' },
  });
  if (!mainWarehouse) {
    const created = await apiRequest<{ data: { id: string } }>(
      `/companies/${COMPANY_ID}/warehouses`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Main Godown',
          code: 'MAIN',
          is_default: true,
        }),
      },
    );
    mainWarehouse = await prisma.warehouse.findUnique({
      where: { id: created.data.id },
    });
  }

  let branchWarehouse = await prisma.warehouse.findFirst({
    where: { companyId: COMPANY_ID, code: 'BR01' },
  });
  if (!branchWarehouse) {
    const created = await apiRequest<{ data: { id: string } }>(
      `/companies/${COMPANY_ID}/warehouses`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Branch Warehouse',
          code: 'BR01',
        }),
      },
    );
    branchWarehouse = await prisma.warehouse.findUnique({
      where: { id: created.data.id },
    });
  }

  if (!mainWarehouse || !branchWarehouse) {
    throw new Error('Failed to ensure distributor warehouses');
  }

  const purchaseDraft = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/purchases`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: suppliers[0].id,
        warehouse_id: mainWarehouse.id,
        purchase_date: new Date().toISOString().slice(0, 10),
        notes: `${PREFIX} distributor seed purchase`,
        items: [
          {
            product_id: products[0].id,
            quantity: '20',
            unit_cost: '1350',
          },
          {
            product_id: products[1].id,
            quantity: '50',
            unit_cost: '140',
          },
          {
            product_id: products[2].id,
            quantity: '10',
            unit_cost: '1800',
          },
          {
            product_id: products[3].id,
            quantity: '24',
            unit_cost: '390',
          },
        ],
      }),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/purchases/${purchaseDraft.data.id}/receive`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  const transferDraft = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/stock-transfers`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        from_warehouse_id: mainWarehouse.id,
        to_warehouse_id: branchWarehouse.id,
        transfer_date: new Date().toISOString().slice(0, 10),
        notes: `${PREFIX} branch replenishment`,
        items: [
          { product_id: products[1].id, quantity: '10' },
          { product_id: products[3].id, quantity: '4' },
        ],
      }),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/stock-transfers/${transferDraft.data.id}/dispatch`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/stock-transfers/${transferDraft.data.id}/receive`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  const quotation = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/quotations`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customers[0].id,
        issue_date: new Date().toISOString().slice(0, 10),
        expiry_date: new Date(Date.now() + 7 * 86_400_000)
          .toISOString()
          .slice(0, 10),
        items: [
          {
            product_id: products[0].id,
            quantity: '3',
            unit_price: '1899',
          },
          {
            product_id: products[1].id,
            quantity: '8',
            unit_price: '299',
          },
        ],
      }),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/quotations/${quotation.data.id}/send`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/quotations/${quotation.data.id}/approve`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  const salesOrder = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/quotations/${quotation.data.id}/convert-to-sales-order`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/sales-orders/${salesOrder.data.id}/confirm`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  const invoiceDraft = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/sales-orders/${salesOrder.data.id}/convert-to-invoice`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        series_code: 'DEFAULT',
      }),
    },
  );

  await apiRequest<Json>(
    `/companies/${COMPANY_ID}/invoices/${invoiceDraft.data.id}/issue`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ series_code: 'DEFAULT' }),
    },
  );

  await apiRequest<Json>(`/companies/${COMPANY_ID}/payments`, token, {
    method: 'POST',
    body: JSON.stringify({
      invoice_id: invoiceDraft.data.id,
      amount: '2500',
      method: 'bank',
      payment_date: new Date().toISOString().slice(0, 10),
      reference: `${PREFIX}-COLLECT-001`,
    }),
  });

  await prisma.$disconnect();

  // eslint-disable-next-line no-console
  console.log(
    [
      'Distributor seed complete:',
      `- api: ${API_BASE_URL}`,
      `- companyId: ${COMPANY_ID}`,
      `- owner: ${OWNER_EMAIL}`,
      `- billing: ${billingUser.email}`,
      `- warehouse: ${warehouseUser.email}`,
      `- salespeople: ${northRep.email}, ${southRep.email}`,
      `- password for seeded distributor users: ${PASSWORD}`,
      `- warehouses: ${mainWarehouse.name}, ${branchWarehouse.name}`,
      `- customers: ${customers.length}, suppliers: ${suppliers.length}, products: ${products.length}`,
      '- flows: purchase receive, transfer dispatch/receive, quotation, sales order, invoice, payment',
    ].join('\n'),
  );
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
