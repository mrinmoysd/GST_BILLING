import { Injectable } from '@nestjs/common';

import {
  SubscriptionPlanLimits,
  normalizeSubscriptionPlanLimits,
} from './subscription-plan-limits';

export type BillingWarningSeverity = 'info' | 'warning' | 'critical';
export type BillingWarningCategory =
  | 'trial'
  | 'invoices'
  | 'invoice_value'
  | 'full_seats'
  | 'view_only_seats'
  | 'companies';

export type BillingWarningItem = {
  code: string;
  category: BillingWarningCategory;
  severity: BillingWarningSeverity;
  title: string;
  message: string;
  used?: number;
  limit?: number | null;
  ratio_percent?: number | null;
  threshold_percent?: number | null;
};

export type BillingWarningSummary = {
  highest_severity: BillingWarningSeverity | 'none';
  items: BillingWarningItem[];
  counts: Record<BillingWarningSeverity, number>;
};

type EvaluateArgs = {
  effectiveLimits?: unknown;
  usageSummary?: Record<string, number> | null;
  trialStatus?: string | null;
  trialDaysRemaining?: number | null;
  trialEndsAt?: string | null;
};

function severityRank(severity: BillingWarningSeverity | 'none') {
  switch (severity) {
    case 'critical':
      return 3;
    case 'warning':
      return 2;
    case 'info':
      return 1;
    default:
      return 0;
  }
}

@Injectable()
export class BillingWarningsService {
  private toLimits(value: unknown): SubscriptionPlanLimits {
    return normalizeSubscriptionPlanLimits({
      limits: value ?? {},
    });
  }

  private severityForRatio(
    ratioPercent: number,
  ): { severity: BillingWarningSeverity; thresholdPercent: number } | null {
    if (ratioPercent >= 100) {
      return { severity: 'critical', thresholdPercent: 100 };
    }
    if (ratioPercent >= 90) {
      return { severity: 'warning', thresholdPercent: 90 };
    }
    if (ratioPercent >= 70) {
      return { severity: 'info', thresholdPercent: 70 };
    }
    return null;
  }

  private quotaWarning(args: {
    code: string;
    category: BillingWarningCategory;
    label: string;
    used: number;
    limit: number | null | undefined;
    trialStatus?: string | null;
  }): BillingWarningItem | null {
    if (args.limit === null || args.limit === undefined || args.limit <= 0) {
      return null;
    }

    const ratioPercent = Math.round((args.used / args.limit) * 100);
    const threshold = this.severityForRatio(ratioPercent);
    if (!threshold) return null;

    const trialing = args.trialStatus === 'trialing';
    return {
      code: args.code,
      category: args.category,
      severity: threshold.severity,
      title:
        threshold.severity === 'critical'
          ? `${args.label} at or above plan limit`
          : `${args.label} nearing plan limit`,
      message: trialing
        ? `${args.used} of ${args.limit} ${args.label.toLowerCase()} are already in use. Trial access stays open, but this will matter once the company converts to a paid plan.`
        : `${args.used} of ${args.limit} ${args.label.toLowerCase()} are already in use this billing period.`,
      used: args.used,
      limit: args.limit,
      ratio_percent: ratioPercent,
      threshold_percent: threshold.thresholdPercent,
    };
  }

  private trialWarnings(args: {
    trialStatus?: string | null;
    trialDaysRemaining?: number | null;
    trialEndsAt?: string | null;
  }): BillingWarningItem[] {
    if (args.trialStatus === 'trial_expired') {
      return [
        {
          code: 'trial_expired',
          category: 'trial',
          severity: 'critical',
          title: 'Trial has expired',
          message:
            'This company is outside the trial window and should be upgraded or cancelled before enforcement begins.',
        },
      ];
    }

    if (args.trialStatus !== 'trialing') return [];

    const daysRemaining = Math.max(0, Number(args.trialDaysRemaining ?? 0));
    if (daysRemaining > 7) return [];

    const severity: BillingWarningSeverity =
      daysRemaining <= 1 ? 'critical' : daysRemaining <= 3 ? 'warning' : 'info';

    return [
      {
        code: `trial_ending_${daysRemaining}`,
        category: 'trial',
        severity,
        title:
          daysRemaining <= 1
            ? 'Trial ends tomorrow'
            : `Trial ends in ${daysRemaining} days`,
        message: args.trialEndsAt
          ? `The trial window ends on ${args.trialEndsAt}. Upgrade before expiry to avoid a hard operational block.`
          : 'Upgrade before expiry to avoid a hard operational block.',
      },
    ];
  }

  evaluate(args: EvaluateArgs): BillingWarningSummary {
    const limits = this.toLimits(args.effectiveLimits);
    const usage = args.usageSummary ?? {};
    const warnings: BillingWarningItem[] = [
      ...this.trialWarnings({
        trialStatus: args.trialStatus,
        trialDaysRemaining: args.trialDaysRemaining,
        trialEndsAt: args.trialEndsAt,
      }),
    ];

    const quotaWarnings = [
      this.quotaWarning({
        code: 'invoice_quota',
        category: 'invoices',
        label: 'Invoices',
        used: usage.issued_invoice_count ?? 0,
        limit: limits.invoices.included_per_month,
        trialStatus: args.trialStatus,
      }),
      this.quotaWarning({
        code: 'invoice_value_quota',
        category: 'invoice_value',
        label: 'Billed value',
        used: usage.invoice_billed_value_inr ?? 0,
        limit: limits.invoices.monthly_billing_value_inr,
        trialStatus: args.trialStatus,
      }),
      this.quotaWarning({
        code: 'full_seat_quota',
        category: 'full_seats',
        label: 'Full seats',
        used: usage.active_full_seat_count ?? 0,
        limit: limits.full_seats.included,
        trialStatus: args.trialStatus,
      }),
      this.quotaWarning({
        code: 'view_only_seat_quota',
        category: 'view_only_seats',
        label: 'View-only seats',
        used: usage.active_view_only_seat_count ?? 0,
        limit: limits.view_only_seats.included,
        trialStatus: args.trialStatus,
      }),
      this.quotaWarning({
        code: 'company_quota',
        category: 'companies',
        label: 'Companies',
        used: usage.active_company_count ?? 0,
        limit: limits.companies.included,
        trialStatus: args.trialStatus,
      }),
    ].filter((item): item is BillingWarningItem => Boolean(item));

    warnings.push(...quotaWarnings);
    warnings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

    const counts: Record<BillingWarningSeverity, number> = {
      info: warnings.filter((warning) => warning.severity === 'info').length,
      warning: warnings.filter((warning) => warning.severity === 'warning').length,
      critical: warnings.filter((warning) => warning.severity === 'critical').length,
    };

    return {
      highest_severity: warnings[0]?.severity ?? 'none',
      items: warnings,
      counts,
    };
  }

  filter(
    summary: BillingWarningSummary,
    categories: BillingWarningCategory[],
  ): BillingWarningSummary {
    const items = summary.items.filter((item) => categories.includes(item.category));
    const counts: Record<BillingWarningSeverity, number> = {
      info: items.filter((warning) => warning.severity === 'info').length,
      warning: items.filter((warning) => warning.severity === 'warning').length,
      critical: items.filter((warning) => warning.severity === 'critical').length,
    };

    return {
      highest_severity: items[0]?.severity ?? 'none',
      items,
      counts,
    };
  }
}
