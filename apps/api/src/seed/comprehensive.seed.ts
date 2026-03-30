import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import {
  DEFAULT_SEED_COMPANY_ID,
  DEFAULT_SEED_OWNER_USER_ID,
  DEFAULT_SEED_SUPER_ADMIN_USER_ID,
} from './seed.constants';
import {
  normalizeSubscriptionPlanLimits,
  type SubscriptionPlanLimits,
} from '../billing/subscription-plan-limits';

type JsonObject = Record<string, unknown>;

const prisma = new PrismaClient();

const API_BASE_URL = process.env.SEED_API_BASE_URL ?? 'http://localhost:4000/api';
const COMPANY_ID = process.env.SEED_COMPANY_ID ?? DEFAULT_SEED_COMPANY_ID;
const OWNER_USER_ID = process.env.SEED_USER_ID ?? DEFAULT_SEED_OWNER_USER_ID;
const SUPER_ADMIN_USER_ID =
  process.env.SEED_SUPER_ADMIN_USER_ID ?? DEFAULT_SEED_SUPER_ADMIN_USER_ID;
const OWNER_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'owner@example.com';
const OWNER_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'password123';
const SEED_PREFIX = process.env.SEED_PREFIX ?? 'GST';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function assertOk(res: Response, bodyText: string) {
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText}: ${bodyText.slice(0, 600)}`,
    );
  }
}

async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  assertOk(res, text);
  const json = JSON.parse(text) as { data?: { access_token?: string } };
  const token = json?.data?.access_token;
  if (!token) {
    throw new Error('Login succeeded but no access_token was returned');
  }
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
  companyId: string | null;
  id?: string;
  email: string;
  name: string;
  role: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(args.password, 10);
  const existing = await prisma.user.findFirst({
    where: {
      companyId: args.companyId,
      email: args.email,
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: args.name,
        role: args.role,
        isActive: true,
        passwordHash,
      },
    });
  }

  return prisma.user.create({
    data: {
      id: args.id,
      companyId: args.companyId,
      email: args.email,
      name: args.name,
      role: args.role,
      isActive: true,
      passwordHash,
    },
  });
}

async function ensureCompany(args: {
  id: string;
  name: string;
  businessType: string;
  gstin?: string;
}) {
  return prisma.company.upsert({
    where: { id: args.id },
    create: {
      id: args.id,
      name: args.name,
      businessType: args.businessType,
      gstin: args.gstin ?? null,
    },
    update: {
      name: args.name,
      businessType: args.businessType,
      gstin: args.gstin ?? null,
    },
  });
}

function buildPlanCatalog() {
  return [
    {
      code: 'nano',
      name: 'Marg ERP Nano',
      priceInr: new Decimal(5550),
      billingInterval: 'year',
      displayOrder: 10,
      limits: normalizeSubscriptionPlanLimits({
        limits: {
          full_seats: { included: 1, max: 1, extra_price_inr: 0 },
          view_only_seats: { included: 0, max: 0, extra_price_inr: 0 },
          invoices: {
            included_per_month: 450,
            monthly_billing_value_inr: 150000,
            mode: 'wallet_overage',
            overage_price_inr: 5,
          },
          companies: { included: 1, max: 1, extra_price_inr: 0 },
          features: {
            accounting: true,
            gst: true,
            inventory: true,
          },
        },
        trialDays: 30,
        allowAddOns: true,
      }),
    },
    {
      code: 'basic',
      name: 'Basic Edition',
      priceInr: new Decimal(10300),
      billingInterval: 'year',
      displayOrder: 20,
      limits: normalizeSubscriptionPlanLimits({
        limits: {
          full_seats: { included: 1, max: 2, extra_price_inr: 3000 },
          view_only_seats: { included: 0, max: 0, extra_price_inr: 0 },
          invoices: {
            included_per_month: null,
            monthly_billing_value_inr: null,
            mode: 'warn_only',
            overage_price_inr: 0,
          },
          companies: { included: 1, max: 2, extra_price_inr: 3000 },
          features: {
            accounting: true,
            gst: true,
            inventory: true,
            field_sales: false,
          },
        },
        trialDays: 30,
        allowAddOns: true,
      }),
    },
    {
      code: 'silver',
      name: 'Silver Edition',
      priceInr: new Decimal(13900),
      billingInterval: 'year',
      displayOrder: 30,
      limits: normalizeSubscriptionPlanLimits({
        limits: {
          full_seats: { included: 1, max: 5, extra_price_inr: 3000 },
          view_only_seats: { included: 1, max: 5, extra_price_inr: 1500 },
          invoices: {
            included_per_month: 1200,
            monthly_billing_value_inr: 400000,
            mode: 'warn_only',
            overage_price_inr: 3,
          },
          companies: { included: 1, max: 5, extra_price_inr: 3000 },
          features: {
            accounting: true,
            gst: true,
            inventory: true,
            field_sales: true,
          },
        },
        trialDays: 30,
        allowAddOns: true,
      }),
    },
    {
      code: 'gold',
      name: 'Gold Edition',
      priceInr: new Decimal(26000),
      billingInterval: 'year',
      displayOrder: 40,
      limits: normalizeSubscriptionPlanLimits({
        limits: {
          full_seats: { included: 999, max: null, extra_price_inr: 0 },
          view_only_seats: { included: 999, max: null, extra_price_inr: 0 },
          invoices: {
            included_per_month: null,
            monthly_billing_value_inr: null,
            mode: 'warn_only',
            overage_price_inr: 0,
          },
          companies: { included: 999, max: null, extra_price_inr: 0 },
          features: {
            accounting: true,
            gst: true,
            inventory: true,
            field_sales: true,
            compliance: true,
          },
        },
        trialDays: 30,
        allowAddOns: true,
      }),
    },
  ];
}

function applyOverrides(
  limits: SubscriptionPlanLimits,
  overrides: {
    extra_full_seats?: number;
    extra_view_only_seats?: number;
    invoice_uplift_per_month?: number;
    company_uplift?: number;
    enforcement_mode?: 'hard_block' | 'wallet_overage' | 'warn_only' | null;
  } = {},
) {
  const invoiceBase = limits.invoices.included_per_month ?? 0;
  return {
    ...limits,
    full_seats: {
      ...limits.full_seats,
      included: limits.full_seats.included + (overrides.extra_full_seats ?? 0),
    },
    view_only_seats: {
      ...limits.view_only_seats,
      included:
        limits.view_only_seats.included +
        (overrides.extra_view_only_seats ?? 0),
    },
    invoices: {
      ...limits.invoices,
      included_per_month:
        limits.invoices.included_per_month === null &&
        (overrides.invoice_uplift_per_month ?? 0) === 0
          ? null
          : invoiceBase + (overrides.invoice_uplift_per_month ?? 0),
      mode: overrides.enforcement_mode ?? limits.invoices.mode,
    },
    companies: {
      ...limits.companies,
      included: limits.companies.included + (overrides.company_uplift ?? 0),
    },
    overrides: {
      extra_full_seats: overrides.extra_full_seats ?? 0,
      extra_view_only_seats: overrides.extra_view_only_seats ?? 0,
      invoice_uplift_per_month: overrides.invoice_uplift_per_month ?? 0,
      company_uplift: overrides.company_uplift ?? 0,
      enforcement_mode: overrides.enforcement_mode ?? null,
    },
  };
}

async function upsertSubscriptionBundle(args: {
  companyId: string;
  planCode: string;
  status: string;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  trialStatus: 'trialing' | 'trial_expired' | 'converted' | 'not_applicable';
  overrides?: {
    extra_full_seats?: number;
    extra_view_only_seats?: number;
    invoice_uplift_per_month?: number;
    company_uplift?: number;
    enforcement_mode?: 'hard_block' | 'wallet_overage' | 'warn_only' | null;
  };
}) {
  const plan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { code: args.planCode },
  });
  const limits = normalizeSubscriptionPlanLimits({
    limits: plan.limits,
    trialDays: plan.trialDays,
    allowAddOns: plan.allowAddOns,
  });
  const subscription = await prisma.subscription.create({
    data: {
      companyId: args.companyId,
      planId: plan.id,
      plan: plan.code,
      status: args.status,
      startedAt: new Date(),
      expiresAt:
        args.status === 'active' ? addDays(new Date(), 365) : args.trialEndsAt,
      trialStartedAt: args.trialStartedAt ?? null,
      trialEndsAt: args.trialEndsAt ?? null,
      provider: 'manual_seed',
      metadata: toJson({
        source: 'comprehensive_seed',
      }),
    },
  });

  const effectiveLimits = applyOverrides(limits, args.overrides);

  await prisma.companyEntitlement.upsert({
    where: { companyId: args.companyId },
    update: {
      subscriptionId: subscription.id,
      planCode: plan.code,
      status: args.status,
      overrides: toJson({
        extra_full_seats: args.overrides?.extra_full_seats ?? 0,
        extra_view_only_seats: args.overrides?.extra_view_only_seats ?? 0,
        invoice_uplift_per_month: args.overrides?.invoice_uplift_per_month ?? 0,
        company_uplift: args.overrides?.company_uplift ?? 0,
        enforcement_mode: args.overrides?.enforcement_mode ?? null,
      }),
      effectiveLimits: toJson({
        ...effectiveLimits,
        trial: {
          ...effectiveLimits.trial,
          status: args.trialStatus,
          started_at: args.trialStartedAt?.toISOString() ?? null,
          ends_at: args.trialEndsAt?.toISOString() ?? null,
          days_remaining:
            args.trialStatus === 'trialing' && args.trialEndsAt
              ? Math.max(
                  0,
                  Math.ceil(
                    (args.trialEndsAt.getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )
              : 0,
        },
      }),
      billingPeriodStart: startOfUtcMonth(),
      billingPeriodEnd: endOfUtcMonth(),
      trialStartedAt: args.trialStartedAt ?? null,
      trialEndsAt: args.trialEndsAt ?? null,
      trialStatus: args.trialStatus,
      updatedAt: new Date(),
    },
    create: {
      companyId: args.companyId,
      subscriptionId: subscription.id,
      planCode: plan.code,
      status: args.status,
      overrides: toJson({
        extra_full_seats: args.overrides?.extra_full_seats ?? 0,
        extra_view_only_seats: args.overrides?.extra_view_only_seats ?? 0,
        invoice_uplift_per_month: args.overrides?.invoice_uplift_per_month ?? 0,
        company_uplift: args.overrides?.company_uplift ?? 0,
        enforcement_mode: args.overrides?.enforcement_mode ?? null,
      }),
      effectiveLimits: toJson({
        ...effectiveLimits,
        trial: {
          ...effectiveLimits.trial,
          status: args.trialStatus,
          started_at: args.trialStartedAt?.toISOString() ?? null,
          ends_at: args.trialEndsAt?.toISOString() ?? null,
          days_remaining:
            args.trialStatus === 'trialing' && args.trialEndsAt
              ? Math.max(
                  0,
                  Math.ceil(
                    (args.trialEndsAt.getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )
              : 0,
        },
      }),
      billingPeriodStart: startOfUtcMonth(),
      billingPeriodEnd: endOfUtcMonth(),
      trialStartedAt: args.trialStartedAt ?? null,
      trialEndsAt: args.trialEndsAt ?? null,
      trialStatus: args.trialStatus,
    },
  });
}

async function upsertUsageMeters(args: {
  companyId: string;
  values: Record<string, number>;
}) {
  const periodStart = startOfUtcMonth();
  const periodEnd = endOfUtcMonth();
  for (const [key, value] of Object.entries(args.values)) {
    await prisma.usageMeter.upsert({
      where: {
        companyId_periodStart_periodEnd_key: {
          companyId: args.companyId,
          periodStart,
          periodEnd,
          key,
        },
      },
      update: {
        value: new Decimal(value),
        updatedAt: new Date(),
      },
      create: {
        companyId: args.companyId,
        periodStart,
        periodEnd,
        key,
        value: new Decimal(value),
      },
    });
  }
}

async function seedAdvancedMainCompanyData(token: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: COMPANY_ID },
  });
  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: `${SEED_PREFIX} Distribution HQ`,
      businessType: 'WHOLESALE',
      gstin: '27ABCDE1234F1Z5',
      allowNegativeStock: false,
    },
  });

  const owner = await prisma.user.findUniqueOrThrow({
    where: { id: OWNER_USER_ID },
  });

  const users = await prisma.user.findMany({
    where: { companyId: COMPANY_ID, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  const salespeople = users.filter((user) => user.role === 'salesperson');
  const customers = await prisma.customer.findMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const products = await prisma.product.findMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const warehouses = await prisma.warehouse.findMany({
    where: { companyId: COMPANY_ID },
    orderBy: { createdAt: 'asc' },
  });
  const invoices = await prisma.invoice.findMany({
    where: { companyId: COMPANY_ID },
    orderBy: { createdAt: 'asc' },
  });

  if (
    salespeople.length < 2 ||
    customers.length < 2 ||
    suppliers.length < 1 ||
    products.length < 4 ||
    warehouses.length < 2 ||
    invoices.length < 1
  ) {
    throw new Error(
      'Base transactional seed is incomplete. Run auth, distributor, and full seeds before comprehensive seed.',
    );
  }

  const [northRep, southRep] = salespeople;
  const [mainWarehouse, branchWarehouse] = warehouses;
  const firstInvoice = invoices.find((invoice) => invoice.status === 'issued') ?? invoices[0];

  const maybeFirstSalesOrder = await prisma.salesOrder.findFirst({
    where: { companyId: COMPANY_ID },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!maybeFirstSalesOrder) {
    throw new Error('Expected at least one sales order after distributor seed');
  }

  const priceList = await prisma.priceList.upsert({
    where: {
      companyId_code: {
        companyId: COMPANY_ID,
        code: 'WHOLESALE-A',
      },
    },
    update: {
      name: 'Wholesale A Price List',
      pricingTier: 'wholesale-a',
      priority: 100,
      isActive: true,
    },
    create: {
      companyId: COMPANY_ID,
      code: 'WHOLESALE-A',
      name: 'Wholesale A Price List',
      pricingTier: 'wholesale-a',
      priority: 100,
      isActive: true,
    },
  });

  for (const [index, product] of products.slice(0, 4).entries()) {
    await prisma.priceListItem.upsert({
      where: {
        priceListId_productId: {
          priceListId: priceList.id,
          productId: product.id,
        },
      },
      update: {
        fixedPrice: new Decimal(150 + index * 50),
        discountPercent: new Decimal(index === 0 ? 5 : 2.5),
      },
      create: {
        companyId: COMPANY_ID,
        priceListId: priceList.id,
        productId: product.id,
        fixedPrice: new Decimal(150 + index * 50),
        discountPercent: new Decimal(index === 0 ? 5 : 2.5),
      },
    });
  }

  await prisma.customer.update({
    where: { id: customers[0].id },
    data: {
      pricingTier: 'wholesale-a',
      creditLimit: new Decimal(120000),
      creditDays: 21,
      gstin: '27AAACD1234A1Z9',
      stateCode: '27',
      billingAddress: toJson({
        line1: 'Market Road 12',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      }),
      shippingAddress: toJson({
        line1: 'Godown Lane 3',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411002',
      }),
    },
  });

  await prisma.customerProductPrice.upsert({
    where: {
      companyId_customerId_productId: {
        companyId: COMPANY_ID,
        customerId: customers[0].id,
        productId: products[0].id,
      },
    },
    update: {
      fixedPrice: new Decimal(1749),
      discountPercent: null,
      isActive: true,
    },
    create: {
      companyId: COMPANY_ID,
      customerId: customers[0].id,
      productId: products[0].id,
      fixedPrice: new Decimal(1749),
      discountPercent: null,
      isActive: true,
    },
  });

  await prisma.commercialScheme.upsert({
    where: {
      companyId_code: {
        companyId: COMPANY_ID,
        code: 'BULK-5PCT',
      },
    },
    update: {
      name: 'Bulk 5% Scheme',
      schemeType: 'percent_discount',
      productId: products[1].id,
      minQuantity: new Decimal(10),
      percentDiscount: new Decimal(5),
      isActive: true,
    },
    create: {
      companyId: COMPANY_ID,
      code: 'BULK-5PCT',
      name: 'Bulk 5% Scheme',
      schemeType: 'percent_discount',
      documentType: 'invoice',
      productId: products[1].id,
      minQuantity: new Decimal(10),
      percentDiscount: new Decimal(5),
      priority: 50,
      isActive: true,
    },
  });

  await prisma.commercialScheme.upsert({
    where: {
      companyId_code: {
        companyId: COMPANY_ID,
        code: 'FREE-1',
      },
    },
    update: {
      name: 'Buy 12 Get 1',
      schemeType: 'free_quantity',
      productId: products[2].id,
      minQuantity: new Decimal(12),
      freeQuantity: new Decimal(1),
      isExclusive: true,
      isActive: true,
    },
    create: {
      companyId: COMPANY_ID,
      code: 'FREE-1',
      name: 'Buy 12 Get 1',
      schemeType: 'free_quantity',
      documentType: 'invoice',
      productId: products[2].id,
      minQuantity: new Decimal(12),
      freeQuantity: new Decimal(1),
      priority: 70,
      isExclusive: true,
      isActive: true,
    },
  });

  await prisma.commercialAuditLog.create({
    data: {
      companyId: COMPANY_ID,
      actorUserId: owner.id,
      documentType: 'invoice',
      documentId: firstInvoice.id,
      customerId: customers[0].id,
      productId: products[0].id,
      pricingSource: 'customer_override',
      action: 'price_applied',
      snapshot: toJson({
        fixed_price: '1749',
        note: 'Seeded commercial audit reference',
      }),
    },
  });

  const notificationsTemplate1 = await prisma.notificationTemplate.create({
    data: {
      companyId: COMPANY_ID,
      code: 'invoice_issued_email',
      channel: 'email',
      subject: 'Invoice {{invoice_number}} from GST Billing',
      body:
        'Hello {{customer_name}}, your invoice {{invoice_number}} for {{total}} is ready.',
      isActive: true,
    },
  });

  const notificationsTemplate2 = await prisma.notificationTemplate.create({
    data: {
      companyId: COMPANY_ID,
      code: 'payment_received_whatsapp',
      channel: 'whatsapp',
      subject: null,
      body:
        'Payment of {{amount}} received for {{invoice_number}}. Thank you.',
      isActive: true,
    },
  });

  await prisma.notificationOutbox.createMany({
    data: [
      {
        companyId: COMPANY_ID,
        channel: 'email',
        templateId: notificationsTemplate1.id,
        toAddress: customers[0].email ?? 'demo.customer@example.com',
        payload: toJson({
          event_type: 'invoice.issued',
          summary: 'Seeded invoice notification outbox entry',
        }),
        status: 'queued',
      },
      {
        companyId: COMPANY_ID,
        channel: 'whatsapp',
        templateId: notificationsTemplate2.id,
        toAddress: customers[1].phone ?? '9999999999',
        payload: toJson({
          event_type: 'payment.received',
          summary: 'Seeded payment notification outbox entry',
        }),
        status: 'failed',
        lastError: 'Sample downstream failure for retry testing',
      },
    ],
  });

  const ledger =
    (await prisma.ledger.findFirst({
      where: { companyId: COMPANY_ID, type: 'bank' },
    })) ??
    (await prisma.ledger.create({
      data: {
        companyId: COMPANY_ID,
        accountCode: 'BANK-001',
        accountName: 'Seed Current Account',
        type: 'bank',
      },
    }));

  const bankAccount = await prisma.companyBankAccount.create({
    data: {
      companyId: COMPANY_ID,
      ledgerId: ledger.id,
      nickname: 'Primary Current Account',
      bankName: 'HDFC Bank',
      branchName: 'Pune Main',
      accountHolderName: 'GST Distribution HQ',
      accountNumberMasked: 'XXXXXX1234',
      accountNumberLast4: '1234',
      ifscCode: 'HDFC0001234',
      upiHandle: 'gstbilling@hdfcbank',
      isActive: true,
    },
  });

  const matchedPayment =
    (await prisma.payment.findFirst({
      where: { companyId: COMPANY_ID, invoiceId: firstInvoice.id },
      orderBy: { createdAt: 'asc' },
    })) ??
    (await prisma.payment.create({
      data: {
        companyId: COMPANY_ID,
        invoiceId: firstInvoice.id,
        salespersonUserId: northRep.id,
        bankAccountId: bankAccount.id,
        amount: new Decimal(2500),
        method: 'bank',
        reference: `${SEED_PREFIX}-BANK-001`,
      },
    }));

  const statementImport = await prisma.bankStatementImport.create({
    data: {
      companyId: COMPANY_ID,
      bankAccountId: bankAccount.id,
      sourceFilename: 'seed_statement_apr.csv',
      status: 'imported',
      lineCount: 2,
    },
  });

  const matchedLine = await prisma.bankStatementLine.create({
    data: {
      companyId: COMPANY_ID,
      importId: statementImport.id,
      bankAccountId: bankAccount.id,
      txnDate: new Date(),
      description: 'Seed matched collection',
      reference: matchedPayment.reference,
      credit: new Decimal(2500),
      amount: new Decimal(2500),
      direction: 'credit',
      status: 'matched',
      matchedPaymentId: matchedPayment.id,
      matchedAt: new Date(),
    },
  });

  await prisma.bankStatementLine.create({
    data: {
      companyId: COMPANY_ID,
      importId: statementImport.id,
      bankAccountId: bankAccount.id,
      txnDate: new Date(),
      description: 'Seed unmatched bank charge',
      reference: `${SEED_PREFIX}-BANK-CHARGE`,
      debit: new Decimal(350),
      amount: new Decimal(350),
      direction: 'debit',
      status: 'unmatched',
    },
  });

  await prisma.bankReconciliationEvent.create({
    data: {
      companyId: COMPANY_ID,
      paymentId: matchedPayment.id,
      statementLineId: matchedLine.id,
      action: 'matched',
      summary: 'Seeded matched payment against statement line',
      metadata: toJson({
        source: 'comprehensive_seed',
      }),
    },
  });

  await prisma.collectionTask.create({
    data: {
      companyId: COMPANY_ID,
      customerId: customers[0].id,
      invoiceId: firstInvoice.id,
      assignedToUserId: northRep.id,
      salespersonUserId: northRep.id,
      status: 'open',
      priority: 'high',
      channel: 'call',
      dueDate: addDays(new Date(), 2),
      nextActionDate: addDays(new Date(), 1),
      promiseToPayDate: addDays(new Date(), 5),
      promiseToPayAmount: new Decimal(5000),
      outcome: 'follow_up_due',
      notes: 'Seeded collection task for overdue follow-up',
    },
  });

  const territory = await prisma.salesTerritory.create({
    data: {
      companyId: COMPANY_ID,
      code: 'NORTH',
      name: 'North Territory',
      managerUserId: northRep.id,
      status: 'active',
    },
  });

  const route = await prisma.salesRoute.create({
    data: {
      companyId: COMPANY_ID,
      territoryId: territory.id,
      code: 'NORTH-A',
      name: 'North Route A',
      defaultWarehouseId: branchWarehouse.id,
      managerUserId: northRep.id,
      status: 'active',
    },
  });

  const beat = await prisma.salesBeat.create({
    data: {
      companyId: COMPANY_ID,
      territoryId: territory.id,
      routeId: route.id,
      code: 'NORTH-A-MON',
      name: 'North Monday Beat',
      dayOfWeek: 'monday',
      sequenceNo: 1,
      status: 'active',
    },
  });

  await prisma.salespersonRouteAssignment.createMany({
    data: [
      {
        companyId: COMPANY_ID,
        salespersonUserId: northRep.id,
        territoryId: territory.id,
        routeId: route.id,
        beatId: beat.id,
        isPrimary: true,
        effectiveFrom: new Date(),
      },
      {
        companyId: COMPANY_ID,
        salespersonUserId: southRep.id,
        territoryId: territory.id,
        routeId: route.id,
        beatId: beat.id,
        isPrimary: false,
        effectiveFrom: new Date(),
      },
    ],
    skipDuplicates: false,
  });

  await prisma.customerSalesCoverage.createMany({
    data: customers.slice(0, 2).map((customer, index) => ({
      companyId: COMPANY_ID,
      customerId: customer.id,
      salespersonUserId: index === 0 ? northRep.id : southRep.id,
      territoryId: territory.id,
      routeId: route.id,
      beatId: beat.id,
      visitFrequency: 'weekly',
      preferredVisitDay: 'monday',
      priority: index === 0 ? 'high' : 'normal',
      isActive: true,
      effectiveFrom: new Date(),
      notes: 'Seeded route coverage',
    })),
  });

  const visitPlan = await prisma.salesVisitPlan.create({
    data: {
      companyId: COMPANY_ID,
      visitDate: new Date(),
      salespersonUserId: northRep.id,
      customerId: customers[0].id,
      territoryId: territory.id,
      routeId: route.id,
      beatId: beat.id,
      planSource: 'generated',
      priority: 'high',
      sequenceNo: 1,
      status: 'planned',
      generatedByUserId: owner.id,
      notes: 'Seeded visit plan',
    },
  });

  const visit = await prisma.salesVisit.create({
    data: {
      companyId: COMPANY_ID,
      visitPlanId: visitPlan.id,
      salespersonUserId: northRep.id,
      customerId: customers[0].id,
      territoryId: territory.id,
      routeId: route.id,
      beatId: beat.id,
      visitDate: new Date(),
      checkInAt: new Date(),
      checkOutAt: addDays(new Date(), 0),
      status: 'completed',
      primaryOutcome: 'order_collected',
      productiveFlag: true,
      notes: 'Seeded completed field visit',
      nextFollowUpDate: addDays(new Date(), 7),
    },
  });

  await prisma.salesVisitOutcome.create({
    data: {
      companyId: COMPANY_ID,
      visitId: visit.id,
      outcomeType: 'order_captured',
      amount: new Decimal(7200),
      remarks: 'Seeded order capture outcome',
    },
  });

  await prisma.repDailyReport.create({
    data: {
      companyId: COMPANY_ID,
      salespersonUserId: northRep.id,
      reportDate: new Date(),
      plannedVisitsCount: 3,
      completedVisitsCount: 2,
      missedVisitsCount: 1,
      productiveVisitsCount: 2,
      quotationsCount: 1,
      salesOrdersCount: 1,
      salesOrderValue: new Decimal(7200),
      collectionUpdatesCount: 1,
      closingNotes: 'Seeded DCR summary',
      issues: ['Traffic delay at outer ring road'],
      status: 'submitted',
      submittedAt: new Date(),
      reviewedByUserId: owner.id,
      reviewedAt: new Date(),
      reviewNotes: 'Looks good',
    },
  });

  const migrationProject = await prisma.migrationProject.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Legacy ERP Migration',
      sourceSystem: 'Marg Import',
      goLiveDate: addDays(new Date(), 14),
      status: 'active',
      notes: 'Seeded migration project',
      checklist: toJson({
        masters_uploaded: true,
        stock_verified: false,
      }),
      createdByUserId: owner.id,
    },
  });

  const importProfile = await prisma.importProfile.create({
    data: {
      companyId: COMPANY_ID,
      entityType: 'customers',
      name: 'Marg Customer Import',
      sourceFormat: 'xlsx',
      columnMappings: toJson({
        customer_name: 'name',
        gstin_no: 'gstin',
        phone_no: 'phone',
      }),
      options: toJson({
        skip_duplicates: true,
      }),
      createdByUserId: owner.id,
    },
  });

  const importJob = await prisma.importJob.create({
    data: {
      companyId: COMPANY_ID,
      migrationProjectId: migrationProject.id,
      importProfileId: importProfile.id,
      entityType: 'customers',
      sourceFormat: 'xlsx',
      mode: 'dry_run',
      status: 'committed',
      fileName: 'customers_marg_seed.xlsx',
      sourceDigest: sha256('customers_marg_seed.xlsx'),
      summary: toJson({
        rows_total: 3,
        rows_committed: 2,
        rows_warning: 1,
      }),
      createdByUserId: owner.id,
      committedAt: new Date(),
    },
  });

  await prisma.importJobRow.createMany({
    data: [
      {
        companyId: COMPANY_ID,
        importJobId: importJob.id,
        rowNumber: 1,
        rawPayloadJson: toJson({ customer_name: 'Seed Customer A' }),
        normalizedPayloadJson: toJson({ name: 'Seed Customer A' }),
        status: 'committed',
        resultEntityType: 'customer',
        resultEntityId: customers[0].id,
      },
      {
        companyId: COMPANY_ID,
        importJobId: importJob.id,
        rowNumber: 2,
        rawPayloadJson: toJson({ customer_name: 'Seed Customer B' }),
        normalizedPayloadJson: toJson({ name: 'Seed Customer B' }),
        status: 'warning',
        warningCodesJson: ['missing_gstin'],
      },
    ],
  });

  const printTemplate = await prisma.printTemplate.create({
    data: {
      companyId: COMPANY_ID,
      templateType: 'invoice',
      name: 'Distributor Invoice Classic',
      status: 'published',
      isDefault: true,
      createdByUserId: owner.id,
    },
  });

  const printTemplateVersion = await prisma.printTemplateVersion.create({
    data: {
      companyId: COMPANY_ID,
      printTemplateId: printTemplate.id,
      versionNo: 1,
      schemaVersion: '1',
      layoutJson: toJson({
        palette: 'blue_ink',
        blocks: ['header', 'customer', 'items', 'totals'],
      }),
      sampleOptionsJson: toJson({
        watermark: false,
      }),
      createdByUserId: owner.id,
    },
  });

  await prisma.printTemplate.update({
    where: { id: printTemplate.id },
    data: {
      publishedVersionId: printTemplateVersion.id,
    },
  });

  const customField = await prisma.customFieldDefinition.create({
    data: {
      companyId: COMPANY_ID,
      entityType: 'customer',
      code: 'market_segment',
      label: 'Market Segment',
      fieldType: 'select',
      isRequired: false,
      isActive: true,
      isSearchable: true,
      isPrintable: false,
      isExportable: true,
      optionsJson: toJson(['Retail', 'Wholesale', 'Online']),
      createdByUserId: owner.id,
    },
  });

  await prisma.customFieldValue.create({
    data: {
      companyId: COMPANY_ID,
      definitionId: customField.id,
      entityType: 'customer',
      entityId: customers[0].id,
      valueJson: toJson('Wholesale'),
    },
  });

  const webhookEndpoint = await prisma.outboundWebhookEndpoint.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Demo Webhook Consumer',
      url: 'https://example.com/webhooks/gst-billing',
      secretHash: 'demo_webhook_shared_secret',
      subscribedEvents: toJson([
        'invoice.issued',
        'payment.received',
        'integration.test',
      ]),
      status: 'active',
      createdByUserId: owner.id,
      lastSuccessAt: new Date(),
    },
  });

  await prisma.outboundWebhookDelivery.create({
    data: {
      companyId: COMPANY_ID,
      endpointId: webhookEndpoint.id,
      eventType: 'invoice.issued',
      eventKey: `invoice:${firstInvoice.id}:issued`,
      requestHeadersJson: toJson({
        'content-type': 'application/json',
      }),
      requestBodyJson: toJson({
        invoice_id: firstInvoice.id,
      }),
      responseStatus: 200,
      responseBodyExcerpt: '{"ok":true}',
      status: 'delivered',
      attemptCount: 1,
    },
  });

  await prisma.integrationApiKey.create({
    data: {
      companyId: COMPANY_ID,
      name: 'ERP Connector',
      keyPrefix: 'gbs_seed_1',
      secretHash: sha256('gbs_seed_full_secret'),
      status: 'active',
      createdByUserId: owner.id,
      lastUsedAt: new Date(),
    },
  });

  const challanQuotation = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/quotations`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customers[1].id,
        issue_date: new Date().toISOString().slice(0, 10),
        expiry_date: addDays(new Date(), 10).toISOString().slice(0, 10),
        items: [
          {
            product_id: products[0].id,
            quantity: '2',
            unit_price: String(Number(products[0].price ?? 1500)),
          },
          {
            product_id: products[1].id,
            quantity: '6',
            unit_price: String(Number(products[1].price ?? 250)),
          },
        ],
      }),
    },
  );

  await apiRequest(
    `/companies/${COMPANY_ID}/quotations/${challanQuotation.data.id}/approve`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  const challanSalesOrder = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/quotations/${challanQuotation.data.id}/convert-to-sales-order`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  await apiRequest(
    `/companies/${COMPANY_ID}/sales-orders/${challanSalesOrder.data.id}/confirm`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  const seededSalesOrder = await prisma.salesOrder.findUniqueOrThrow({
    where: { id: challanSalesOrder.data.id },
    include: {
      items: true,
    },
  });

  const challan = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/sales-orders/${seededSalesOrder.id}/delivery-challans`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        warehouse_id: mainWarehouse.id,
        challan_date: new Date().toISOString().slice(0, 10),
        transporter_name: 'Blue Dart Surface',
        vehicle_number: 'MH12AB1234',
        dispatch_notes: 'Seeded dispatch flow',
        items: seededSalesOrder.items.map((item) => ({
          sales_order_item_id: item.id,
          quantity_requested: item.quantityOrdered.toString(),
          quantity_dispatched: item.quantityOrdered.toString(),
        })),
      }),
    },
  );

  await apiRequest(
    `/companies/${COMPANY_ID}/delivery-challans/${challan.data.id}/status`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ status: 'packed' }),
    },
  );
  await apiRequest(
    `/companies/${COMPANY_ID}/delivery-challans/${challan.data.id}/status`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ status: 'dispatched', dispatch_notes: 'Seeded dispatch' }),
    },
  );
  await apiRequest(
    `/companies/${COMPANY_ID}/delivery-challans/${challan.data.id}/status`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ status: 'delivered', delivery_notes: 'Seeded delivery confirmation' }),
    },
  );

  const challanInvoiceDraft = await apiRequest<{ data: { id: string } }>(
    `/companies/${COMPANY_ID}/delivery-challans/${challan.data.id}/convert-to-invoice`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ series_code: 'DEFAULT' }),
    },
  );

  await apiRequest(
    `/companies/${COMPANY_ID}/invoices/${challanInvoiceDraft.data.id}/issue`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ series_code: 'DEFAULT' }),
    },
  );

  const complianceInvoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: challanInvoiceDraft.data.id },
  });

  const eInvoiceDocument = await prisma.eInvoiceDocument.create({
    data: {
      companyId: COMPANY_ID,
      invoiceId: complianceInvoice.id,
      provider: 'sandbox_local',
      status: 'generated',
      eligibilityStatus: 'eligible',
      irn: sha256(`${complianceInvoice.id}:irn`),
      ackNo: '12345678901234',
      ackDate: new Date(),
      signedInvoiceJson: toJson({
        irn: 'seeded',
      }),
      signedQrPayload: 'seeded-qr-payload',
      requestPayload: toJson({
        invoice_id: complianceInvoice.id,
      }),
      responsePayload: toJson({
        status: 'success',
      }),
      lastSyncedAt: new Date(),
    },
  });

  const eWayBillDocument = await prisma.eWayBillDocument.create({
    data: {
      companyId: COMPANY_ID,
      invoiceId: complianceInvoice.id,
      provider: 'sandbox_local',
      status: 'generated',
      eligibilityStatus: 'eligible',
      ewayBillNumber: '181001234567',
      transportMode: 'road',
      transporterName: 'Blue Dart Surface',
      vehicleNumber: 'MH12AB1234',
      distanceKm: 42,
      validFrom: new Date(),
      validUntil: addDays(new Date(), 1),
      requestPayload: toJson({
        invoice_id: complianceInvoice.id,
      }),
      responsePayload: toJson({
        status: 'success',
      }),
      lastSyncedAt: new Date(),
    },
  });

  await prisma.invoiceComplianceEvent.createMany({
    data: [
      {
        companyId: COMPANY_ID,
        invoiceId: complianceInvoice.id,
        eInvoiceDocumentId: eInvoiceDocument.id,
        eventType: 'einvoice.generated',
        status: 'success',
        summary: 'Seeded e-invoice generation event',
      },
      {
        companyId: COMPANY_ID,
        invoiceId: complianceInvoice.id,
        eWayBillDocumentId: eWayBillDocument.id,
        eventType: 'eway.generated',
        status: 'success',
        summary: 'Seeded e-way bill generation event',
      },
    ],
  });

  await prisma.supportTicket.createMany({
    data: [
      {
        email: 'ops@example.com',
        name: 'Operations Desk',
        subject: 'Need batch expiry walkthrough',
        message: 'Please help with the near-expiry stock workspace.',
        status: 'open',
        priority: 'normal',
      },
      {
        email: 'owner@example.com',
        name: 'Owner',
        subject: 'Subscription upgrade question',
        message: 'How do I move from Silver to Gold with more companies?',
        status: 'open',
        priority: 'high',
      },
    ],
  });
}

async function seedAdditionalSaasCompanies() {
  const basePassword = 'password123';
  const companies = [
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Trial Company',
      businessType: 'WHOLESALE',
      gstin: '29ABCDE1234F1Z1',
      ownerEmail: 'trial.owner@example.com',
      ownerName: 'Trial Owner',
      planCode: 'basic',
      status: 'trialing',
      trialStartedAt: new Date(),
      trialEndsAt: addDays(new Date(), 20),
      trialStatus: 'trialing' as const,
      usage: {
        issued_invoice_count: 12,
        invoice_billed_value_inr: 54000,
        active_full_seat_count: 1,
        active_view_only_seat_count: 0,
        active_company_count: 1,
      },
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Expired Trial Company',
      businessType: 'WHOLESALE',
      gstin: '07ABCDE1234F1Z7',
      ownerEmail: 'expired.owner@example.com',
      ownerName: 'Expired Owner',
      planCode: 'basic',
      status: 'trialing',
      trialStartedAt: addDays(new Date(), -40),
      trialEndsAt: addDays(new Date(), -10),
      trialStatus: 'trial_expired' as const,
      usage: {
        issued_invoice_count: 18,
        invoice_billed_value_inr: 82000,
        active_full_seat_count: 1,
        active_view_only_seat_count: 0,
        active_company_count: 1,
      },
    },
    {
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Nano Near Limit Company',
      businessType: 'WHOLESALE',
      gstin: '24ABCDE1234F1Z4',
      ownerEmail: 'nano.owner@example.com',
      ownerName: 'Nano Owner',
      planCode: 'nano',
      status: 'active',
      trialStartedAt: null,
      trialEndsAt: null,
      trialStatus: 'converted' as const,
      usage: {
        issued_invoice_count: 430,
        invoice_billed_value_inr: 142500,
        active_full_seat_count: 1,
        active_view_only_seat_count: 0,
        active_company_count: 1,
      },
    },
  ];

  for (const item of companies) {
    await ensureCompany({
      id: item.id,
      name: item.name,
      businessType: item.businessType,
      gstin: item.gstin,
    });
    await ensureUser({
      companyId: item.id,
      email: item.ownerEmail,
      name: item.ownerName,
      role: 'owner',
      password: basePassword,
    });
    await prisma.invoiceSeries.upsert({
      where: {
        companyId_code: {
          companyId: item.id,
          code: 'DEFAULT',
        },
      },
      update: { isActive: true },
      create: {
        companyId: item.id,
        code: 'DEFAULT',
        prefix: 'INV-',
        nextNumber: 1,
        isActive: true,
      },
    });
    await upsertSubscriptionBundle({
      companyId: item.id,
      planCode: item.planCode,
      status: item.status,
      trialStartedAt: item.trialStartedAt,
      trialEndsAt: item.trialEndsAt,
      trialStatus: item.trialStatus,
    });
    await upsertUsageMeters({
      companyId: item.id,
      values: item.usage,
    });
  }
}

async function seedMainCompanySaas() {
  await upsertSubscriptionBundle({
    companyId: COMPANY_ID,
    planCode: 'gold',
    status: 'active',
    trialStartedAt: addDays(new Date(), -45),
    trialEndsAt: addDays(new Date(), -15),
    trialStatus: 'converted',
    overrides: {
      extra_full_seats: 2,
      extra_view_only_seats: 1,
      company_uplift: 1,
      enforcement_mode: 'warn_only',
    },
  });
}

async function main() {
  const baseCompany = await prisma.company.findUnique({
    where: { id: COMPANY_ID },
  });
  const baseOwner = await prisma.user.findUnique({
    where: { id: OWNER_USER_ID },
  });
  const superAdmin = await prisma.user.findUnique({
    where: { id: SUPER_ADMIN_USER_ID },
  });

  if (!baseCompany || !baseOwner || !superAdmin) {
    throw new Error(
      'Seed prerequisite missing. Run seed:auth first so the base company, owner, and super admin exist.',
    );
  }

  for (const plan of buildPlanCatalog()) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceInr: plan.priceInr,
        billingInterval: plan.billingInterval,
        limits: toJson(plan.limits),
        isPublic: true,
        displayOrder: plan.displayOrder,
        trialDays: 30,
        allowAddOns: true,
        isActive: true,
      },
      create: {
        code: plan.code,
        name: plan.name,
        priceInr: plan.priceInr,
        billingInterval: plan.billingInterval,
        limits: toJson(plan.limits),
        isPublic: true,
        displayOrder: plan.displayOrder,
        trialDays: 30,
        allowAddOns: true,
        isActive: true,
      },
    });
  }

  await seedMainCompanySaas();
  await seedAdditionalSaasCompanies();

  const token = await apiLogin(OWNER_EMAIL, OWNER_PASSWORD);
  await seedAdvancedMainCompanyData(token);

  await upsertUsageMeters({
    companyId: COMPANY_ID,
    values: {
      active_full_seat_count: 4,
      active_view_only_seat_count: 0,
      active_company_count: 1,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    [
      'Comprehensive seed complete:',
      `- api: ${API_BASE_URL}`,
      `- main company: ${COMPANY_ID}`,
      `- owner: ${OWNER_EMAIL}`,
      '- plans: nano, basic, silver, gold',
      '- extra companies: trialing, expired-trial, near-limit',
      '- seeded modules: SaaS, pricing, notifications, collections, field sales, migration/customization, compliance, dispatch',
    ].join('\n'),
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
