import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeSeriesGrain(grain?: string): 'day' | 'week' | 'month' {
    if (grain === 'week' || grain === 'month') return grain;
    return 'day';
  }

  private numberFromDecimalLike(
    value: { toString(): string } | number | null | undefined,
  ) {
    if (value == null) return 0;
    return typeof value === 'number' ? value : Number(value.toString());
  }

  private utcDateOnly(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private bucketStart(date: Date, grain: 'day' | 'week' | 'month') {
    const base = this.utcDateOnly(date);
    if (grain === 'month') {
      return new Date(
        Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1),
      );
    }

    if (grain === 'week') {
      const day = base.getUTCDay();
      const diff = (day + 6) % 7;
      const start = new Date(base);
      start.setUTCDate(base.getUTCDate() - diff);
      return start;
    }

    return base;
  }

  private bucketEnd(
    start: Date,
    grain: 'day' | 'week' | 'month',
  ) {
    const end = new Date(start);
    if (grain === 'month') {
      end.setUTCMonth(end.getUTCMonth() + 1);
      end.setUTCDate(0);
      return end;
    }

    if (grain === 'week') {
      end.setUTCDate(end.getUTCDate() + 6);
      return end;
    }

    return end;
  }

  private formatDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private buildPeriodMeta(date: Date, grain: 'day' | 'week' | 'month') {
    const start = this.bucketStart(date, grain);
    const end = this.bucketEnd(start, grain);
    return {
      period: this.formatDateKey(start),
      period_start: this.formatDateKey(start),
      period_end: this.formatDateKey(end),
    };
  }

  private buildDateRange(from?: string, to?: string) {
    return from || to
      ? {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        }
      : undefined;
  }

  async salesSummary(args: { companyId: string; from?: string; to?: string }) {
    const where: any = {
      companyId: args.companyId,
      status: { in: ['issued', 'paid'] },
    };

    if (args.from || args.to) {
      where.issueDate = {
        ...(args.from ? { gte: new Date(args.from) } : {}),
        ...(args.to ? { lte: new Date(args.to) } : {}),
      };
    }

    const rows = await this.prisma.invoice.findMany({
      where,
      select: {
        id: true,
        status: true,
        issueDate: true,
        subTotal: true,
        taxTotal: true,
        total: true,
        amountPaid: true,
        balanceDue: true,
      },
    });

    // Prisma Decimal serializes but we keep it consistent through string conversion.
    const totals = rows.reduce(
      (
        acc: {
          count: number;
          sub_total: number;
          tax_total: number;
          total: number;
          amount_paid: number;
          balance_due: number;
        },
        r: (typeof rows)[number],
      ) => {
        const sub = Number(r.subTotal.toString());
        const tax = Number(r.taxTotal.toString());
        const tot = Number(r.total.toString());
        const paid = Number(r.amountPaid.toString());
        const bal = Number(r.balanceDue.toString());
        acc.count += 1;
        acc.sub_total += sub;
        acc.tax_total += tax;
        acc.total += tot;
        acc.amount_paid += paid;
        acc.balance_due += bal;
        return acc;
      },
      {
        count: 0,
        sub_total: 0,
        tax_total: 0,
        total: 0,
        amount_paid: 0,
        balance_due: 0,
      },
    );

    const grossSales = totals.total;
    const netSales = totals.sub_total;
    const averageInvoice = totals.count > 0 ? totals.total / totals.count : 0;

    return {
      data: {
        gross_sales: grossSales,
        net_sales: netSales,
        tax_total: totals.tax_total,
        invoices_count: totals.count,
        average_invoice: averageInvoice,
        amount_paid: totals.amount_paid,
        balance_due: totals.balance_due,
        currency: 'INR',
      },
    };
  }

  async salesSummarySeries(args: {
    companyId: string;
    from?: string;
    to?: string;
    grain?: string;
  }) {
    const issueDate = this.buildDateRange(args.from, args.to);
    const grain = this.normalizeSeriesGrain(args.grain);
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['issued', 'paid'] },
        ...(issueDate ? { issueDate } : {}),
      },
      select: {
        issueDate: true,
        subTotal: true,
        taxTotal: true,
        total: true,
        amountPaid: true,
        balanceDue: true,
      },
      orderBy: [{ issueDate: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped = new Map<
      string,
      {
        period: string;
        period_start: string;
        period_end: string;
        gross_sales: number;
        net_sales: number;
        tax_total: number;
        amount_paid: number;
        balance_due: number;
        invoices_count: number;
      }
    >();

    for (const row of rows) {
      if (!row.issueDate) continue;
      const meta = this.buildPeriodMeta(row.issueDate, grain);
      const current = grouped.get(meta.period) ?? {
        ...meta,
        gross_sales: 0,
        net_sales: 0,
        tax_total: 0,
        amount_paid: 0,
        balance_due: 0,
        invoices_count: 0,
      };

      current.gross_sales += this.numberFromDecimalLike(row.total);
      current.net_sales += this.numberFromDecimalLike(row.subTotal);
      current.tax_total += this.numberFromDecimalLike(row.taxTotal);
      current.amount_paid += this.numberFromDecimalLike(row.amountPaid);
      current.balance_due += this.numberFromDecimalLike(row.balanceDue);
      current.invoices_count += 1;
      grouped.set(meta.period, current);
    }

    return {
      data: Array.from(grouped.values()).map((row) => ({
        ...row,
        average_invoice:
          row.invoices_count > 0 ? row.gross_sales / row.invoices_count : 0,
      })),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        grain,
        currency: 'INR',
      },
    };
  }

  async purchasesSummary(args: {
    companyId: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {
      companyId: args.companyId,
      status: { in: ['received', 'cancelled', 'draft'] },
    };

    if (args.from || args.to) {
      where.purchaseDate = {
        ...(args.from ? { gte: new Date(args.from) } : {}),
        ...(args.to ? { lte: new Date(args.to) } : {}),
      };
    }

    const rows = await this.prisma.purchase.findMany({
      where,
      select: {
        id: true,
        status: true,
        purchaseDate: true,
        subTotal: true,
        taxTotal: true,
        total: true,
      },
    });

    const totals = rows.reduce(
      (
        acc: {
          count: number;
          sub_total: number;
          tax_total: number;
          total: number;
        },
        r: (typeof rows)[number],
      ) => {
        acc.count += 1;
        acc.sub_total += Number(r.subTotal.toString());
        acc.tax_total += Number(r.taxTotal.toString());
        acc.total += Number(r.total.toString());
        return acc;
      },
      { count: 0, sub_total: 0, tax_total: 0, total: 0 },
    );

    const grossPurchases = totals.total;
    const netPurchases = totals.sub_total;
    const averagePurchase =
      totals.count > 0 ? totals.total / totals.count : 0;

    return {
      data: {
        gross_purchases: grossPurchases,
        net_purchases: netPurchases,
        tax_total: totals.tax_total,
        purchases_count: totals.count,
        average_purchase: averagePurchase,
        currency: 'INR',
      },
    };
  }

  async purchasesSummarySeries(args: {
    companyId: string;
    from?: string;
    to?: string;
    grain?: string;
  }) {
    const purchaseDate = this.buildDateRange(args.from, args.to);
    const grain = this.normalizeSeriesGrain(args.grain);
    const rows = await this.prisma.purchase.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['received', 'cancelled', 'draft'] },
        ...(purchaseDate ? { purchaseDate } : {}),
      },
      select: {
        purchaseDate: true,
        subTotal: true,
        taxTotal: true,
        total: true,
      },
      orderBy: [{ purchaseDate: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped = new Map<
      string,
      {
        period: string;
        period_start: string;
        period_end: string;
        gross_purchases: number;
        net_purchases: number;
        tax_total: number;
        purchases_count: number;
      }
    >();

    for (const row of rows) {
      const purchaseDate = row.purchaseDate;
      if (!purchaseDate) continue;
      const meta = this.buildPeriodMeta(purchaseDate, grain);
      const current = grouped.get(meta.period) ?? {
        ...meta,
        gross_purchases: 0,
        net_purchases: 0,
        tax_total: 0,
        purchases_count: 0,
      };

      current.gross_purchases += this.numberFromDecimalLike(row.total);
      current.net_purchases += this.numberFromDecimalLike(row.subTotal);
      current.tax_total += this.numberFromDecimalLike(row.taxTotal);
      current.purchases_count += 1;
      grouped.set(meta.period, current);
    }

    return {
      data: Array.from(grouped.values()).map((row) => ({
        ...row,
        average_purchase:
          row.purchases_count > 0
            ? row.gross_purchases / row.purchases_count
            : 0,
      })),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        grain,
        currency: 'INR',
      },
    };
  }

  async outstandingInvoices(args: {
    companyId: string;
    page: number;
    limit: number;
    q?: string;
  }) {
    const skip = (args.page - 1) * args.limit;

    const where: any = {
      companyId: args.companyId,
      status: 'issued',
      balanceDue: { gt: 0 },
      ...(args.q
        ? {
            OR: [
              { invoiceNumber: { contains: args.q, mode: 'insensitive' } },
              { customer: { name: { contains: args.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: args.limit,
        include: { customer: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const now = new Date();

    return {
      data: data.map((invoice) => {
        const issueDate = invoice.issueDate?.toISOString().slice(0, 10) ?? null;
        const dueDate = invoice.dueDate?.toISOString().slice(0, 10) ?? null;
        const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
        const overdueDays =
          dueAt && dueAt.getTime() < now.getTime()
            ? Math.floor((now.getTime() - dueAt.getTime()) / 86_400_000)
            : 0;

        return {
          invoice_id: invoice.id,
          invoice_number: invoice.invoiceNumber ?? null,
          customer_id: invoice.customerId,
          customer_name: invoice.customer.name,
          issue_date: issueDate,
          due_date: dueDate,
          total: Number(invoice.total.toString()),
          amount_paid: Number(invoice.amountPaid.toString()),
          amount_due: Number(invoice.balanceDue.toString()),
          overdue_days: overdueDays,
          status: invoice.status,
        };
      }),
      meta: { page: args.page, limit: args.limit, total },
    };
  }

  async topProducts(args: {
    companyId: string;
    from?: string;
    to?: string;
    limit: number;
    sortBy?: 'amount' | 'quantity';
  }) {
    const where: any = {
      companyId: args.companyId,
      invoice: { status: { in: ['issued', 'paid'] } },
    };

    if (args.from || args.to) {
      where.invoice.issueDate = {
        ...(args.from ? { gte: new Date(args.from) } : {}),
        ...(args.to ? { lte: new Date(args.to) } : {}),
      };
    }

    const rows = await this.prisma.invoiceItem.findMany({
      where,
      select: {
        productId: true,
        quantity: true,
        lineTotal: true,
        product: { select: { name: true, sku: true, hsn: true } },
      },
    });

    const map = new Map<
      string,
      {
        product_id: string;
        name: string;
        sku: string | null;
        hsn: string | null;
        quantity: number;
        amount: number;
      }
    >();

    for (const r of rows) {
      const key = r.productId;
      const prev = map.get(key);
      const qty = Number(r.quantity.toString());
      const amt = Number(r.lineTotal.toString());

      if (!prev) {
        map.set(key, {
          product_id: r.productId,
          name: r.product.name,
          sku: r.product.sku ?? null,
          hsn: r.product.hsn ?? null,
          quantity: qty,
          amount: amt,
        });
      } else {
        prev.quantity += qty;
        prev.amount += amt;
      }
    }

    const data = Array.from(map.values()).sort((a, b) => {
      const by = args.sortBy ?? 'amount';
      return by === 'quantity' ? b.quantity - a.quantity : b.amount - a.amount;
    });

    return {
      data: data.slice(0, args.limit),
      meta: {
        limit: args.limit,
        sort_by: args.sortBy ?? 'amount',
      },
    };
  }

  /**
   * Lightweight profit snapshot.
   *
   * Since we don't yet track true COGS per sale (FIFO/weighted avg), we approximate using
   * purchase unit costs averaged across all purchase items in range.
   */
  async profitSnapshot(args: {
    companyId: string;
    from?: string;
    to?: string;
  }) {
    // revenue: sum(invoice.total)
    const sales = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['issued', 'paid'] },
        ...(args.from || args.to
          ? {
              issueDate: {
                ...(args.from ? { gte: new Date(args.from) } : {}),
                ...(args.to ? { lte: new Date(args.to) } : {}),
              },
            }
          : {}),
      },
      select: { total: true },
    });

    const revenue = sales.reduce(
      (acc: number, r: (typeof sales)[number]) =>
        acc + Number(r.total.toString()),
      0,
    );

    // purchases: sum(purchase.total)
    const purchases = await this.prisma.purchase.findMany({
      where: {
        companyId: args.companyId,
        status: 'received',
        ...(args.from || args.to
          ? {
              purchaseDate: {
                ...(args.from ? { gte: new Date(args.from) } : {}),
                ...(args.to ? { lte: new Date(args.to) } : {}),
              },
            }
          : {}),
      },
      select: { total: true },
    });

    const purchaseTotal = purchases.reduce(
      (acc: number, r: (typeof purchases)[number]) =>
        acc + Number(r.total.toString()),
      0,
    );

    // grossProfit is approximation until accounting/COGS is implemented.
    const grossProfit = revenue - purchaseTotal;

    return {
      data: {
        revenue,
        cogs: purchaseTotal,
        gross_profit: grossProfit,
        net_profit: grossProfit,
        currency: 'INR',
        is_estimate: true,
        note: 'Profit uses purchase totals as a temporary COGS proxy until true inventory costing is introduced.',
      },
    };
  }

  async profitSnapshotSeries(args: {
    companyId: string;
    from?: string;
    to?: string;
    grain?: string;
  }) {
    const grain = this.normalizeSeriesGrain(args.grain);
    const salesDate = this.buildDateRange(args.from, args.to);
    const purchaseDate = this.buildDateRange(args.from, args.to);
    const [sales, purchases] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          companyId: args.companyId,
          status: { in: ['issued', 'paid'] },
          ...(salesDate ? { issueDate: salesDate } : {}),
        },
        select: {
          issueDate: true,
          total: true,
        },
        orderBy: [{ issueDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.purchase.findMany({
        where: {
          companyId: args.companyId,
          status: 'received',
          ...(purchaseDate ? { purchaseDate } : {}),
        },
        select: {
          purchaseDate: true,
          total: true,
        },
        orderBy: [{ purchaseDate: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const grouped = new Map<
      string,
      {
        period: string;
        period_start: string;
        period_end: string;
        revenue: number;
        cogs: number;
      }
    >();

    for (const row of sales) {
      if (!row.issueDate) continue;
      const meta = this.buildPeriodMeta(row.issueDate, grain);
      const current = grouped.get(meta.period) ?? {
        ...meta,
        revenue: 0,
        cogs: 0,
      };
      current.revenue += this.numberFromDecimalLike(row.total);
      grouped.set(meta.period, current);
    }

    for (const row of purchases) {
      const purchaseDate = row.purchaseDate;
      if (!purchaseDate) continue;
      const meta = this.buildPeriodMeta(purchaseDate, grain);
      const current = grouped.get(meta.period) ?? {
        ...meta,
        revenue: 0,
        cogs: 0,
      };
      current.cogs += this.numberFromDecimalLike(row.total);
      grouped.set(meta.period, current);
    }

    return {
      data: Array.from(grouped.values())
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((row) => {
          const grossProfit = row.revenue - row.cogs;
          const marginPercent =
            row.revenue > 0 ? (grossProfit / row.revenue) * 100 : 0;

          return {
            ...row,
            gross_profit: grossProfit,
            net_profit: grossProfit,
            gross_margin_percent: marginPercent,
            net_margin_percent: marginPercent,
            is_estimate: true,
          };
        }),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        grain,
        currency: 'INR',
        is_estimate: true,
        note: 'Profit uses purchase totals as a temporary COGS proxy until true inventory costing is introduced.',
      },
    };
  }

  async salesBySalesperson(args: {
    companyId: string;
    from?: string;
    to?: string;
  }) {
    const issueDate = this.buildDateRange(args.from, args.to);
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['issued', 'paid'] },
        ...(issueDate ? { issueDate } : {}),
      },
      select: {
        salespersonUserId: true,
        total: true,
        amountPaid: true,
        balanceDue: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const grouped = new Map<string, {
      salesperson_user_id: string | null;
      salesperson_name: string;
      salesperson_email: string | null;
      invoices_count: number;
      gross_sales: number;
      amount_paid: number;
      amount_due: number;
    }>();

    for (const row of rows) {
      const key = row.salespersonUserId ?? 'unassigned';
      const current = grouped.get(key) ?? {
        salesperson_user_id: row.salespersonUserId ?? null,
        salesperson_name: row.salesperson?.name ?? row.salesperson?.email ?? 'Unassigned',
        salesperson_email: row.salesperson?.email ?? null,
        invoices_count: 0,
        gross_sales: 0,
        amount_paid: 0,
        amount_due: 0,
      };
      current.invoices_count += 1;
      current.gross_sales += Number(row.total.toString());
      current.amount_paid += Number(row.amountPaid.toString());
      current.amount_due += Number(row.balanceDue.toString());
      grouped.set(key, current);
    }

    return {
      data: Array.from(grouped.values()).sort((a, b) => b.gross_sales - a.gross_sales),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        currency: 'INR',
      },
    };
  }

  async collectionsBySalesperson(args: {
    companyId: string;
    from?: string;
    to?: string;
  }) {
    const paymentDate = this.buildDateRange(args.from, args.to);
    const rows = await this.prisma.payment.findMany({
      where: {
        companyId: args.companyId,
        invoiceId: { not: null },
        ...(paymentDate ? { paymentDate } : {}),
      },
      select: {
        salespersonUserId: true,
        amount: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const grouped = new Map<string, {
      salesperson_user_id: string | null;
      salesperson_name: string;
      salesperson_email: string | null;
      payments_count: number;
      collections_amount: number;
    }>();

    for (const row of rows) {
      const key = row.salespersonUserId ?? 'unassigned';
      const current = grouped.get(key) ?? {
        salesperson_user_id: row.salespersonUserId ?? null,
        salesperson_name: row.salesperson?.name ?? row.salesperson?.email ?? 'Unassigned',
        salesperson_email: row.salesperson?.email ?? null,
        payments_count: 0,
        collections_amount: 0,
      };
      current.payments_count += 1;
      current.collections_amount += Number(row.amount.toString());
      grouped.set(key, current);
    }

    return {
      data: Array.from(grouped.values()).sort(
        (a, b) => b.collections_amount - a.collections_amount,
      ),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        currency: 'INR',
      },
    };
  }

  async outstandingBySalesperson(args: {
    companyId: string;
    asOf?: string;
  }) {
    const asOf = args.asOf ? new Date(args.asOf) : null;
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: 'issued',
        balanceDue: { gt: 0 },
        ...(asOf ? { issueDate: { lte: asOf } } : {}),
      },
      select: {
        salespersonUserId: true,
        balanceDue: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const grouped = new Map<string, {
      salesperson_user_id: string | null;
      salesperson_name: string;
      salesperson_email: string | null;
      invoices_count: number;
      outstanding_amount: number;
    }>();

    for (const row of rows) {
      const key = row.salespersonUserId ?? 'unassigned';
      const current = grouped.get(key) ?? {
        salesperson_user_id: row.salespersonUserId ?? null,
        salesperson_name: row.salesperson?.name ?? row.salesperson?.email ?? 'Unassigned',
        salesperson_email: row.salesperson?.email ?? null,
        invoices_count: 0,
        outstanding_amount: 0,
      };
      current.invoices_count += 1;
      current.outstanding_amount += Number(row.balanceDue.toString());
      grouped.set(key, current);
    }

    return {
      data: Array.from(grouped.values()).sort(
        (a, b) => b.outstanding_amount - a.outstanding_amount,
      ),
      meta: {
        as_of: args.asOf ?? null,
        currency: 'INR',
      },
    };
  }

  async outstandingByCustomer(args: {
    companyId: string;
    asOf?: string;
  }) {
    const asOf = args.asOf ? new Date(args.asOf) : null;
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: 'issued',
        balanceDue: { gt: 0 },
        ...(asOf ? { issueDate: { lte: asOf } } : {}),
      },
      select: {
        customerId: true,
        balanceDue: true,
        dueDate: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const grouped = new Map<string, {
      customer_id: string;
      customer_name: string;
      salesperson_user_id: string | null;
      salesperson_name: string;
      salesperson_email: string | null;
      invoices_count: number;
      outstanding_amount: number;
      oldest_due_date: string | null;
    }>();

    for (const row of rows) {
      const key = row.customerId;
      const current = grouped.get(key) ?? {
        customer_id: row.customer.id,
        customer_name: row.customer.name,
        salesperson_user_id: row.salesperson?.id ?? null,
        salesperson_name: row.salesperson?.name ?? row.salesperson?.email ?? 'Unassigned',
        salesperson_email: row.salesperson?.email ?? null,
        invoices_count: 0,
        outstanding_amount: 0,
        oldest_due_date: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null,
      };
      current.invoices_count += 1;
      current.outstanding_amount += Number(row.balanceDue.toString());
      const dueDate = row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null;
      if (dueDate && (!current.oldest_due_date || dueDate < current.oldest_due_date)) {
        current.oldest_due_date = dueDate;
      }
      grouped.set(key, current);
    }

    return {
      data: Array.from(grouped.values()).sort(
        (a, b) => b.outstanding_amount - a.outstanding_amount,
      ),
      meta: {
        as_of: args.asOf ?? null,
        currency: 'INR',
      },
    };
  }

  async stockByWarehouse(args: { companyId: string }) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { companyId: args.companyId, isActive: true },
      include: {
        stocks: {
          include: {
            product: {
              select: {
                id: true,
                reorderLevel: true,
                costPrice: true,
              },
            },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return {
      data: warehouses.map((warehouse) => {
        const total_quantity = warehouse.stocks.reduce(
          (sum, row) => sum + Number(row.quantity.toString()),
          0,
        );
        const stock_value = warehouse.stocks.reduce((sum, row) => {
          const qty = Number(row.quantity.toString());
          const cost = Number(row.product.costPrice?.toString?.() ?? 0);
          return sum + qty * cost;
        }, 0);
        const low_stock_lines = warehouse.stocks.filter((row) => {
          const reorder = Number(row.product.reorderLevel?.toString?.() ?? 0);
          return reorder > 0 && Number(row.quantity.toString()) <= reorder;
        }).length;

        return {
          warehouse_id: warehouse.id,
          warehouse_name: warehouse.name,
          warehouse_code: warehouse.code,
          is_default: warehouse.isDefault,
          sku_count: warehouse.stocks.length,
          total_quantity,
          stock_value,
          low_stock_lines,
        };
      }),
      meta: { currency: 'INR' },
    };
  }

  async productMovement(args: {
    companyId: string;
    from?: string;
    to?: string;
    limit: number;
  }) {
    const issueDate = this.buildDateRange(args.from, args.to);
    const soldRows = await this.prisma.invoiceItem.findMany({
      where: {
        companyId: args.companyId,
        invoice: {
          status: { in: ['issued', 'paid'] },
          ...(issueDate ? { issueDate } : {}),
        },
      },
      select: {
        productId: true,
        quantity: true,
        lineTotal: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
          },
        },
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        companyId: args.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
      orderBy: { name: 'asc' },
    });

    const movementMap = new Map<string, {
      product_id: string;
      product_name: string;
      sku: string | null;
      sold_quantity: number;
      sales_amount: number;
      current_stock: number;
    }>();

    for (const product of products) {
      movementMap.set(product.id, {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku ?? null,
        sold_quantity: 0,
        sales_amount: 0,
        current_stock: Number(product.stock.toString()),
      });
    }

    for (const row of soldRows) {
      const current = movementMap.get(row.productId);
      if (!current) continue;
      current.sold_quantity += Number(row.quantity.toString());
      current.sales_amount += Number(row.lineTotal.toString());
    }

    const allRows = Array.from(movementMap.values());
    const fast_moving = [...allRows]
      .sort((a, b) => b.sold_quantity - a.sold_quantity || b.sales_amount - a.sales_amount)
      .slice(0, args.limit);
    const slow_moving = [...allRows]
      .filter((row) => row.current_stock > 0)
      .sort((a, b) => a.sold_quantity - b.sold_quantity || b.current_stock - a.current_stock)
      .slice(0, args.limit);

    return {
      data: {
        fast_moving,
        slow_moving,
      },
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        limit: args.limit,
        currency: 'INR',
      },
    };
  }

  async distributorDashboard(args: {
    companyId: string;
    from?: string;
    to?: string;
    asOf?: string;
  }) {
    const [sales, collections, outstandingByRep, outstandingByCustomer, stockByWarehouse, movement] =
      await Promise.all([
        this.salesBySalesperson(args),
        this.collectionsBySalesperson(args),
        this.outstandingBySalesperson({ companyId: args.companyId, asOf: args.asOf }),
        this.outstandingByCustomer({ companyId: args.companyId, asOf: args.asOf }),
        this.stockByWarehouse({ companyId: args.companyId }),
        this.productMovement({ companyId: args.companyId, from: args.from, to: args.to, limit: 5 }),
      ]);

    return {
      data: {
        totals: {
          gross_sales: sales.data.reduce((sum, row) => sum + row.gross_sales, 0),
          collections: collections.data.reduce((sum, row) => sum + row.collections_amount, 0),
          outstanding: outstandingByRep.data.reduce((sum, row) => sum + row.outstanding_amount, 0),
          stock_value: stockByWarehouse.data.reduce((sum, row) => sum + row.stock_value, 0),
        },
        top_salespeople: sales.data.slice(0, 5),
        top_collectors: collections.data.slice(0, 5),
        top_due_customers: outstandingByCustomer.data.slice(0, 5),
        warehouse_snapshot: stockByWarehouse.data,
        fast_moving: movement.data.fast_moving,
        slow_moving: movement.data.slow_moving,
      },
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        as_of: args.asOf ?? null,
        currency: 'INR',
      },
    };
  }

  async dispatchOperations(args: {
    companyId: string;
    q?: string;
    warehouseId?: string;
  }) {
    const [orders, challans] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: {
          companyId: args.companyId,
          status: { in: ['confirmed', 'partially_fulfilled'] },
          ...(args.q
            ? {
                OR: [
                  { orderNumber: { contains: args.q, mode: 'insensitive' } },
                  { customer: { name: { contains: args.q, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        orderBy: [{ expectedDispatchDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
          challans: {
            where: args.warehouseId ? { warehouseId: args.warehouseId } : undefined,
            include: {
              invoice: { select: { id: true } },
              warehouse: { select: { id: true, name: true, code: true } },
              items: true,
            },
          },
        },
      }),
      this.prisma.deliveryChallan.findMany({
        where: {
          companyId: args.companyId,
          ...(args.warehouseId ? { warehouseId: args.warehouseId } : {}),
          ...(args.q
            ? {
                OR: [
                  { challanNumber: { contains: args.q, mode: 'insensitive' } },
                  {
                    salesOrder: {
                      orderNumber: { contains: args.q, mode: 'insensitive' },
                    },
                  },
                  { customer: { name: { contains: args.q, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }],
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          salesOrder: {
            select: { id: true, orderNumber: true, status: true },
          },
          warehouse: { select: { id: true, name: true, code: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
          items: true,
        },
      }),
    ]);

    const pendingDispatch: Array<Record<string, unknown>> = [];
    const partialOrders: Array<Record<string, unknown>> = [];
    let pendingDispatchQuantity = 0;

    for (const order of orders) {
      const pendingQty = order.items.reduce((sum, item) => {
        const openCommitted = order.challans.reduce((challanSum, challan) => {
          if (challan.status.toLowerCase() === 'cancelled') return challanSum;
          if (challan.invoice?.id) return challanSum;
          const challanItem = challan.items.find(
            (entry) => entry.salesOrderItemId === item.id,
          );
          return (
            challanSum +
            Number(challanItem?.quantityRequested?.toString?.() ?? 0)
          );
        }, 0);

        const remaining =
          Number(item.quantityOrdered.toString()) -
          Number(item.quantityFulfilled.toString()) -
          openCommitted;

        return sum + Math.max(0, remaining);
      }, 0);

      if (pendingQty <= 0) continue;

      pendingDispatchQuantity += pendingQty;
      const row = {
        sales_order_id: order.id,
        order_number: order.orderNumber,
        status: order.status,
        expected_dispatch_date:
          order.expectedDispatchDate?.toISOString().slice(0, 10) ?? null,
        customer: order.customer,
        pending_dispatch_quantity: pendingQty,
        challans_count: order.challans.length,
        latest_challan_status:
          order.challans
            .slice()
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
            ?.status ?? null,
      };

      pendingDispatch.push(row);

      if (order.challans.some((challan) => challan.status !== 'cancelled')) {
        partialOrders.push({
          ...row,
          open_challans: order.challans.filter(
            (challan) => challan.status !== 'cancelled' && !challan.invoice?.id,
          ).length,
        });
      }
    }

    const challanRows = challans.map((challan) => {
      const requested = challan.items.reduce(
        (sum, item) => sum + Number(item.quantityRequested.toString()),
        0,
      );
      const dispatched = challan.items.reduce(
        (sum, item) => sum + Number(item.quantityDispatched.toString()),
        0,
      );
      const delivered = challan.items.reduce(
        (sum, item) => sum + Number(item.quantityDelivered.toString()),
        0,
      );
      const shortSupply = challan.items.reduce(
        (sum, item) => sum + Number(item.shortSupplyQuantity.toString()),
        0,
      );

      return {
        id: challan.id,
        challan_number: challan.challanNumber,
        status: challan.status,
        challan_date: challan.challanDate?.toISOString().slice(0, 10) ?? null,
        dispatched_at: challan.dispatchedAt?.toISOString() ?? null,
        delivered_at: challan.deliveredAt?.toISOString() ?? null,
        customer: challan.customer,
        warehouse: challan.warehouse,
        sales_order: challan.salesOrder,
        invoice: challan.invoice,
        transporter_name: challan.transporterName,
        vehicle_number: challan.vehicleNumber,
        requested_quantity: requested,
        dispatched_quantity: dispatched,
        delivered_quantity: delivered,
        short_supply_quantity: shortSupply,
      };
    });

    const dispatchedNotDelivered = challanRows.filter(
      (row) => row.status === 'dispatched' && !row.delivered_at,
    );
    const deliveredNotInvoiced = challanRows.filter(
      (row) => row.status === 'delivered' && !row.invoice?.id,
    );
    const openChallans = challanRows.filter(
      (row) => row.status !== 'cancelled' && !row.invoice?.id,
    );

    return {
      data: {
        totals: {
          pending_dispatch_orders: pendingDispatch.length,
          pending_dispatch_quantity: pendingDispatchQuantity,
          partial_orders: partialOrders.length,
          open_challans: openChallans.length,
          dispatched_not_delivered: dispatchedNotDelivered.length,
          delivered_not_invoiced: deliveredNotInvoiced.length,
        },
        pending_dispatch: pendingDispatch,
        partial_orders: partialOrders,
        dispatched_not_delivered: dispatchedNotDelivered,
        delivered_not_invoiced: deliveredNotInvoiced,
      },
      meta: {
        warehouse_id: args.warehouseId ?? null,
        q: args.q ?? null,
      },
    };
  }

  async schemeUsage(args: { companyId: string; from?: string; to?: string }) {
    const rows = await this.prisma.invoiceItem.findMany({
      where: {
        companyId: args.companyId,
        invoice: {
          status: { in: ['issued', 'paid'] },
          ...(args.from || args.to
            ? {
                issueDate: this.buildDateRange(args.from, args.to),
              }
            : {}),
        },
      },
      select: {
        lineTotal: true,
        pricingSnapshot: true,
      },
    });

    const bucket = new Map<
      string,
      {
        scheme_code: string;
        scheme_name: string;
        scheme_type: string;
        line_count: number;
        discount_amount: number;
        free_quantity: number;
      }
    >();

    for (const row of rows) {
      const snapshot =
        row.pricingSnapshot && typeof row.pricingSnapshot === 'object'
          ? (row.pricingSnapshot as Record<string, unknown>)
          : {};
      const appliedSchemes = Array.isArray(snapshot.applied_schemes)
        ? (snapshot.applied_schemes as Array<Record<string, unknown>>)
        : [];

      for (const scheme of appliedSchemes) {
        const code = String(scheme.code ?? 'unknown');
        const current = bucket.get(code) ?? {
          scheme_code: code,
          scheme_name: String(scheme.name ?? code),
          scheme_type: String(scheme.scheme_type ?? 'unknown'),
          line_count: 0,
          discount_amount: 0,
          free_quantity: 0,
        };
        current.line_count += 1;
        current.discount_amount += Number(scheme.discount_amount ?? 0);
        current.free_quantity += Number(scheme.free_quantity ?? 0);
        bucket.set(code, current);
      }
    }

    return {
      data: Array.from(bucket.values()).sort(
        (a, b) => b.discount_amount - a.discount_amount || b.line_count - a.line_count,
      ),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        currency: 'INR',
      },
    };
  }

  async discountLeakage(args: { companyId: string; from?: string; to?: string }) {
    const rows = await this.prisma.invoiceItem.findMany({
      where: {
        companyId: args.companyId,
        invoice: {
          status: { in: ['issued', 'paid'] },
          ...(args.from || args.to
            ? {
                issueDate: this.buildDateRange(args.from, args.to),
              }
            : {}),
        },
      },
      select: {
        pricingSource: true,
        pricingSnapshot: true,
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const productBucket = new Map<
      string,
      { product_id: string; product_name: string; sku: string | null; manual_discount: number; overrides: number }
    >();
    let resolvedDiscount = 0;
    let enteredDiscount = 0;
    let manualDiscount = 0;
    let overrideLines = 0;

    for (const row of rows) {
      const snapshot =
        row.pricingSnapshot && typeof row.pricingSnapshot === 'object'
          ? (row.pricingSnapshot as Record<string, unknown>)
          : {};
      const resolved = Number(snapshot.resolved_discount ?? 0);
      const entered = Number(snapshot.entered_discount ?? 0);
      const manualPart = Math.max(0, entered - resolved);

      resolvedDiscount += resolved;
      enteredDiscount += entered;
      manualDiscount += manualPart;
      if (row.pricingSource === 'manual_override') {
        overrideLines += 1;
      }

      const current = productBucket.get(row.product.id) ?? {
        product_id: row.product.id,
        product_name: row.product.name,
        sku: row.product.sku ?? null,
        manual_discount: 0,
        overrides: 0,
      };
      current.manual_discount += manualPart;
      current.overrides += row.pricingSource === 'manual_override' ? 1 : 0;
      productBucket.set(row.product.id, current);
    }

    return {
      data: {
        totals: {
          resolved_discount: resolvedDiscount,
          entered_discount: enteredDiscount,
          manual_discount: manualDiscount,
          override_lines: overrideLines,
        },
        top_override_products: Array.from(productBucket.values())
          .sort((a, b) => b.manual_discount - a.manual_discount || b.overrides - a.overrides)
          .slice(0, 10),
      },
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        currency: 'INR',
      },
    };
  }

  async priceCoverage(args: { companyId: string }) {
    const [productCount, priceListItems, customerRates, schemes] = await Promise.all([
      this.prisma.product.count({
        where: { companyId: args.companyId, deletedAt: null },
      }),
      this.prisma.priceListItem.findMany({
        where: { companyId: args.companyId, priceList: { isActive: true } },
        select: { productId: true },
      }),
      this.prisma.customerProductPrice.count({ where: { companyId: args.companyId, isActive: true } }),
      this.prisma.commercialScheme.count({ where: { companyId: args.companyId, isActive: true } }),
    ]);

    const coveredProducts = new Set(priceListItems.map((item) => item.productId));
    return {
      data: {
        total_products: productCount,
        products_with_price_lists: coveredProducts.size,
        price_list_coverage_percent:
          productCount > 0 ? (coveredProducts.size / productCount) * 100 : 0,
        customer_special_rates: customerRates,
        active_schemes: schemes,
      },
    };
  }

  async commercialAudit(args: { companyId: string; limit: number }) {
    const data = await this.prisma.commercialAuditLog.findMany({
      where: { companyId: args.companyId },
      orderBy: { createdAt: 'desc' },
      take: args.limit,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      data: data.map((row) => ({
        id: row.id,
        document_type: row.documentType,
        document_id: row.documentId,
        action: row.action,
        pricing_source: row.pricingSource,
        override_reason: row.overrideReason,
        created_at: row.createdAt.toISOString(),
        actor: row.actor,
        customer: row.customer,
        product: row.product,
        warnings: row.warnings,
        snapshot: row.snapshot,
      })),
      meta: { limit: args.limit },
    };
  }

  async commercialAuditSeries(args: {
    companyId: string;
    from?: string;
    to?: string;
    grain?: string;
  }) {
    const createdAt = this.buildDateRange(args.from, args.to);
    const grain = this.normalizeSeriesGrain(args.grain);
    const rows = await this.prisma.commercialAuditLog.findMany({
      where: {
        companyId: args.companyId,
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        documentId: true,
        action: true,
        pricingSource: true,
        overrideReason: true,
        warnings: true,
      },
    });

    const grouped = new Map<
      string,
      {
        period: string;
        period_start: string;
        period_end: string;
        total_events: number;
        manual_override_events: number;
        warning_events: number;
        customer_override_events: number;
        price_list_events: number;
        product_price_events: number;
        unique_documents: Set<string>;
      }
    >();

    for (const row of rows) {
      const meta = this.buildPeriodMeta(row.createdAt, grain);
      const current = grouped.get(meta.period) ?? {
        ...meta,
        total_events: 0,
        manual_override_events: 0,
        warning_events: 0,
        customer_override_events: 0,
        price_list_events: 0,
        product_price_events: 0,
        unique_documents: new Set<string>(),
      };

      current.total_events += 1;
      current.unique_documents.add(row.documentId);

      const pricingSource = row.pricingSource ?? null;
      const action = row.action.toLowerCase();
      const hasWarnings =
        Array.isArray(row.warnings) && row.warnings.length > 0;
      const isManualOverride =
        Boolean(row.overrideReason) ||
        pricingSource === 'customer_override' ||
        action.includes('override');

      if (isManualOverride) current.manual_override_events += 1;
      if (hasWarnings) current.warning_events += 1;
      if (pricingSource === 'customer_override') {
        current.customer_override_events += 1;
      }
      if (
        pricingSource === 'pricing_tier_price_list' ||
        pricingSource === 'global_price_list'
      ) {
        current.price_list_events += 1;
      }
      if (pricingSource === 'product_price') {
        current.product_price_events += 1;
      }

      grouped.set(meta.period, current);
    }

    return {
      data: Array.from(grouped.values())
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((row) => ({
          period: row.period,
          period_start: row.period_start,
          period_end: row.period_end,
          total_events: row.total_events,
          manual_override_events: row.manual_override_events,
          warning_events: row.warning_events,
          customer_override_events: row.customer_override_events,
          price_list_events: row.price_list_events,
          product_price_events: row.product_price_events,
          unique_documents: row.unique_documents.size,
        })),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        grain,
      },
    };
  }

  private bucketAging(days: number) {
    if (days <= 0) return 'current';
    if (days <= 30) return '1_30';
    if (days <= 60) return '31_60';
    if (days <= 90) return '61_90';
    return '90_plus';
  }

  async receivableAging(args: { companyId: string; asOf?: string }) {
    const asOf = args.asOf ? new Date(args.asOf) : new Date();
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['issued', 'paid'] },
        balanceDue: { gt: 0 },
      },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        dueDate: true,
        balanceDue: true,
        customer: {
          select: {
            id: true,
            name: true,
            creditLimit: true,
            creditHold: true,
          },
        },
      },
    });

    const customers = new Map<
      string,
      {
        customer_id: string;
        customer_name: string;
        current: number;
        bucket_1_30: number;
        bucket_31_60: number;
        bucket_61_90: number;
        bucket_90_plus: number;
        total_due: number;
        invoices_count: number;
        credit_limit: number;
        credit_hold: boolean;
      }
    >();

    for (const row of rows) {
      const customerId = row.customer.id;
      const dueAt = row.dueDate ?? row.issueDate ?? asOf;
      const ageDays = Math.max(
        0,
        Math.floor((asOf.getTime() - new Date(dueAt).getTime()) / 86_400_000),
      );
      const bucket = this.bucketAging(ageDays);
      const amount = Number(row.balanceDue.toString());
      const current =
        customers.get(customerId) ??
        {
          customer_id: customerId,
          customer_name: row.customer.name,
          current: 0,
          bucket_1_30: 0,
          bucket_31_60: 0,
          bucket_61_90: 0,
          bucket_90_plus: 0,
          total_due: 0,
          invoices_count: 0,
          credit_limit: Number(row.customer.creditLimit?.toString() ?? 0),
          credit_hold: row.customer.creditHold,
        };
      if (bucket === 'current') current.current += amount;
      if (bucket === '1_30') current.bucket_1_30 += amount;
      if (bucket === '31_60') current.bucket_31_60 += amount;
      if (bucket === '61_90') current.bucket_61_90 += amount;
      if (bucket === '90_plus') current.bucket_90_plus += amount;
      current.total_due += amount;
      current.invoices_count += 1;
      customers.set(customerId, current);
    }

    const data = Array.from(customers.values()).sort(
      (a, b) => b.total_due - a.total_due,
    );

    return {
      data,
      meta: {
        as_of: asOf.toISOString().slice(0, 10),
        totals: {
          current: data.reduce((sum, row) => sum + row.current, 0),
          bucket_1_30: data.reduce((sum, row) => sum + row.bucket_1_30, 0),
          bucket_31_60: data.reduce((sum, row) => sum + row.bucket_31_60, 0),
          bucket_61_90: data.reduce((sum, row) => sum + row.bucket_61_90, 0),
          bucket_90_plus: data.reduce((sum, row) => sum + row.bucket_90_plus, 0),
          total_due: data.reduce((sum, row) => sum + row.total_due, 0),
        },
      },
    };
  }

  async payableAging(args: { companyId: string; asOf?: string }) {
    const asOf = args.asOf ? new Date(args.asOf) : new Date();
    const purchases = await this.prisma.purchase.findMany({
      where: {
        companyId: args.companyId,
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        purchaseDate: true,
        total: true,
        supplier: { select: { id: true, name: true } },
      },
    });
    const payments = await this.prisma.payment.findMany({
      where: {
        companyId: args.companyId,
        purchaseId: { not: null },
      },
      select: {
        purchaseId: true,
        amount: true,
      },
    });
    const paidByPurchase = new Map<string, number>();
    for (const payment of payments) {
      if (!payment.purchaseId) continue;
      paidByPurchase.set(
        payment.purchaseId,
        (paidByPurchase.get(payment.purchaseId) ?? 0) +
          Number(payment.amount.toString()),
      );
    }

    const suppliers = new Map<
      string,
      {
        supplier_id: string;
        supplier_name: string;
        current: number;
        bucket_1_30: number;
        bucket_31_60: number;
        bucket_61_90: number;
        bucket_90_plus: number;
        total_due: number;
        purchases_count: number;
      }
    >();

    for (const purchase of purchases) {
      const paid = paidByPurchase.get(purchase.id) ?? 0;
      const due = Number(purchase.total.toString()) - paid;
      if (due <= 0) continue;
      const effectiveDate = purchase.purchaseDate ?? asOf;
      const ageDays = Math.max(
        0,
        Math.floor(
          (asOf.getTime() - new Date(effectiveDate).getTime()) / 86_400_000,
        ),
      );
      const bucket = this.bucketAging(ageDays);
      const current =
        suppliers.get(purchase.supplier.id) ??
        {
          supplier_id: purchase.supplier.id,
          supplier_name: purchase.supplier.name,
          current: 0,
          bucket_1_30: 0,
          bucket_31_60: 0,
          bucket_61_90: 0,
          bucket_90_plus: 0,
          total_due: 0,
          purchases_count: 0,
        };
      if (bucket === 'current') current.current += due;
      if (bucket === '1_30') current.bucket_1_30 += due;
      if (bucket === '31_60') current.bucket_31_60 += due;
      if (bucket === '61_90') current.bucket_61_90 += due;
      if (bucket === '90_plus') current.bucket_90_plus += due;
      current.total_due += due;
      current.purchases_count += 1;
      suppliers.set(purchase.supplier.id, current);
    }

    const data = Array.from(suppliers.values()).sort(
      (a, b) => b.total_due - a.total_due,
    );

    return {
      data,
      meta: {
        as_of: asOf.toISOString().slice(0, 10),
        totals: {
          total_due: data.reduce((sum, row) => sum + row.total_due, 0),
        },
      },
    };
  }

  async creditControlDashboard(args: { companyId: string; asOf?: string }) {
    const [aging, openTasks, pendingInstruments, bouncedInstruments, unmatchedLines] =
      await Promise.all([
        this.receivableAging(args),
        this.prisma.collectionTask.count({
          where: { companyId: args.companyId, status: { in: ['open', 'in_progress'] } },
        }),
        this.prisma.payment.count({
          where: {
            companyId: args.companyId,
            instrumentStatus: { in: ['received', 'deposited'] },
          },
        }),
        this.prisma.payment.count({
          where: { companyId: args.companyId, instrumentStatus: 'bounced' },
        }),
        this.prisma.bankStatementLine.count({
          where: { companyId: args.companyId, status: 'unmatched' },
        }),
      ]);

    const highRiskCustomers = aging.data
      .map((row) => ({
        ...row,
        exposure_percent:
          row.credit_limit > 0 ? (row.total_due / row.credit_limit) * 100 : 0,
      }))
      .sort(
        (a, b) =>
          b.bucket_90_plus - a.bucket_90_plus ||
          b.exposure_percent - a.exposure_percent,
      )
      .slice(0, 10);

    return {
      data: {
        totals: {
          total_due: aging.meta.totals.total_due,
          overdue_90_plus: aging.meta.totals.bucket_90_plus,
          open_collection_tasks: openTasks,
          pending_instruments: pendingInstruments,
          bounced_instruments: bouncedInstruments,
          unmatched_bank_lines: unmatchedLines,
        },
        high_risk_customers: highRiskCustomers,
      },
      meta: {
        as_of: aging.meta.as_of,
        currency: 'INR',
      },
    };
  }

  async bankingReconciliationSummary(args: { companyId: string }) {
    const [matchedLines, unmatchedLines, unreconciledPayments, pendingInstruments, bouncedInstruments] =
      await Promise.all([
        this.prisma.bankStatementLine.count({
          where: { companyId: args.companyId, status: 'matched' },
        }),
        this.prisma.bankStatementLine.count({
          where: { companyId: args.companyId, status: 'unmatched' },
        }),
        this.prisma.payment.count({
          where: {
            companyId: args.companyId,
            method: { in: ['bank', 'upi', 'card', 'cheque', 'pdc'] },
            reconciledAt: null,
          },
        }),
        this.prisma.payment.count({
          where: {
            companyId: args.companyId,
            instrumentStatus: { in: ['received', 'deposited'] },
          },
        }),
        this.prisma.payment.count({
          where: { companyId: args.companyId, instrumentStatus: 'bounced' },
        }),
      ]);

    return {
      data: {
        matched_lines: matchedLines,
        unmatched_lines: unmatchedLines,
        unreconciled_payments: unreconciledPayments,
        pending_instruments: pendingInstruments,
        bounced_instruments: bouncedInstruments,
      },
    };
  }

  async routeCoverage(args: {
    companyId: string;
    from?: string;
    to?: string;
    routeId?: string;
  }) {
    const visitDate = this.buildDateRange(args.from, args.to);
    const rows = await this.prisma.salesVisitPlan.findMany({
      where: {
        companyId: args.companyId,
        ...(visitDate ? { visitDate } : {}),
        ...(args.routeId ? { routeId: args.routeId } : {}),
      },
      select: {
        status: true,
        routeId: true,
        route: { select: { id: true, code: true, name: true } },
        visit: { select: { productiveFlag: true } },
      },
    });

    const grouped = new Map<
      string,
      {
        route_id: string | null;
        route_code: string | null;
        route_name: string;
        planned_visits: number;
        completed_visits: number;
        missed_visits: number;
        productive_visits: number;
        completion_percent: number;
      }
    >();

    for (const row of rows) {
      const key = row.routeId ?? 'unassigned';
      const current = grouped.get(key) ?? {
        route_id: row.routeId ?? null,
        route_code: row.route?.code ?? null,
        route_name: row.route?.name ?? 'Unassigned',
        planned_visits: 0,
        completed_visits: 0,
        missed_visits: 0,
        productive_visits: 0,
        completion_percent: 0,
      };
      current.planned_visits += 1;
      if (row.status === 'completed') current.completed_visits += 1;
      if (row.status === 'missed') current.missed_visits += 1;
      if (row.visit?.productiveFlag) current.productive_visits += 1;
      grouped.set(key, current);
    }

    const data = Array.from(grouped.values())
      .map((row) => ({
        ...row,
        completion_percent:
          row.planned_visits > 0
            ? Number(((row.completed_visits / row.planned_visits) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.planned_visits - a.planned_visits);

    return {
      data,
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
      },
    };
  }

  async repVisitProductivity(args: {
    companyId: string;
    from?: string;
    to?: string;
    salespersonUserId?: string;
  }) {
    const visitDate = this.buildDateRange(args.from, args.to);
    const [visits, orders, collectionTasks] = await Promise.all([
      this.prisma.salesVisit.findMany({
        where: {
          companyId: args.companyId,
          ...(visitDate ? { visitDate } : {}),
          ...(args.salespersonUserId ? { salespersonUserId: args.salespersonUserId } : {}),
        },
        select: {
          salespersonUserId: true,
          productiveFlag: true,
          salesperson: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.salesOrder.findMany({
        where: {
          companyId: args.companyId,
          sourceChannel: 'field_sales',
          ...(visitDate ? { orderDate: visitDate } : {}),
          ...(args.salespersonUserId ? { salespersonUserId: args.salespersonUserId } : {}),
        },
        select: {
          salespersonUserId: true,
          total: true,
          salesperson: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.collectionTask.findMany({
        where: {
          companyId: args.companyId,
          createdAt:
            args.from || args.to
              ? {
                  ...(args.from ? { gte: new Date(`${args.from}T00:00:00.000Z`) } : {}),
                  ...(args.to ? { lte: new Date(`${args.to}T23:59:59.999Z`) } : {}),
                }
              : undefined,
          ...(args.salespersonUserId ? { salespersonUserId: args.salespersonUserId } : {}),
        },
        select: {
          salespersonUserId: true,
          salesperson: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const grouped = new Map<
      string,
      {
        salesperson_user_id: string | null;
        salesperson_name: string;
        salesperson_email: string | null;
        visits_count: number;
        productive_visits: number;
        non_productive_visits: number;
        orders_booked: number;
        order_value: number;
        promise_to_pay_count: number;
      }
    >();

    const ensure = (
      salespersonUserId: string | null,
      salesperson?: { id: string; name: string | null; email: string | null } | null,
    ) => {
      const key = salespersonUserId ?? 'unassigned';
      const current = grouped.get(key) ?? {
        salesperson_user_id: salespersonUserId,
        salesperson_name: salesperson?.name ?? salesperson?.email ?? 'Unassigned',
        salesperson_email: salesperson?.email ?? null,
        visits_count: 0,
        productive_visits: 0,
        non_productive_visits: 0,
        orders_booked: 0,
        order_value: 0,
        promise_to_pay_count: 0,
      };
      grouped.set(key, current);
      return current;
    };

    for (const visit of visits) {
      const current = ensure(visit.salespersonUserId, visit.salesperson);
      current.visits_count += 1;
      if (visit.productiveFlag) current.productive_visits += 1;
      else current.non_productive_visits += 1;
    }

    for (const order of orders) {
      const current = ensure(order.salespersonUserId, order.salesperson);
      current.orders_booked += 1;
      current.order_value += Number(order.total.toString());
    }

    for (const task of collectionTasks) {
      const current = ensure(task.salespersonUserId, task.salesperson);
      current.promise_to_pay_count += 1;
    }

    return {
      data: Array.from(grouped.values()).sort((a, b) => b.order_value - a.order_value),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        currency: 'INR',
      },
    };
  }

  async missedVisits(args: { companyId: string; date: string }) {
    const visitDate = new Date(args.date);
    const data = await this.prisma.salesVisitPlan.findMany({
      where: {
        companyId: args.companyId,
        visitDate,
        status: 'missed',
      },
      orderBy: [{ route: { name: 'asc' } }, { customer: { name: 'asc' } }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        salesperson: { select: { id: true, name: true, email: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        visit: {
          select: {
            id: true,
            notes: true,
            nextFollowUpDate: true,
          },
        },
      },
    });

    return {
      data: data.map((row) => ({
        visit_plan_id: row.id,
        customer: row.customer,
        salesperson: row.salesperson,
        route: row.route,
        beat: row.beat,
        notes: row.visit?.notes ?? row.notes ?? null,
        next_follow_up_date:
          row.visit?.nextFollowUpDate?.toISOString().slice(0, 10) ?? null,
      })),
      meta: { date: args.date },
    };
  }

  async routeOutstanding(args: { companyId: string; asOf?: string }) {
    const asOf = args.asOf ? new Date(args.asOf) : null;
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: 'issued',
        balanceDue: { gt: 0 },
        ...(asOf ? { issueDate: { lte: asOf } } : {}),
      },
      select: {
        balanceDue: true,
        salesOrder: {
          select: {
            routeId: true,
            route: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    const grouped = new Map<
      string,
      {
        route_id: string | null;
        route_code: string | null;
        route_name: string;
        outstanding_amount: number;
        invoices_count: number;
      }
    >();

    for (const row of rows) {
      const routeId = row.salesOrder?.routeId ?? null;
      const route = row.salesOrder?.route;
      const key = routeId ?? 'unassigned';
      const current = grouped.get(key) ?? {
        route_id: routeId,
        route_code: route?.code ?? null,
        route_name: route?.name ?? 'Unassigned',
        outstanding_amount: 0,
        invoices_count: 0,
      };
      current.outstanding_amount += Number(row.balanceDue.toString());
      current.invoices_count += 1;
      grouped.set(key, current);
    }

    return {
      data: Array.from(grouped.values()).sort(
        (a, b) => b.outstanding_amount - a.outstanding_amount,
      ),
      meta: {
        as_of: args.asOf ?? null,
        currency: 'INR',
      },
    };
  }

  async dcrRegister(args: { companyId: string; from?: string; to?: string }) {
    const reportDate = this.buildDateRange(args.from, args.to);
    const data = await this.prisma.repDailyReport.findMany({
      where: {
        companyId: args.companyId,
        ...(reportDate ? { reportDate } : {}),
      },
      orderBy: [{ reportDate: 'desc' }, { submittedAt: 'desc' }],
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      data: data.map((row) => ({
        id: row.id,
        report_date: row.reportDate.toISOString().slice(0, 10),
        status: row.status,
        salesperson: row.salesperson,
        planned_visits_count: row.plannedVisitsCount,
        completed_visits_count: row.completedVisitsCount,
        missed_visits_count: row.missedVisitsCount,
        productive_visits_count: row.productiveVisitsCount,
        sales_orders_count: row.salesOrdersCount,
        sales_order_value: Number(row.salesOrderValue.toString()),
        collection_updates_count: row.collectionUpdatesCount,
        submitted_at: row.submittedAt?.toISOString() ?? null,
        reviewed_at: row.reviewedAt?.toISOString() ?? null,
        reviewed_by: row.reviewedBy,
      })),
      meta: {
        from: args.from ?? null,
        to: args.to ?? null,
        currency: 'INR',
      },
    };
  }
}
