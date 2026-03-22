import { Injectable, NotFoundException } from '@nestjs/common';
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
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

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
    } satisfies Prisma.CustomerUncheckedCreateInput;

    return this.prisma.customer.create({
      data,
    });
  }

  async get(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, deletedAt: null },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(companyId: string, customerId: string, dto: UpdateCustomerDto) {
    await this.get(companyId, customerId);

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
    } satisfies Prisma.CustomerUncheckedUpdateInput;

    return this.prisma.customer.update({
      where: { id: customerId },
      data,
    });
  }

  async remove(companyId: string, customerId: string) {
    await this.get(companyId, customerId);
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
    await this.get(companyId, customerId);

    const fromDate = args.from ? new Date(args.from) : null;
    const toDate = args.to ? new Date(args.to) : null;
    if (fromDate && Number.isNaN(fromDate.valueOf())) {
      throw new Error('Invalid from');
    }
    if (toDate && Number.isNaN(toDate.valueOf())) {
      throw new Error('Invalid to');
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
          invoiceId: true,
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
          description: p.invoiceId
            ? `Payment (Invoice ${p.invoiceId})`
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
