import { z } from 'zod';

const nullableWholeNumber = z.number().int().nonnegative().nullable();

const seatsSchema = z
  .object({
    included: z.number().int().nonnegative().default(0),
    max: nullableWholeNumber.default(null),
    extra_price_inr: z.number().nonnegative().default(0),
  })
  .default({
    included: 0,
    max: null,
    extra_price_inr: 0,
  });

const invoicesSchema = z
  .object({
    included_per_month: nullableWholeNumber.default(null),
    monthly_billing_value_inr: z.number().nonnegative().nullable().default(null),
    mode: z.enum(['hard_block', 'wallet_overage', 'warn_only']).default('warn_only'),
    overage_price_inr: z.number().nonnegative().default(0),
  })
  .default({
    included_per_month: null,
    monthly_billing_value_inr: null,
    mode: 'warn_only',
    overage_price_inr: 0,
  });

const companiesSchema = z
  .object({
    included: z.number().int().positive().default(1),
    max: nullableWholeNumber.default(null),
    extra_price_inr: z.number().nonnegative().default(0),
  })
  .default({
    included: 1,
    max: null,
    extra_price_inr: 0,
  });

const trialPolicySchema = z
  .object({
    enabled: z.boolean().default(true),
    days: z.number().int().nonnegative().default(30),
    require_payment_method_upfront: z.boolean().default(false),
    allow_full_access: z.boolean().default(true),
    allow_grace_period: z.boolean().default(false),
    block_on_expiry: z.boolean().default(true),
  })
  .default({
    enabled: true,
    days: 30,
    require_payment_method_upfront: false,
    allow_full_access: true,
    allow_grace_period: false,
    block_on_expiry: true,
  });

export const subscriptionPlanLimitsSchema = z
  .object({
    full_seats: seatsSchema,
    view_only_seats: seatsSchema,
    invoices: invoicesSchema,
    companies: companiesSchema,
    features: z.record(z.string(), z.boolean()).default({}),
    enforcement: z
    .object({
      allow_add_ons: z.boolean().default(true),
    })
      .default({ allow_add_ons: true }),
    trial: trialPolicySchema,
  })
  .default({
    full_seats: {
      included: 0,
      max: null,
      extra_price_inr: 0,
    },
    view_only_seats: {
      included: 0,
      max: null,
      extra_price_inr: 0,
    },
    invoices: {
      included_per_month: null,
      monthly_billing_value_inr: null,
      mode: 'warn_only',
      overage_price_inr: 0,
    },
    companies: {
      included: 1,
      max: null,
      extra_price_inr: 0,
    },
    features: {},
    enforcement: {
      allow_add_ons: true,
    },
    trial: {
      enabled: true,
      days: 30,
      require_payment_method_upfront: false,
      allow_full_access: true,
      allow_grace_period: false,
      block_on_expiry: true,
    },
  });

export type SubscriptionPlanLimits = z.infer<typeof subscriptionPlanLimitsSchema>;

export function normalizeSubscriptionPlanLimits(args: {
  limits: unknown;
  trialDays?: number | null;
  allowAddOns?: boolean | null;
}): SubscriptionPlanLimits {
  const parsed = subscriptionPlanLimitsSchema.parse(args.limits ?? {});

  return {
    ...parsed,
    enforcement: {
      ...parsed.enforcement,
      allow_add_ons: args.allowAddOns ?? parsed.enforcement.allow_add_ons,
    },
    trial: {
      ...parsed.trial,
      days:
        typeof args.trialDays === 'number' && Number.isFinite(args.trialDays)
          ? Math.max(0, Math.trunc(args.trialDays))
          : parsed.trial.days,
    },
  };
}
