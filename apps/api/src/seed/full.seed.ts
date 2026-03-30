import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_SEED_COMPANY_ID,
  DEFAULT_SEED_OWNER_USER_ID,
} from './seed.constants';

/**
 * Full demo seed (option B): create master data, then create invoices/purchases and record payments/receive
 * via API endpoints so business logic creates journals/ledgers/stock movements.
 *
 * Usage (from repo root):
 *  npm --workspace apps/api run seed:full
 */

type Json = any;

const API_BASE_URL = process.env.SEED_API_BASE_URL ?? 'http://localhost:4000/api';
const COMPANY_ID = process.env.SEED_COMPANY_ID ?? DEFAULT_SEED_COMPANY_ID;
const USER_ID = process.env.SEED_USER_ID ?? DEFAULT_SEED_OWNER_USER_ID;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'owner@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'password123';

const SEED_PREFIX = process.env.SEED_PREFIX ?? 'DEMO';
const COUNT_CUSTOMERS = Number(process.env.SEED_CUSTOMERS ?? 5);
const COUNT_SUPPLIERS = Number(process.env.SEED_SUPPLIERS ?? 3);
const COUNT_PRODUCTS = Number(process.env.SEED_PRODUCTS ?? 8);
const COUNT_INVOICES = Number(process.env.SEED_INVOICES ?? 6);
const COUNT_PURCHASES = Number(process.env.SEED_PURCHASES ?? 4);

function assertOk(res: Response, bodyText: string) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${bodyText.slice(0, 500)}`);
  }
}

async function apiLogin(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const text = await res.text();
  assertOk(res, text);
  const json = JSON.parse(text) as { data?: { access_token?: string } };
  const token = json?.data?.access_token;
  if (!token) throw new Error('Login succeeded but no access_token returned');
  return token;
}

async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
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

function uniqName(base: string, idx: number) {
  return `${SEED_PREFIX} ${base} ${String(idx + 1).padStart(2, '0')}`;
}

async function main() {
  const prisma = new PrismaClient();

  // 1) Ensure auth seed exists (company + owner user + DEFAULT invoice series)
  // We call existing seed logic directly via Prisma to avoid depending on scripts ordering.
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    create: { id: COMPANY_ID, name: `${SEED_PREFIX} Company`, businessType: 'retailer' },
    update: { name: `${SEED_PREFIX} Company` },
  });

  // NOTE: user creation/password hashing is handled by the existing auth seed.
  // Here we only ensure the user exists so API login works.
  const userExists = await prisma.user.findFirst({ where: { id: USER_ID, companyId: COMPANY_ID } });
  if (!userExists) {
    throw new Error(
      `Seed prerequisite missing: user ${USER_ID} not found. Run apps/api seed:auth first (or set SEED_USER_ID/SEED_COMPANY_ID accordingly).`,
    );
  }

  await prisma.invoiceSeries.upsert({
    where: { companyId_code: { companyId: COMPANY_ID, code: 'DEFAULT' } },
    create: { companyId: COMPANY_ID, code: 'DEFAULT', prefix: 'INV-', nextNumber: 1, isActive: true },
    update: { isActive: true },
  });

  // 2) Master data via Prisma (idempotent-ish)
  const categories = await Promise.all(
    ['Batteries', 'Cables', 'Chargers', 'Accessories'].map(async (name) => {
      const existing = await prisma.category.findFirst({ where: { companyId: COMPANY_ID, name } });
      return (
        existing ??
        (await prisma.category.create({
          data: { companyId: COMPANY_ID, name, isActive: true },
        }))
      );
    }),
  );

  const customers = [] as Array<{ id: string; name: string }>;
  for (let i = 0; i < COUNT_CUSTOMERS; i++) {
    const name = uniqName('Customer', i);
    const email = `demo+${SEED_PREFIX.toLowerCase()}_customer_${i + 1}@example.com`;
    const existing = await prisma.customer.findFirst({ where: { companyId: COMPANY_ID, email, deletedAt: null } });
    const c =
      existing ??
      (await prisma.customer.create({
        data: {
          companyId: COMPANY_ID,
          name,
          email,
          phone: '9999999999',
        },
      }));
    customers.push({ id: c.id, name: c.name });
  }

  const suppliers = [] as Array<{ id: string; name: string }>;
  for (let i = 0; i < COUNT_SUPPLIERS; i++) {
    const name = uniqName('Supplier', i);
    const email = `demo+${SEED_PREFIX.toLowerCase()}_supplier_${i + 1}@example.com`;
    const existing = await prisma.supplier.findFirst({ where: { companyId: COMPANY_ID, email, deletedAt: null } });
    const s =
      existing ??
      (await prisma.supplier.create({
        data: {
          companyId: COMPANY_ID,
          name,
          email,
          phone: '8888888888',
        },
      }));
    suppliers.push({ id: s.id, name: s.name });
  }

  const products = [] as Array<{ id: string; name: string; price: string | number | null; taxRate: number | null }>;
  for (let i = 0; i < COUNT_PRODUCTS; i++) {
    const name = uniqName('Product', i);
    const sku = `${SEED_PREFIX}-SKU-${String(i + 1).padStart(3, '0')}`;
    const existing = await prisma.product.findFirst({ where: { companyId: COMPANY_ID, sku, deletedAt: null } });
    const category = categories[i % categories.length];
    const price = 99 + i * 10;
    const taxRate = i % 3 === 0 ? 18 : i % 3 === 1 ? 12 : 5;

    const p =
      existing ??
      (await prisma.product.create({
        data: {
          companyId: COMPANY_ID,
          name,
          sku,
          hsn: '8507',
          categoryId: category.id,
          price,
          taxRate,
          reorderLevel: 5,
        },
      }));

    products.push({ id: p.id, name: p.name, price: (p as any).price ?? price, taxRate: (p as any).taxRate ?? taxRate });
  }

  // 3) Transactional data via API (so journals/stock movements get generated)
  const token = await apiLogin();

  // 3a) Seed stock via stock-adjustment
  for (const [idx, p] of products.entries()) {
  const delta = 20 + (idx % 5) * 5;
    await apiRequest<{ data: unknown }>(
      `/companies/${COMPANY_ID}/products/${p.id}/stock-adjustment`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ delta, reason: `${SEED_PREFIX} initial stock` }),
      },
    );
  }

  // 3b) Create + receive purchases
  for (let i = 0; i < COUNT_PURCHASES; i++) {
    const supplier = suppliers[i % suppliers.length];
    const itemCount = 2 + (i % 3);
    const items = Array.from({ length: itemCount }).map((_, j) => {
      const pr = products[(i + j) % products.length];
      return {
        product_id: pr.id,
        quantity: String(2 + j),
        unit_cost: String(50 + j * 10),
        discount: j === 0 ? '0' : undefined,
      };
    });

    const created = await apiRequest<{ data: { id: string } }>(
      `/companies/${COMPANY_ID}/purchases`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ supplier_id: supplier.id, items, notes: `${SEED_PREFIX} seed purchase` }),
      },
    );

    await apiRequest<Json>(
      `/companies/${COMPANY_ID}/purchases/${created.data.id}/receive`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  }

  // 3c) Create + issue invoices, then record payments
  for (let i = 0; i < COUNT_INVOICES; i++) {
    const customer = customers[i % customers.length];
    const itemCount = 1 + (i % 3);
    const items = Array.from({ length: itemCount }).map((_, j) => {
      const pr = products[(i + j) % products.length];
      const unitPrice =
        typeof pr.price === 'number' ? pr.price : Number(pr.price ?? 100);
      return {
        product_id: pr.id,
        quantity: String(1 + j),
        unit_price: String(unitPrice),
        discount: j === 0 ? undefined : '5',
        override_reason:
          j === 0 ? undefined : `${SEED_PREFIX} seeded promotional discount`,
      };
    });

    const draft = await apiRequest<{ data: { id: string } }>(
      `/companies/${COMPANY_ID}/invoices`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customer.id,
          items,
          notes: `${SEED_PREFIX} demo invoice`,
        }),
      },
    );

    await apiRequest<Json>(
      `/companies/${COMPANY_ID}/invoices/${draft.data.id}/issue`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ series_code: 'DEFAULT' }),
      },
    );

    // Record a partial or full payment
    const method = i % 2 === 0 ? 'cash' : 'bank';
    await apiRequest<Json>(`/companies/${COMPANY_ID}/payments`, token, {
      method: 'POST',
      body: JSON.stringify({
        invoice_id: draft.data.id,
        method,
        amount: '100',
  reference: `${SEED_PREFIX}-PAY-${String(i + 1).padStart(3, '0')}`,
      }),
    });
  }

  await prisma.$disconnect();

  // eslint-disable-next-line no-console
  console.log(
    [
      'Seed complete:',
      `- api: ${API_BASE_URL}`,
      `- companyId: ${COMPANY_ID}`,
      `- user: ${ADMIN_EMAIL}`,
      `- customers: ${COUNT_CUSTOMERS}, suppliers: ${COUNT_SUPPLIERS}, products: ${COUNT_PRODUCTS}`,
      `- invoices issued: ${COUNT_INVOICES}, purchases received: ${COUNT_PURCHASES}`,
    ].join('\n'),
  );
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
