import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BillingUsageService } from './billing-usage.service';
import { BillingWarningsService } from './billing-warnings.service';
import {
  SubscriptionEntitlementOverrides,
  normalizeSubscriptionEntitlementOverrides,
} from './subscription-entitlement-overrides';
import {
  SubscriptionPlanLimits,
  normalizeSubscriptionPlanLimits,
} from './subscription-plan-limits';

type SubscriptionWithPlan = Awaited<
  ReturnType<BillingEntitlementsService['getSubscriptionWithPlanOrThrow']>
>;

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export type TrialStatus =
  | 'not_applicable'
  | 'trialing'
  | 'trial_expired'
  | 'converted';

@Injectable()
export class BillingEntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: BillingUsageService,
    private readonly warnings: BillingWarningsService,
  ) {}

  private async getSubscriptionWithPlanOrThrow(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        planRel: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  normalizePlanLimits(subscriptionPlan: {
    limits?: unknown;
    trialDays?: number | null;
    allowAddOns?: boolean | null;
  }): SubscriptionPlanLimits {
    return normalizeSubscriptionPlanLimits({
      limits: subscriptionPlan.limits,
      trialDays: subscriptionPlan.trialDays,
      allowAddOns: subscriptionPlan.allowAddOns,
    });
  }

  normalizeOverrides(overrides: unknown): SubscriptionEntitlementOverrides {
    return normalizeSubscriptionEntitlementOverrides(overrides);
  }

  private applyOverridesToLimits(
    limits: SubscriptionPlanLimits,
    overrides: SubscriptionEntitlementOverrides,
  ): SubscriptionPlanLimits {
    const invoiceBase = limits.invoices.included_per_month ?? 0;
    const companyBase = limits.companies.included;
    return {
      ...limits,
      full_seats: {
        ...limits.full_seats,
        included: limits.full_seats.included + overrides.extra_full_seats,
      },
      view_only_seats: {
        ...limits.view_only_seats,
        included:
          limits.view_only_seats.included + overrides.extra_view_only_seats,
      },
      invoices: {
        ...limits.invoices,
        included_per_month:
          limits.invoices.included_per_month === null &&
          overrides.invoice_uplift_per_month === 0
            ? null
            : invoiceBase + overrides.invoice_uplift_per_month,
        mode: overrides.enforcement_mode ?? limits.invoices.mode,
      },
      companies: {
        ...limits.companies,
        included: companyBase + overrides.company_uplift,
      },
    };
  }

  resolveTrialState(subscription: {
    status?: string | null;
    createdAt: Date;
    trialStartedAt?: Date | null;
    trialEndsAt?: Date | null;
  }, limits: SubscriptionPlanLimits) {
    const trialEnabled = Boolean(limits.trial.enabled);
    const paidStatuses = new Set(['active', 'past_due', 'cancelled']);
    const startedAt =
      subscription.trialStartedAt ??
      (trialEnabled ? subscription.createdAt : null);
    const endsAt =
      subscription.trialEndsAt ??
      (trialEnabled && startedAt
        ? addDays(startedAt, limits.trial.days)
        : null);

    let trialStatus: TrialStatus = 'not_applicable';

    if (trialEnabled && startedAt && endsAt) {
      if (paidStatuses.has(String(subscription.status ?? ''))) {
        trialStatus = 'converted';
      } else if (endsAt.getTime() < Date.now()) {
        trialStatus = 'trial_expired';
      } else {
        trialStatus = 'trialing';
      }
    }

    return {
      trialStartedAt: startedAt,
      trialEndsAt: endsAt,
      trialStatus,
      daysRemaining:
        trialStatus === 'trialing' && endsAt
          ? Math.max(
              0,
              Math.ceil(
                (endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              ),
            )
          : 0,
    };
  }

  private serializeEffectiveLimits(
    limits: SubscriptionPlanLimits,
    overrides: SubscriptionEntitlementOverrides,
    trial: ReturnType<BillingEntitlementsService['resolveTrialState']>,
  ) {
    const effective = this.applyOverridesToLimits(limits, overrides);
    return {
      ...effective,
      overrides,
      trial: {
        ...effective.trial,
        status: trial.trialStatus,
        started_at: trial.trialStartedAt?.toISOString() ?? null,
        ends_at: trial.trialEndsAt?.toISOString() ?? null,
        days_remaining: trial.daysRemaining,
      },
    };
  }

  async syncEntitlementForSubscription(subscriptionId: string) {
    const subscription = await this.getSubscriptionWithPlanOrThrow(subscriptionId);
    const limits = this.normalizePlanLimits(subscription.planRel ?? {});
    const existingEntitlement = await this.prisma.companyEntitlement.findUnique({
      where: { companyId: subscription.companyId },
      select: { overrides: true },
    });
    const overrides = this.normalizeOverrides(existingEntitlement?.overrides);
    const trial = this.resolveTrialState(subscription, limits);
    const now = new Date();
    const billingPeriodStart = startOfUtcMonth(now);
    const billingPeriodEnd = endOfUtcMonth(now);

    return this.prisma.companyEntitlement.upsert({
      where: { companyId: subscription.companyId },
      update: {
        subscriptionId: subscription.id,
        planCode: subscription.plan ?? null,
        status: subscription.status ?? 'inactive',
        effectiveLimits: this.serializeEffectiveLimits(
          limits,
          overrides,
          trial,
        ) as object,
        overrides: overrides as object,
        billingPeriodStart,
        billingPeriodEnd,
        trialStartedAt: trial.trialStartedAt,
        trialEndsAt: trial.trialEndsAt,
        trialStatus: trial.trialStatus,
        updatedAt: new Date(),
      },
      create: {
        companyId: subscription.companyId,
        subscriptionId: subscription.id,
        planCode: subscription.plan ?? null,
        status: subscription.status ?? 'inactive',
        effectiveLimits: this.serializeEffectiveLimits(
          limits,
          overrides,
          trial,
        ) as object,
        overrides: overrides as object,
        billingPeriodStart,
        billingPeriodEnd,
        trialStartedAt: trial.trialStartedAt,
        trialEndsAt: trial.trialEndsAt,
        trialStatus: trial.trialStatus,
      },
    });
  }

  async syncEntitlementForCompany(companyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
      select: { id: true },
    });

    if (!subscription) {
      return this.prisma.companyEntitlement.deleteMany({
        where: { companyId },
      });
    }

    return this.syncEntitlementForSubscription(subscription.id);
  }

  async getCompanyEntitlement(companyId: string) {
    return this.prisma.companyEntitlement.findUnique({
      where: { companyId },
    });
  }

  async setEntitlementOverrides(args: {
    companyId: string;
    subscriptionId?: string | null;
    overrides: unknown;
  }) {
    const normalized = this.normalizeOverrides(args.overrides);
    await this.prisma.companyEntitlement.upsert({
      where: { companyId: args.companyId },
      update: {
        subscriptionId: args.subscriptionId ?? undefined,
        overrides: normalized as object,
        updatedAt: new Date(),
      },
      create: {
        companyId: args.companyId,
        subscriptionId: args.subscriptionId ?? null,
        overrides: normalized as object,
      },
    });

    if (args.subscriptionId) {
      return this.syncEntitlementForSubscription(args.subscriptionId);
    }

    return this.syncEntitlementForCompany(args.companyId);
  }

  async getTenantSubscriptionSummary(companyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        planRel: true,
      },
    });

    if (!subscription) {
      return null;
    }

    const entitlement = await this.syncEntitlementForSubscription(
      subscription.id,
    );

    const limits = this.normalizePlanLimits(subscription.planRel ?? {});
    const trial = this.resolveTrialState(subscription, limits);

    const usage = await this.usage.getCurrentUsageSummary(companyId);
    const warningSummary = this.warnings.evaluate({
      effectiveLimits: entitlement?.effectiveLimits,
      usageSummary: usage.summary,
      trialStatus: trial.trialStatus,
      trialDaysRemaining: trial.daysRemaining,
      trialEndsAt: trial.trialEndsAt?.toISOString() ?? null,
    });
    const operationalWriteBlocked =
      trial.trialStatus === 'trial_expired' && limits.trial.block_on_expiry;

    return {
      id: subscription.id,
      companyId: subscription.companyId,
      planId: subscription.planId,
      plan: subscription.plan,
      planName: subscription.planRel?.name ?? subscription.plan ?? null,
      status: subscription.status,
      startedAt: subscription.startedAt?.toISOString() ?? null,
      expiresAt: subscription.expiresAt?.toISOString() ?? null,
      provider: subscription.provider,
      createdAt: subscription.createdAt.toISOString(),
      metadata: subscription.metadata ?? null,
      trialStartedAt: trial.trialStartedAt?.toISOString() ?? null,
      trialEndsAt: trial.trialEndsAt?.toISOString() ?? null,
      trialStatus: trial.trialStatus,
      trialDaysRemaining: trial.daysRemaining,
      accessControl: {
        operationalWriteBlocked,
        reason: operationalWriteBlocked ? 'trial_expired' : null,
      },
      usage,
      warnings: warningSummary,
      entitlement: entitlement
        ? {
            id: entitlement.id,
            planCode: entitlement.planCode,
            status: entitlement.status,
            effectiveLimits: entitlement.effectiveLimits,
            billingPeriodStart:
              entitlement.billingPeriodStart?.toISOString() ?? null,
            billingPeriodEnd:
              entitlement.billingPeriodEnd?.toISOString() ?? null,
            trialStartedAt:
              entitlement.trialStartedAt?.toISOString() ?? null,
            trialEndsAt: entitlement.trialEndsAt?.toISOString() ?? null,
            trialStatus: entitlement.trialStatus,
          }
        : null,
    };
  }

  async listStructuredPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { priceInr: 'asc' }],
    });

    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price_inr: Number(plan.priceInr),
      billing_interval: plan.billingInterval,
      is_active: plan.isActive,
      is_public: plan.isPublic,
      display_order: plan.displayOrder,
      trial_days: plan.trialDays,
      allow_add_ons: plan.allowAddOns,
      limits: this.normalizePlanLimits(plan),
    }));
  }
}
