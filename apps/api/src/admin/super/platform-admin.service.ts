import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AccountingService } from '../../accounting/accounting.service';
import { BillingService } from '../../billing/billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminCompanyDto } from './dto/create-admin-company.dto';
import { UpdateAdminCompanyLifecycleDto } from './dto/update-admin-company-lifecycle.dto';
import { UpdateAdminSubscriptionDto } from './dto/update-admin-subscription.dto';

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly billing: BillingService,
  ) {}

  async dashboardSummary() {
    const [
      companyCount,
      activeSubscriptions,
      pastDueSubscriptions,
      openTickets,
      queueFailures,
      notificationFailures,
      webhookFailures,
      exportFailures,
      recentCompanies,
      recentTickets,
      recentWebhookFailures,
      statusCounts,
      providerCounts,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.subscription.count({
        where: { status: { in: ['active', 'trialing'] } },
      }),
      this.prisma.subscription.count({
        where: { status: 'past_due' },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } },
      }),
      this.prisma.exportJob.count({ where: { status: 'failed' } }),
      this.prisma.notificationOutbox.count({ where: { status: 'failed' } }),
      this.prisma.webhookEvent.count({ where: { status: 'failed' } }),
      this.prisma.exportJob.count({ where: { status: 'failed' } }),
      this.prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
      this.prisma.webhookEvent.findMany({
        where: { status: 'failed' },
        orderBy: { receivedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          provider: true,
          eventType: true,
          error: true,
          receivedAt: true,
        },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['provider'],
        _count: { _all: true },
      }),
    ]);

    return {
      kpis: {
        companies: companyCount,
        active_subscriptions: activeSubscriptions,
        past_due_subscriptions: pastDueSubscriptions,
        open_support_tickets: openTickets,
        platform_failures:
          queueFailures + notificationFailures + webhookFailures,
      },
      subscription_mix: {
        by_status: statusCounts.reduce<Record<string, number>>((acc, row) => {
          acc[row.status ?? 'unknown'] = row._count._all;
          return acc;
        }, {}),
        by_provider: providerCounts.reduce<Record<string, number>>(
          (acc, row) => {
            acc[row.provider ?? 'unknown'] = row._count._all;
            return acc;
          },
          {},
        ),
      },
      platform_health: {
        export_failures: exportFailures,
        notification_failures: notificationFailures,
        webhook_failures: webhookFailures,
      },
      recent_companies: recentCompanies.map((company) => ({
        id: company.id,
        name: company.name,
        created_at: company.createdAt.toISOString(),
      })),
      recent_support_tickets: recentTickets.map((ticket) => ({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.createdAt.toISOString(),
      })),
      recent_webhook_failures: recentWebhookFailures.map((event) => ({
        id: event.id,
        provider: event.provider,
        event_type: event.eventType,
        error: event.error,
        received_at: event.receivedAt.toISOString(),
      })),
    };
  }

  async listCompanies(args: { page: number; limit: number; q?: string }) {
    const skip = (args.page - 1) * args.limit;

    const where = args.q
      ? {
          OR: [
            { name: { contains: args.q, mode: 'insensitive' as const } },
            { gstin: { contains: args.q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
        include: {
          users: {
            where: { role: 'owner' },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: {
              email: true,
              name: true,
            },
          },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              plan: true,
              status: true,
              provider: true,
            },
          },
          _count: {
            select: {
              users: true,
              invoices: true,
              purchases: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      rows: rows.map((row) => {
        const settings =
          row.invoiceSettings && typeof row.invoiceSettings === 'object'
            ? (row.invoiceSettings as Record<string, unknown>)
            : {};
        const lifecycle =
          settings.admin_lifecycle &&
          typeof settings.admin_lifecycle === 'object'
            ? (settings.admin_lifecycle as Record<string, unknown>)
            : {};

        return {
          id: row.id,
          name: row.name,
          gstin: row.gstin,
          businessType: row.businessType,
          createdAt: row.createdAt,
          admin_status:
            typeof lifecycle.status === 'string' ? lifecycle.status : 'active',
          owner_email: row.users[0]?.email ?? null,
          owner_name: row.users[0]?.name ?? null,
          latest_subscription_status: row.subscriptions[0]?.status ?? null,
          latest_subscription_plan: row.subscriptions[0]?.plan ?? null,
          users_count: row._count.users,
          invoices_count: row._count.invoices,
          purchases_count: row._count.purchases,
        };
      }),
    };
  }

  async createCompany(dto: CreateAdminCompanyDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: dto.company_name.trim(),
          gstin: dto.gstin?.trim() || null,
          pan: dto.pan?.trim() || null,
          businessType: dto.business_type?.trim() || 'trader',
          state: dto.state?.trim() || null,
          stateCode: dto.state_code?.trim() || null,
          timezone: dto.timezone?.trim() || 'Asia/Kolkata',
          allowNegativeStock: Boolean(dto.allow_negative_stock),
          invoiceSettings: {
            onboarding_completed: true,
            default_series_code: 'DEFAULT',
            default_prefix: dto.invoice_prefix?.trim() || 'INV-',
            admin_lifecycle: {
              status: 'active',
              note: 'Created from admin console',
              updated_at: new Date().toISOString(),
            },
          },
        },
      });

      await tx.invoiceSeries.create({
        data: {
          companyId: createdCompany.id,
          code: 'DEFAULT',
          prefix: dto.invoice_prefix?.trim() || 'INV-',
          nextNumber: 1,
          isActive: true,
        },
      });

      await this.accounting.ensureDefaultLedgers(createdCompany.id, tx);

      const owner = await tx.user.create({
        data: {
          companyId: createdCompany.id,
          email,
          name: dto.owner_name.trim(),
          role: 'owner',
          isActive: true,
          passwordHash,
        },
      });

      return {
        id: createdCompany.id,
        ownerId: owner.id,
      };
    });

    return this.getCompanyDetail(company.id);
  }

  async getCompanyDetail(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          orderBy: [{ createdAt: 'asc' }],
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    const [
      invoicesCount,
      purchasesCount,
      paymentsCount,
      productsCount,
      customersCount,
      suppliersCount,
      recentInvoices,
      recentPurchases,
      recentPayments,
    ] = await Promise.all([
      this.prisma.invoice.count({ where: { companyId } }),
      this.prisma.purchase.count({ where: { companyId } }),
      this.prisma.payment.count({ where: { companyId } }),
      this.prisma.product.count({ where: { companyId } }),
      this.prisma.customer.count({ where: { companyId } }),
      this.prisma.supplier.count({ where: { companyId } }),
      this.prisma.invoice.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, invoiceNumber: true, status: true, total: true, createdAt: true },
      }),
      this.prisma.purchase.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, total: true, createdAt: true },
      }),
      this.prisma.payment.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, amount: true, method: true, createdAt: true, invoiceId: true },
      }),
    ]);

    const invoiceSettings =
      company.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? (company.invoiceSettings as Record<string, unknown>)
        : {};
    const lifecycle =
      invoiceSettings.admin_lifecycle &&
      typeof invoiceSettings.admin_lifecycle === 'object'
        ? (invoiceSettings.admin_lifecycle as Record<string, unknown>)
        : {};
    const gstVerification =
      invoiceSettings.gstin_verification &&
      typeof invoiceSettings.gstin_verification === 'object'
        ? (invoiceSettings.gstin_verification as Record<string, unknown>)
        : {};

    const owner =
      company.users.find((user) => user.role === 'owner') ?? company.users[0] ?? null;

    const recentActivity = [
      ...recentInvoices.map((invoice) => ({
        id: invoice.id,
        type: 'invoice',
        label: invoice.invoiceNumber,
        status: invoice.status,
        amount: Number(invoice.total),
        created_at: invoice.createdAt.toISOString(),
      })),
      ...recentPurchases.map((purchase) => ({
        id: purchase.id,
        type: 'purchase',
        label: `Purchase ${purchase.id.slice(0, 8)}`,
        status: purchase.status,
        amount: Number(purchase.total),
        created_at: purchase.createdAt.toISOString(),
      })),
      ...recentPayments.map((payment) => ({
        id: payment.id,
        type: 'payment',
        label: payment.method ?? 'payment',
        status: payment.invoiceId ? 'linked' : 'recorded',
        amount: Number(payment.amount),
        created_at: payment.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);

    return {
      id: company.id,
      name: company.name,
      gstin: company.gstin,
      pan: company.pan,
      business_type: company.businessType,
      state: company.state,
      state_code: company.stateCode,
      timezone: company.timezone,
      allow_negative_stock: company.allowNegativeStock,
      created_at: company.createdAt.toISOString(),
      updated_at: company.updatedAt.toISOString(),
      lifecycle: {
        status:
          typeof lifecycle.status === 'string' ? lifecycle.status : 'active',
        note: typeof lifecycle.note === 'string' ? lifecycle.note : null,
        updated_at:
          typeof lifecycle.updated_at === 'string'
            ? lifecycle.updated_at
            : null,
      },
      gst_verification: {
        status:
          typeof gstVerification.status === 'string'
            ? gstVerification.status
            : company.gstin
              ? 'not_started'
              : 'not_available',
        note:
          typeof gstVerification.note === 'string' ? gstVerification.note : null,
      },
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            role: owner.role,
            is_active: owner.isActive,
            last_login: owner.lastLogin?.toISOString() ?? null,
          }
        : null,
      users: company.users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.isActive,
        last_login: user.lastLogin?.toISOString() ?? null,
        created_at: user.createdAt.toISOString(),
      })),
      subscription: company.subscriptions[0]
        ? {
            id: company.subscriptions[0].id,
            plan: company.subscriptions[0].plan,
            status: company.subscriptions[0].status,
            provider: company.subscriptions[0].provider,
            created_at: company.subscriptions[0].createdAt.toISOString(),
            expires_at: company.subscriptions[0].expiresAt?.toISOString() ?? null,
          }
        : null,
      health: {
        users_count: company.users.length,
        active_users_count: company.users.filter((user) => user.isActive).length,
        invoices_count: invoicesCount,
        purchases_count: purchasesCount,
        payments_count: paymentsCount,
        products_count: productsCount,
        customers_count: customersCount,
        suppliers_count: suppliersCount,
      },
      recent_activity: recentActivity,
    };
  }

  async updateCompanyLifecycle(
    companyId: string,
    dto: UpdateAdminCompanyLifecycleDto,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, invoiceSettings: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const invoiceSettings =
      company.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? ({ ...(company.invoiceSettings as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    invoiceSettings.admin_lifecycle = {
      status: dto.action === 'suspend' ? 'suspended' : 'active',
      note:
        dto.note?.trim() ||
        (dto.action === 'suspend'
          ? 'Suspended from admin console'
          : 'Reactivated from admin console'),
      updated_at: new Date().toISOString(),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: { invoiceSettings: invoiceSettings as any, updatedAt: new Date() },
      });

      await tx.user.updateMany({
        where: { companyId },
        data: { isActive: dto.action !== 'suspend' },
      });
    });

    return this.getCompanyDetail(companyId);
  }

  async listSubscriptions(args: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const skip = (args.page - 1) * args.limit;

    const where = args.status ? { status: args.status } : {};

    const [total, rows, statusCounts, providerCounts, planCounts] =
      await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              users: {
                where: { role: 'owner' },
                take: 1,
                orderBy: { createdAt: 'asc' },
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['provider'],
        _count: { _all: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      rows: rows.map((row) => ({
        id: row.id,
        company_id: row.companyId,
        company_name: row.company.name,
        owner_email: row.company.users[0]?.email ?? null,
        owner_name: row.company.users[0]?.name ?? null,
        plan: row.plan,
        status: row.status,
        provider: row.provider,
        provider_subscription_id: row.providerSubscriptionId,
        createdAt: row.createdAt,
        startedAt: row.startedAt,
        expiresAt: row.expiresAt,
      })),
      summary: {
        by_status: statusCounts.reduce<Record<string, number>>((acc, row) => {
          acc[row.status ?? 'unknown'] = row._count._all;
          return acc;
        }, {}),
        by_provider: providerCounts.reduce<Record<string, number>>(
          (acc, row) => {
            acc[row.provider ?? 'unknown'] = row._count._all;
            return acc;
          },
          {},
        ),
        by_plan: planCounts.reduce<Record<string, number>>((acc, row) => {
          acc[row.plan ?? 'unassigned'] = row._count._all;
          return acc;
        }, {}),
      },
    };
  }

  async listSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ priceInr: 'asc' }],
    });

    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price_inr: Number(plan.priceInr),
      billing_interval: plan.billingInterval,
    }));
  }

  async getSubscriptionDetail(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            gstin: true,
            users: {
              where: { role: 'owner' },
              take: 1,
              orderBy: { createdAt: 'asc' },
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        planRel: true,
      },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const [plans, usageMeters, webhookEvents, allCompanySubscriptions] =
      await Promise.all([
        this.listSubscriptionPlans(),
        this.prisma.usageMeter.findMany({
          where: { companyId: subscription.companyId },
          orderBy: [{ updatedAt: 'desc' }],
          take: 10,
        }),
        this.prisma.webhookEvent.findMany({
          where: {
            companyId: subscription.companyId,
            ...(subscription.provider ? { provider: subscription.provider } : {}),
          },
          orderBy: [{ receivedAt: 'desc' }],
          take: 10,
        }),
        this.prisma.subscription.findMany({
          where: { companyId: subscription.companyId },
          orderBy: [{ createdAt: 'desc' }],
          take: 5,
        }),
      ]);

    const metadata =
      subscription.metadata && typeof subscription.metadata === 'object'
        ? (subscription.metadata as Record<string, unknown>)
        : {};

    return {
      id: subscription.id,
      company: {
        id: subscription.company.id,
        name: subscription.company.name,
        gstin: subscription.company.gstin,
        owner_name: subscription.company.users[0]?.name ?? null,
        owner_email: subscription.company.users[0]?.email ?? null,
      },
      current: {
        plan: subscription.plan,
        plan_name: subscription.planRel?.name ?? subscription.plan ?? null,
        status: subscription.status,
        provider: subscription.provider,
        provider_subscription_id: subscription.providerSubscriptionId,
        started_at: subscription.startedAt?.toISOString() ?? null,
        expires_at: subscription.expiresAt?.toISOString() ?? null,
        created_at: subscription.createdAt.toISOString(),
      },
      metadata: {
        success_url:
          typeof metadata.success_url === 'string' ? metadata.success_url : null,
        cancel_url:
          typeof metadata.cancel_url === 'string' ? metadata.cancel_url : null,
        provider_session_id:
          typeof metadata.provider_session_id === 'string'
            ? metadata.provider_session_id
            : null,
        admin_last_operation:
          metadata.admin_last_operation &&
          typeof metadata.admin_last_operation === 'object'
            ? metadata.admin_last_operation
            : null,
      },
      available_plans: plans,
      company_usage: usageMeters.map((meter) => ({
        id: meter.id,
        key: meter.key,
        value: Number(meter.value),
        period_start: meter.periodStart.toISOString(),
        period_end: meter.periodEnd.toISOString(),
        updated_at: meter.updatedAt.toISOString(),
      })),
      webhooks: webhookEvents.map((event) => ({
        id: event.id,
        provider: event.provider,
        event_type: event.eventType,
        provider_event_id: event.providerEventId,
        status: event.status,
        error: event.error,
        received_at: event.receivedAt.toISOString(),
        processed_at: event.processedAt?.toISOString() ?? null,
      })),
      company_subscriptions: allCompanySubscriptions.map((row) => ({
        id: row.id,
        plan: row.plan,
        status: row.status,
        provider: row.provider,
        created_at: row.createdAt.toISOString(),
      })),
      provider_health: {
        failed_webhooks: webhookEvents.filter((event) => event.status === 'failed')
          .length,
        last_webhook_status: webhookEvents[0]?.status ?? null,
      },
    };
  }

  async updateSubscription(
    subscriptionId: string,
    dto: UpdateAdminSubscriptionDto,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { planRel: true },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const metadata =
      subscription.metadata && typeof subscription.metadata === 'object'
        ? ({ ...(subscription.metadata as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    let nextPlanId = subscription.planId;
    let nextPlanCode = subscription.plan;
    let nextStatus = subscription.status ?? 'pending';
    let nextExpiresAt = subscription.expiresAt ?? null;
    let nextStartedAt = subscription.startedAt ?? null;

    if (dto.action === 'change_plan') {
      if (!dto.plan_code?.trim()) {
        throw new BadRequestException('plan_code is required for change_plan');
      }
      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: { code: dto.plan_code.trim(), isActive: true },
      });
      if (!plan) throw new NotFoundException('Subscription plan not found');
      nextPlanId = plan.id;
      nextPlanCode = plan.code;
    } else if (dto.action === 'cancel') {
      nextStatus = 'cancelled';
      nextExpiresAt = new Date();
    } else if (dto.action === 'reactivate' || dto.action === 'mark_active') {
      nextStatus = 'active';
      nextExpiresAt = null;
      nextStartedAt = subscription.startedAt ?? new Date();
    } else if (dto.action === 'mark_past_due') {
      nextStatus = 'past_due';
    }

    metadata.admin_last_operation = {
      action: dto.action,
      note: dto.note?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: nextPlanId,
        plan: nextPlanCode,
        status: nextStatus,
        startedAt: nextStartedAt,
        expiresAt: nextExpiresAt,
        metadata: metadata as object,
      },
      select: { id: true, companyId: true },
    });

    await this.billing.syncSubscriptionUsageForCompany(updated.companyId);

    return this.getSubscriptionDetail(updated.id);
  }

  async usageSummary(args: { from?: Date; to?: Date }) {
    const meters = await this.prisma.usageMeter.findMany({
      where: {
        ...(args.from || args.to
          ? {
              AND: [
                args.from ? { periodStart: { gte: args.from } } : {},
                args.to ? { periodEnd: { lte: args.to } } : {},
              ],
            }
          : {}),
      },
      orderBy: { id: 'desc' },
    });

    const totalsByKey = meters.reduce<Record<string, number>>((acc, meter) => {
      acc[meter.key] = (acc[meter.key] ?? 0) + Number(meter.value);
      return acc;
    }, {});

    const [companyCount, activeSubscriptions, subscriptions, companies] =
      await Promise.all([
      this.prisma.company.count(),
      this.prisma.subscription.count({
        where: { status: { in: ['active', 'trialing'] } },
      }),
      this.prisma.subscription.findMany({
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.company.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              invoices: true,
              purchases: true,
              users: true,
            },
          },
        },
      }),
    ]);

    const revenue = subscriptions.reduce((acc, subscription) => {
      if (!subscription.planId || !subscription.status) return acc;
      if (!['active', 'trialing', 'past_due', 'checkout_created'].includes(subscription.status)) {
        return acc;
      }
      return acc;
    }, 0);

    const byPlan = subscriptions.reduce<Record<string, number>>((acc, row) => {
      const key = row.plan ?? 'unassigned';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const byProvider = subscriptions.reduce<Record<string, number>>((acc, row) => {
      const key = row.provider ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topCompanies = companies
      .map((company) => ({
        id: company.id,
        name: company.name,
        activity_score:
          company._count.invoices + company._count.purchases + company._count.users,
        invoices_count: company._count.invoices,
        purchases_count: company._count.purchases,
        users_count: company._count.users,
      }))
      .sort((a, b) => b.activity_score - a.activity_score)
      .slice(0, 8);

    return {
      from: args.from?.toISOString() ?? null,
      to: args.to?.toISOString() ?? null,
      summary: {
        companies: companyCount,
        active_subscriptions: activeSubscriptions,
        meter_keys: Object.keys(totalsByKey).length,
        totals_by_key: totalsByKey,
        estimated_mrr_inr: revenue,
        subscriptions_by_plan: byPlan,
        subscriptions_by_provider: byProvider,
      },
      meters,
      top_companies: topCompanies,
    };
  }
}
