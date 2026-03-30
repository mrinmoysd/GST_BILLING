import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { BillingEnforcementService } from './billing-enforcement.service';

describe('BillingEnforcementService', () => {
  const companyId = '550e8400-e29b-41d4-a716-446655440000';

  function createService(args?: {
    entitlement?: any;
    userCount?: number;
    invoiceCount?: number;
    invoiceTotal?: Decimal;
  }) {
    const prisma = {
      user: {
        count: jest.fn().mockResolvedValue(args?.userCount ?? 0),
        findFirst: jest.fn(),
      },
      invoice: {
        count: jest.fn().mockResolvedValue(args?.invoiceCount ?? 0),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { total: args?.invoiceTotal ?? new Decimal(0) },
        }),
      },
    };

    const entitlements = {
      getCompanyEntitlement: jest.fn().mockResolvedValue(
        args?.entitlement ?? {
          id: 'ent_1',
          companyId,
          trialStatus: 'converted',
          effectiveLimits: {
            full_seats: { included: 2, max: null, extra_price_inr: 0 },
            view_only_seats: { included: 0, max: null, extra_price_inr: 0 },
            invoices: {
              included_per_month: 10,
              monthly_billing_value_inr: null,
              mode: 'hard_block',
              overage_price_inr: 0,
            },
            companies: { included: 1, max: null, extra_price_inr: 0 },
            features: {},
            enforcement: { allow_add_ons: true },
            trial: {
              enabled: true,
              days: 30,
              require_payment_method_upfront: false,
              allow_full_access: true,
              allow_grace_period: false,
              block_on_expiry: true,
            },
          },
        },
      ),
      syncEntitlementForCompany: jest.fn().mockResolvedValue(null),
      normalizePlanLimits: jest.fn().mockImplementation(({ limits }) => limits),
    };

    const service = new BillingEnforcementService(
      prisma as any,
      entitlements as any,
    );

    return { service, prisma, entitlements };
  }

  it('blocks expired-trial operational writes outside subscription management', async () => {
    const { service } = createService({
      entitlement: {
        id: 'ent_1',
        companyId,
        trialStatus: 'trial_expired',
        effectiveLimits: {
          full_seats: { included: 2, max: null, extra_price_inr: 0 },
          view_only_seats: { included: 0, max: null, extra_price_inr: 0 },
          invoices: {
            included_per_month: 10,
            monthly_billing_value_inr: null,
            mode: 'hard_block',
            overage_price_inr: 0,
          },
          companies: { included: 1, max: null, extra_price_inr: 0 },
          features: {},
          enforcement: { allow_add_ons: true },
          trial: {
            enabled: true,
            days: 30,
            require_payment_method_upfront: false,
            allow_full_access: true,
            allow_grace_period: false,
            block_on_expiry: true,
          },
        },
      },
    });

    await expect(
      service.assertCompanyWriteAllowed({
        companyId,
        method: 'POST',
        path: `/api/companies/${companyId}/invoices`,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.assertCompanyWriteAllowed({
        companyId,
        method: 'POST',
        path: `/api/companies/${companyId}/subscription/checkout`,
      }),
    ).resolves.toBeUndefined();
  });

  it('blocks active-user invite when the seat cap is reached', async () => {
    const { service } = createService({ userCount: 2 });

    await expect(
      service.assertSeatAvailableForInvite({
        companyId,
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks invoice issue when the hard invoice cap would be exceeded', async () => {
    const { service } = createService({ invoiceCount: 10 });

    await expect(
      service.assertInvoiceIssueAllowed({
        companyId,
        invoiceTotal: new Decimal(1500),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
