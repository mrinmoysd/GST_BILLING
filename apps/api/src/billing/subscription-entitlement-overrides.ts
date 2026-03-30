import { z } from 'zod';

export const subscriptionEntitlementOverridesSchema = z.object({
  extra_full_seats: z.number().int().nonnegative().default(0),
  extra_view_only_seats: z.number().int().nonnegative().default(0),
  invoice_uplift_per_month: z.number().int().nonnegative().default(0),
  company_uplift: z.number().int().nonnegative().default(0),
  enforcement_mode: z
    .enum(['hard_block', 'wallet_overage', 'warn_only'])
    .nullable()
    .default(null),
});

export type SubscriptionEntitlementOverrides = z.infer<
  typeof subscriptionEntitlementOverridesSchema
>;

export function normalizeSubscriptionEntitlementOverrides(
  value: unknown,
): SubscriptionEntitlementOverrides {
  return subscriptionEntitlementOverridesSchema.parse(value ?? {});
}
