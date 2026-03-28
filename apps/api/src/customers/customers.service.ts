import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

type LedgerRow = {
  date: string;
  type: 'invoice' | 'payment';
  ref_id: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  invoice_id?: string;
  invoice_number?: string | null;
  payment_id?: string;
  payment_method?: string | null;
  payment_reference?: string | null;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private async findCustomerRecord(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, deletedAt: null },
      include: {
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async assertSalespersonBelongsToCompany(
    companyId: string,
    salespersonUserId?: string | null,
  ) {
    if (!salespersonUserId) return null;

    const salesperson = await this.prisma.user.findFirst({
      where: {
        id: salespersonUserId,
        companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!salesperson) {
      throw new NotFoundException('Salesperson not found');
    }

    return salesperson;
  }

  private toNumber(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (value as any)?.toString?.();
    if (typeof s === 'string') return Number(s);
    return Number(value);
  }

  private toDateString(d: Date | string | null | undefined): string {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return Number.isNaN(dt.valueOf()) ? '' : dt.toISOString().slice(0, 10);
  }

  private toIsoString(d: Date | string | null | undefined): string | null {
    if (!d) return null;
    const dt = typeof d === 'string' ? new Date(d) : d;
    return Number.isNaN(dt.valueOf()) ? null : dt.toISOString();
  }

  async list(companyId: string, page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;

    const where: any = { companyId, deletedAt: null };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          salesperson: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async create(companyId: string, dto: CreateCustomerDto) {
    const data = {
      companyId,
      name: dto.name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      gstin: dto.gstin ?? null,
      stateCode: dto.state_code ?? null,
      billingAddress: dto.billing_address
        ? (dto.billing_address as any)
        : (Prisma as any).JsonNull,
      shippingAddress: dto.shipping_address
        ? (dto.shipping_address as any)
        : (Prisma as any).JsonNull,
      pricingTier: dto.pricing_tier?.trim() || null,
      creditLimit: dto.credit_limit?.trim() || null,
      creditDays: dto.credit_days ?? null,
      creditControlMode: dto.credit_control_mode?.trim() || 'warn',
      creditWarningPercent: dto.credit_warning_percent?.trim() || '80',
      creditBlockPercent: dto.credit_block_percent?.trim() || '100',
      creditHold: dto.credit_hold ?? false,
      creditHoldReason: dto.credit_hold_reason?.trim() || null,
      creditOverrideUntil: dto.credit_override_until
        ? new Date(dto.credit_override_until)
        : null,
      creditOverrideReason: dto.credit_override_reason?.trim() || null,
      salespersonUserId:
        (await this.assertSalespersonBelongsToCompany(
          companyId,
          dto.salesperson_user_id,
        ))?.id ?? null,
    } satisfies Prisma.CustomerUncheckedCreateInput;

    return this.prisma.customer.create({
      data,
      include: {
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async get(companyId: string, customerId: string) {
    const customer = await this.findCustomerRecord(companyId, customerId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openTaskWhere: Prisma.CollectionTaskWhereInput = {
      companyId,
      customerId,
      status: { notIn: ['closed', 'completed', 'cancelled'] },
    };

    const [
      openInvoiceSummary,
      overdueInvoiceSummary,
      recentInvoices,
      recentPayments,
      activeCoverage,
      latestVisit,
      nextPlannedVisit,
      openTasksCount,
      overdueTasksCount,
      nextActionDate,
      latestOpenTask,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          customerId,
          status: { in: ['issued', 'paid'] },
          balanceDue: { gt: 0 },
        },
        _count: { _all: true },
        _sum: { balanceDue: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          customerId,
          status: { in: ['issued', 'paid'] },
          balanceDue: { gt: 0 },
          dueDate: { lt: today },
        },
        _count: { _all: true },
        _sum: { balanceDue: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          companyId,
          customerId,
          status: { not: 'cancelled' },
        },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          issueDate: true,
          dueDate: true,
          total: true,
          balanceDue: true,
        },
        orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.payment.findMany({
        where: {
          companyId,
          invoice: { companyId, customerId },
        },
        select: {
          id: true,
          paymentDate: true,
          amount: true,
          method: true,
          instrumentStatus: true,
          reference: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.customerSalesCoverage.findFirst({
        where: {
          companyId,
          customerId,
          isActive: true,
        },
        include: {
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          territory: {
            select: { id: true, code: true, name: true },
          },
          route: {
            select: { id: true, code: true, name: true },
          },
          beat: {
            select: { id: true, code: true, name: true, dayOfWeek: true },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.salesVisit.findFirst({
        where: { companyId, customerId },
        select: {
          id: true,
          visitDate: true,
          status: true,
          primaryOutcome: true,
          productiveFlag: true,
          nextFollowUpDate: true,
        },
        orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.salesVisitPlan.findFirst({
        where: {
          companyId,
          customerId,
          visitDate: { gte: today },
          status: { in: ['planned', 'started', 'in_progress'] },
        },
        select: {
          id: true,
          visitDate: true,
          status: true,
          priority: true,
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        },
        orderBy: [{ visitDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.collectionTask.count({
        where: openTaskWhere,
      }),
      this.prisma.collectionTask.count({
        where: {
          ...openTaskWhere,
          dueDate: { lt: today },
        },
      }),
      this.prisma.collectionTask.aggregate({
        where: {
          ...openTaskWhere,
          nextActionDate: { not: null },
        },
        _min: { nextActionDate: true },
      }),
      this.prisma.collectionTask.findFirst({
        where: openTaskWhere,
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const lastPayment = recentPayments[0] ?? null;
    const collectionsOwner =
      latestOpenTask?.assignee ??
      latestOpenTask?.salesperson ??
      customer.salesperson ??
      null;

    return {
      ...customer,
      summary: {
        credit: {
          current_exposure: this.toNumber(openInvoiceSummary._sum.balanceDue),
          open_invoices_count: openInvoiceSummary._count._all,
          overdue_invoices_count: overdueInvoiceSummary._count._all,
          overdue_amount: this.toNumber(overdueInvoiceSummary._sum.balanceDue),
          last_payment: lastPayment
            ? {
                id: lastPayment.id,
                payment_date: this.toIsoString(lastPayment.paymentDate),
                amount: this.toNumber(lastPayment.amount),
                method: lastPayment.method,
                instrument_status: lastPayment.instrumentStatus,
                invoice_id: lastPayment.invoice?.id ?? null,
                invoice_number: lastPayment.invoice?.invoiceNumber ?? null,
              }
            : null,
        },
        collections: {
          owner: collectionsOwner,
          open_tasks_count: openTasksCount,
          overdue_tasks_count: overdueTasksCount,
          next_action_date: this.toDateString(nextActionDate._min.nextActionDate),
          latest_open_task: latestOpenTask
            ? {
                id: latestOpenTask.id,
                status: latestOpenTask.status,
                priority: latestOpenTask.priority,
                channel: latestOpenTask.channel,
                due_date: this.toDateString(latestOpenTask.dueDate),
                next_action_date: this.toDateString(latestOpenTask.nextActionDate),
                promise_to_pay_date: this.toDateString(
                  latestOpenTask.promiseToPayDate,
                ),
                promise_to_pay_amount: this.toNumber(
                  latestOpenTask.promiseToPayAmount,
                ),
                notes: latestOpenTask.notes,
              }
            : null,
        },
        coverage: {
          active_assignment: activeCoverage
            ? {
                id: activeCoverage.id,
                salesperson: activeCoverage.salesperson,
                territory: activeCoverage.territory,
                route: activeCoverage.route,
                beat: activeCoverage.beat
                  ? {
                      ...activeCoverage.beat,
                      day_of_week: activeCoverage.beat.dayOfWeek,
                    }
                  : null,
                visit_frequency: activeCoverage.visitFrequency,
                preferred_visit_day: activeCoverage.preferredVisitDay,
                priority: activeCoverage.priority,
                notes: activeCoverage.notes,
              }
            : null,
          latest_visit: latestVisit
            ? {
                id: latestVisit.id,
                visit_date: this.toDateString(latestVisit.visitDate),
                status: latestVisit.status,
                primary_outcome: latestVisit.primaryOutcome,
                productive_flag: latestVisit.productiveFlag,
                next_follow_up_date: this.toDateString(
                  latestVisit.nextFollowUpDate,
                ),
              }
            : null,
          next_planned_visit: nextPlannedVisit
            ? {
                id: nextPlannedVisit.id,
                visit_date: this.toDateString(nextPlannedVisit.visitDate),
                status: nextPlannedVisit.status,
                priority: nextPlannedVisit.priority,
                route: nextPlannedVisit.route,
                beat: nextPlannedVisit.beat
                  ? {
                      ...nextPlannedVisit.beat,
                      day_of_week: nextPlannedVisit.beat.dayOfWeek,
                    }
                  : null,
              }
            : null,
        },
        activity: {
          recent_invoices: recentInvoices.map((invoice) => ({
            id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            status: invoice.status,
            issue_date: this.toDateString(invoice.issueDate),
            due_date: this.toDateString(invoice.dueDate),
            total: this.toNumber(invoice.total),
            balance_due: this.toNumber(invoice.balanceDue),
          })),
          recent_payments: recentPayments.map((payment) => ({
            id: payment.id,
            payment_date: this.toIsoString(payment.paymentDate),
            amount: this.toNumber(payment.amount),
            method: payment.method,
            instrument_status: payment.instrumentStatus,
            invoice_id: payment.invoice?.id ?? null,
            invoice_number: payment.invoice?.invoiceNumber ?? null,
            reference: payment.reference ?? null,
          })),
        },
      },
    };
  }

  async update(companyId: string, customerId: string, dto: UpdateCustomerDto) {
    await this.findCustomerRecord(companyId, customerId);

    const salesperson =
      dto.salesperson_user_id !== undefined
        ? await this.assertSalespersonBelongsToCompany(
            companyId,
            dto.salesperson_user_id,
          )
        : undefined;

    const data = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      gstin: dto.gstin,
      stateCode: dto.state_code,
      billingAddress: dto.billing_address ? (dto.billing_address as any) : undefined,
      shippingAddress: dto.shipping_address
        ? (dto.shipping_address as any)
        : undefined,
      pricingTier:
        dto.pricing_tier !== undefined ? dto.pricing_tier?.trim() || null : undefined,
      creditLimit:
        dto.credit_limit !== undefined ? dto.credit_limit?.trim() || null : undefined,
      creditDays: dto.credit_days,
      creditControlMode:
        dto.credit_control_mode !== undefined
          ? dto.credit_control_mode?.trim() || 'warn'
          : undefined,
      creditWarningPercent:
        dto.credit_warning_percent !== undefined
          ? dto.credit_warning_percent?.trim() || '80'
          : undefined,
      creditBlockPercent:
        dto.credit_block_percent !== undefined
          ? dto.credit_block_percent?.trim() || '100'
          : undefined,
      creditHold: dto.credit_hold,
      creditHoldReason:
        dto.credit_hold_reason !== undefined
          ? dto.credit_hold_reason?.trim() || null
          : undefined,
      creditOverrideUntil:
        dto.credit_override_until !== undefined
          ? dto.credit_override_until
            ? new Date(dto.credit_override_until)
            : null
          : undefined,
      creditOverrideReason:
        dto.credit_override_reason !== undefined
          ? dto.credit_override_reason?.trim() || null
          : undefined,
      salespersonUserId:
        dto.salesperson_user_id !== undefined ? salesperson?.id ?? null : undefined,
    } satisfies Prisma.CustomerUncheckedUpdateInput;

    return this.prisma.customer.update({
      where: { id: customerId },
      data,
      include: {
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(companyId: string, customerId: string) {
    await this.findCustomerRecord(companyId, customerId);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { deletedAt: new Date() },
    });
  }

  async ledger(
    companyId: string,
    customerId: string,
    args: { from?: string; to?: string; page: number; limit: number },
  ): Promise<{
    opening_balance: number;
    closing_balance: number;
    rows: LedgerRow[];
    meta: {
      page: number;
      limit: number;
      total: number;
      from?: string;
      to?: string;
    };
  }> {
    await this.findCustomerRecord(companyId, customerId);

    const fromDate = args.from ? new Date(args.from) : null;
    const toDate = args.to ? new Date(args.to) : null;
    if (fromDate && Number.isNaN(fromDate.valueOf())) {
      throw new BadRequestException('Invalid from date.');
    }
    if (toDate && Number.isNaN(toDate.valueOf())) {
      throw new BadRequestException('Invalid to date.');
    }

    // We treat customer ledger as AR view:
    // - Invoice issued/paid => debit (customer owes)
    // - Payment received => credit (reduces receivable)
    const invoiceWhere: any = {
      companyId,
      customerId,
      status: { in: ['issued', 'paid'] },
    };
    const paymentWhere: any = {
      companyId,
      invoice: { companyId, customerId },
    };

    // Range filters for in-range queries.
    const invoiceRange: any = { ...invoiceWhere };
    if (fromDate || toDate) {
      invoiceRange.issueDate = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
      };
    }

    const paymentRange: any = { ...paymentWhere };
    if (fromDate || toDate) {
      paymentRange.paymentDate = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
      };
    }

    // Opening balance = invoices before from - payments before from
    let openingBalance = 0;
    if (fromDate) {
      const [invAgg, payAgg] = await this.prisma.$transaction([
        this.prisma.invoice.aggregate({
          where: {
            ...invoiceWhere,
            issueDate: { lt: fromDate },
          },
          _sum: { total: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            ...paymentWhere,
            paymentDate: { lt: fromDate },
          },
          _sum: { amount: true },
        }),
      ]);

      openingBalance =
        this.toNumber(invAgg._sum.total) - this.toNumber(payAgg._sum.amount);
    }

    const skip = (args.page - 1) * args.limit;

    // Fetch range events (over-fetch then merge sort). This keeps the implementation
    // simple and stable for MVP-scale ledgers.
    const [invoices, payments] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: invoiceRange,
        select: {
          id: true,
          invoiceNumber: true,
          issueDate: true,
          total: true,
        },
        orderBy: [{ issueDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.payment.findMany({
        where: paymentRange,
        select: {
          id: true,
          paymentDate: true,
          amount: true,
          method: true,
          reference: true,
          invoiceId: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: [{ paymentDate: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const events: Array<
      | {
          sortDate: Date;
          sortTie: string;
          row: Omit<LedgerRow, 'balance'>;
        }
      | {
          sortDate: Date;
          sortTie: string;
          row: Omit<LedgerRow, 'balance'>;
        }
    > = [];

    for (const inv of invoices) {
      const dateStr = this.toDateString(inv.issueDate);
      const amt = this.toNumber(inv.total);
      events.push({
        sortDate: inv.issueDate ? new Date(inv.issueDate) : new Date(0),
        sortTie: `i:${inv.id}`,
        row: {
          date: dateStr,
          type: 'invoice',
          ref_id: inv.id,
          invoice_id: inv.id,
          invoice_number: inv.invoiceNumber ?? null,
          description: inv.invoiceNumber
            ? `Invoice ${inv.invoiceNumber}`
            : 'Invoice',
          debit: amt,
          credit: 0,
        },
      });
    }

    for (const p of payments) {
      const dateStr = this.toDateString(p.paymentDate);
      const amt = this.toNumber(p.amount);
      events.push({
        sortDate: p.paymentDate ? new Date(p.paymentDate) : new Date(0),
        sortTie: `p:${p.id}`,
        row: {
          date: dateStr,
          type: 'payment',
          ref_id: p.id,
          invoice_id: p.invoice?.id ?? p.invoiceId ?? undefined,
          invoice_number: p.invoice?.invoiceNumber ?? null,
          payment_id: p.id,
          payment_method: p.method,
          payment_reference: p.reference ?? null,
          description: p.invoice?.invoiceNumber
            ? `Payment (Invoice ${p.invoice.invoiceNumber})`
            : 'Payment',
          debit: 0,
          credit: amt,
        },
      });
    }

    events.sort((a, b) => {
      const d = a.sortDate.valueOf() - b.sortDate.valueOf();
      if (d !== 0) return d;
      return a.sortTie.localeCompare(b.sortTie);
    });

    const total = events.length;
    let running = openingBalance;
    const rowsAll: LedgerRow[] = [];
    for (const e of events) {
      running = running + e.row.debit - e.row.credit;
      rowsAll.push({ ...e.row, balance: running });
    }

    // Compute balances for page rows without recomputing N times.
    const rows = rowsAll.slice(skip, skip + args.limit);
    const closingBalance = running;

    return {
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      rows,
      meta: {
        page: args.page,
        limit: args.limit,
        total,
        ...(args.from ? { from: args.from } : {}),
        ...(args.to ? { to: args.to } : {}),
      },
    };
  }
}
