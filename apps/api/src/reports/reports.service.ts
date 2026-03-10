import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return { data: { ...totals, currency: 'INR' } };
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

    return { data: { ...totals, currency: 'INR' } };
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

    return { data, meta: { page: args.page, limit: args.limit, total } };
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

    return { data: data.slice(0, args.limit) };
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
    return {
      data: {
        revenue,
        purchases: purchaseTotal,
        gross_profit_estimate: revenue - purchaseTotal,
        currency: 'INR',
        note: 'Gross profit is an approximation until COGS/accounting is implemented.',
      },
    };
  }
}
