import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { BillingEntitlementsService } from './billing-entitlements.service';
import { SubscriptionPlanLimits } from './subscription-plan-limits';

type DbClient = PrismaService | Prisma.TransactionClient;

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

@Injectable()
export class BillingEnforcementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  private getClient(client?: DbClient) {
    return client ?? this.prisma;
  }

  private async getEntitlementContext(companyId: string) {
    let entitlement = await this.entitlements.getCompanyEntitlement(companyId);
    if (!entitlement) {
      await this.entitlements.syncEntitlementForCompany(companyId);
      entitlement = await this.entitlements.getCompanyEntitlement(companyId);
    }

    if (!entitlement) {
      return null;
    }

    const limits = this.entitlements.normalizePlanLimits({
      limits: entitlement.effectiveLimits,
    });

    return {
      entitlement,
      limits,
    };
  }

  private shouldBypassQuotaEnforcement(args: {
    trialStatus?: string | null;
    limits: SubscriptionPlanLimits;
  }) {
    return (
      args.trialStatus === 'trialing' && args.limits.trial.allow_full_access
    );
  }

  private resolveSeatCap(limits: SubscriptionPlanLimits) {
    if (limits.full_seats.max === null) {
      return limits.full_seats.included;
    }

    return Math.min(limits.full_seats.included, limits.full_seats.max);
  }

  private isWriteMethod(method?: string) {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      String(method ?? '').toUpperCase(),
    );
  }

  private isTrialExpiryAllowedWrite(path: string, companyId: string) {
    const pathname = String(path ?? '').split('?')[0];
    const subscriptionPrefix = `/api/companies/${companyId}/subscription`;
    return (
      pathname === subscriptionPrefix ||
      pathname.startsWith(`${subscriptionPrefix}/`)
    );
  }

  async assertCompanyWriteAllowed(args: {
    companyId: string;
    method?: string;
    path?: string;
  }) {
    if (!this.isWriteMethod(args.method)) {
      return;
    }

    if (this.isTrialExpiryAllowedWrite(args.path ?? '', args.companyId)) {
      return;
    }

    const context = await this.getEntitlementContext(args.companyId);
    if (!context) {
      return;
    }

    if (
      context.entitlement.trialStatus === 'trial_expired' &&
      context.limits.trial.block_on_expiry
    ) {
      throw new ForbiddenException({
        code: 'TRIAL_EXPIRED',
        message:
          'Your trial has ended. Upgrade or cancel the subscription to continue making changes.',
      });
    }
  }

  async assertSeatAvailableForInvite(args: {
    companyId: string;
    isActive: boolean;
    client?: DbClient;
  }) {
    if (!args.isActive) {
      return;
    }

    const context = await this.getEntitlementContext(args.companyId);
    if (!context) {
      return;
    }

    if (
      this.shouldBypassQuotaEnforcement({
        trialStatus: context.entitlement.trialStatus,
        limits: context.limits,
      })
    ) {
      return;
    }

    const seatCap = this.resolveSeatCap(context.limits);
    if (seatCap <= 0) {
      throw new ConflictException({
        code: 'SEAT_LIMIT_REACHED',
        message:
          'This plan does not allow more active users. Upgrade the subscription or deactivate another user first.',
      });
    }

    const client = this.getClient(args.client);
    const activeUsers = await client.user.count({
      where: {
        companyId: args.companyId,
        isActive: true,
      },
    });

    if (activeUsers + 1 > seatCap) {
      throw new ConflictException({
        code: 'SEAT_LIMIT_REACHED',
        message:
          'This plan has reached its active user limit. Upgrade the subscription or deactivate another user first.',
      });
    }
  }

  async assertSeatAvailableForUserPatch(args: {
    companyId: string;
    userId: string;
    nextIsActive?: boolean;
    client?: DbClient;
  }) {
    const client = this.getClient(args.client);
    const existing = await client.user.findFirst({
      where: {
        id: args.userId,
        companyId: args.companyId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!existing) {
      return;
    }

    const nextIsActive = args.nextIsActive ?? existing.isActive;
    const increasesSeatUsage = !existing.isActive && nextIsActive;
    if (!increasesSeatUsage) {
      return;
    }

    await this.assertSeatAvailableForInvite({
      companyId: args.companyId,
      isActive: true,
      client,
    });
  }

  async assertInvoiceIssueAllowed(args: {
    companyId: string;
    invoiceTotal: Decimal;
    issueDate?: Date | null;
    client?: DbClient;
  }) {
    const context = await this.getEntitlementContext(args.companyId);
    if (!context) {
      return;
    }

    if (
      this.shouldBypassQuotaEnforcement({
        trialStatus: context.entitlement.trialStatus,
        limits: context.limits,
      })
    ) {
      return;
    }

    const invoiceMode = context.limits.invoices.mode;
    if (invoiceMode === 'warn_only') {
      return;
    }

    const client = this.getClient(args.client);
    const issueDate = args.issueDate ?? new Date();
    const periodStart = startOfUtcMonth(issueDate);
    const periodEnd = endOfUtcMonth(issueDate);
    const invoiceWhere = {
      companyId: args.companyId,
      status: { in: ['issued', 'paid', 'credited_partial', 'credited'] },
      issueDate: {
        gte: periodStart,
        lte: periodEnd,
      },
    } satisfies Prisma.InvoiceWhereInput;

    const [issuedCount, billedAggregate] = await Promise.all([
      client.invoice.count({
        where: invoiceWhere,
      }),
      client.invoice.aggregate({
        where: invoiceWhere,
        _sum: { total: true },
      }),
    ]);

    const nextIssuedCount = issuedCount + 1;
    const nextBilledValue = new Decimal(billedAggregate._sum.total ?? 0).plus(
      args.invoiceTotal,
    );

    const includedPerMonth = context.limits.invoices.included_per_month;
    if (
      includedPerMonth !== null &&
      nextIssuedCount > includedPerMonth &&
      invoiceMode === 'hard_block'
    ) {
      throw new ConflictException({
        code: 'INVOICE_LIMIT_REACHED',
        message:
          'This plan has reached its monthly invoice limit. Upgrade the subscription to issue more invoices.',
      });
    }

    const monthlyBillingValueInr =
      context.limits.invoices.monthly_billing_value_inr;
    if (
      monthlyBillingValueInr !== null &&
      nextBilledValue.greaterThan(monthlyBillingValueInr) &&
      invoiceMode === 'hard_block'
    ) {
      throw new ConflictException({
        code: 'INVOICE_VALUE_LIMIT_REACHED',
        message:
          'This plan has reached its monthly billing amount limit. Upgrade the subscription to continue issuing invoices.',
      });
    }
  }
}
