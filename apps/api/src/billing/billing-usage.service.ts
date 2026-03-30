import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';

type MeterClient = PrismaService | PrismaClient | Prisma.TransactionClient;

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

@Injectable()
export class BillingUsageService {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(client?: MeterClient) {
    return client ?? this.prisma;
  }

  getCurrentPeriod(date = new Date()) {
    return {
      periodStart: startOfUtcMonth(date),
      periodEnd: endOfUtcMonth(date),
    };
  }

  private async upsertMeter(args: {
    client?: MeterClient;
    companyId: string;
    key: string;
    value: number | Decimal;
    periodDate?: Date;
  }) {
    const client = this.getClient(args.client);
    const { periodStart, periodEnd } = this.getCurrentPeriod(args.periodDate);

    await client.usageMeter.upsert({
      where: {
        companyId_periodStart_periodEnd_key: {
          companyId: args.companyId,
          periodStart,
          periodEnd,
          key: args.key,
        },
      },
      update: {
        value: args.value instanceof Decimal ? args.value : new Decimal(args.value),
        updatedAt: new Date(),
      },
      create: {
        companyId: args.companyId,
        periodStart,
        periodEnd,
        key: args.key,
        value: args.value instanceof Decimal ? args.value : new Decimal(args.value),
      },
    });
  }

  async syncInvoiceUsageForCompany(args: {
    companyId: string;
    client?: MeterClient;
    periodDate?: Date;
  }) {
    const client = this.getClient(args.client);
    const { periodStart, periodEnd } = this.getCurrentPeriod(args.periodDate);
    const invoiceWhere = {
      companyId: args.companyId,
      status: { in: ['issued', 'paid', 'credited_partial', 'credited'] },
      issueDate: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    const [count, total] = await Promise.all([
      client.invoice.count({
        where: invoiceWhere,
      }),
      client.invoice.aggregate({
        where: invoiceWhere,
        _sum: { total: true },
      }),
    ]);

    await Promise.all([
      this.upsertMeter({
        client,
        companyId: args.companyId,
        key: 'issued_invoice_count',
        value: count,
        periodDate: args.periodDate,
      }),
      this.upsertMeter({
        client,
        companyId: args.companyId,
        key: 'invoice_billed_value_inr',
        value: total._sum.total ?? new Decimal(0),
        periodDate: args.periodDate,
      }),
    ]);
  }

  async syncSeatUsageForCompany(args: {
    companyId: string;
    client?: MeterClient;
    periodDate?: Date;
  }) {
    const client = this.getClient(args.client);
    const activeUsers = await client.user.count({
      where: {
        companyId: args.companyId,
        isActive: true,
      },
    });

    // The current product does not yet have a dedicated view-only seat role model.
    // Until that role exists, all active tenant users are treated as full seats.
    await Promise.all([
      this.upsertMeter({
        client,
        companyId: args.companyId,
        key: 'active_full_seat_count',
        value: activeUsers,
        periodDate: args.periodDate,
      }),
      this.upsertMeter({
        client,
        companyId: args.companyId,
        key: 'active_view_only_seat_count',
        value: 0,
        periodDate: args.periodDate,
      }),
      this.upsertMeter({
        client,
        companyId: args.companyId,
        key: 'active_company_count',
        value: 1,
        periodDate: args.periodDate,
      }),
    ]);
  }

  async getCurrentUsageSummary(companyId: string, periodDate?: Date) {
    await Promise.all([
      this.syncInvoiceUsageForCompany({ companyId, periodDate }),
      this.syncSeatUsageForCompany({ companyId, periodDate }),
    ]);

    const { periodStart, periodEnd } = this.getCurrentPeriod(periodDate);
    const meters = await this.prisma.usageMeter.findMany({
      where: {
        companyId,
        periodStart,
        periodEnd,
      },
      orderBy: { key: 'asc' },
    });

    const summary = meters.reduce<Record<string, number>>((acc, meter) => {
      acc[meter.key] = Number(meter.value);
      return acc;
    }, {});

    return {
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      summary,
      meters: meters.map((meter) => ({
        id: meter.id,
        key: meter.key,
        value: Number(meter.value),
        updated_at: meter.updatedAt.toISOString(),
      })),
    };
  }
}
