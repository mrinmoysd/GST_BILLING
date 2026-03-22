import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

type LedgerRow = {
  date: string;
  type: 'purchase' | 'payment';
  ref_id: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

@Injectable()
export class SuppliersService {
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
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async create(companyId: string, dto: CreateSupplierDto) {
    const data = {
      companyId,
      name: dto.name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      gstin: dto.gstin ?? null,
      stateCode: dto.state_code ?? null,
      address: dto.address ? (dto.address as any) : (Prisma as any).JsonNull,
    } satisfies Prisma.SupplierUncheckedCreateInput;

    return this.prisma.supplier.create({
      data,
    });
  }

  async get(companyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId, deletedAt: null },
    });

    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(companyId: string, supplierId: string, dto: UpdateSupplierDto) {
    await this.get(companyId, supplierId);

    const data = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      gstin: dto.gstin,
      stateCode: dto.state_code,
      address: dto.address ? (dto.address as any) : undefined,
    } satisfies Prisma.SupplierUncheckedUpdateInput;

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data,
    });
  }

  async remove(companyId: string, supplierId: string) {
    await this.get(companyId, supplierId);
    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: { deletedAt: new Date() },
    });
  }

  async ledger(
    companyId: string,
    supplierId: string,
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
    await this.get(companyId, supplierId);

    const fromDate = args.from ? new Date(args.from) : null;
    const toDate = args.to ? new Date(args.to) : null;
    if (fromDate && Number.isNaN(fromDate.valueOf())) {
      throw new Error('Invalid from');
    }
    if (toDate && Number.isNaN(toDate.valueOf())) {
      throw new Error('Invalid to');
    }

    // Supplier ledger as AP view:
    // - Purchases increase payable (credit)
    // - Payments reduce payable (debit)

    const purchaseWhere: any = {
      companyId,
      supplierId,
      status: { in: ['received', 'paid'] },
    };
    const paymentWhere: any = {
      companyId,
      purchase: {
        companyId,
        supplierId,
      },
    };

    const purchaseRange: any = { ...purchaseWhere };
    if (fromDate || toDate) {
      purchaseRange.purchaseDate = {
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

    let openingBalance = 0;
    if (fromDate) {
      const [purAgg, payAgg] = await this.prisma.$transaction([
        this.prisma.purchase.aggregate({
          where: {
            ...purchaseWhere,
            purchaseDate: { lt: fromDate },
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
        this.toNumber(purAgg._sum.total) - this.toNumber(payAgg._sum.amount);
    }

    const skip = (args.page - 1) * args.limit;

    const [purchases, payments] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where: purchaseRange,
        select: {
          id: true,
          purchaseDate: true,
          total: true,
          createdAt: true,
        },
        orderBy: [{ purchaseDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.payment.findMany({
        where: paymentRange,
        select: {
          id: true,
          paymentDate: true,
          amount: true,
          purchaseId: true,
          createdAt: true,
        },
        orderBy: [{ paymentDate: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const events: Array<{
      sortDate: Date;
      sortTie: string;
      row: Omit<LedgerRow, 'balance'>;
    }> = [];

    for (const p of purchases) {
      const amt = this.toNumber(p.total);
      events.push({
        sortDate: p.purchaseDate ? new Date(p.purchaseDate) : new Date(0),
        sortTie: `p:${p.id}`,
        row: {
          date: this.toDateString(p.purchaseDate),
          type: 'purchase',
          ref_id: p.id,
          description: `Purchase ${p.id}`,
          debit: 0,
          credit: amt,
        },
      });
    }

    for (const pay of payments) {
      const amt = this.toNumber(pay.amount);
      events.push({
        sortDate: new Date(pay.paymentDate),
        sortTie: `y:${pay.id}`,
        row: {
          date: this.toDateString(pay.paymentDate),
          type: 'payment',
          ref_id: pay.id,
          description: pay.purchaseId
            ? `Payment for purchase ${pay.purchaseId}`
            : 'Payment',
          debit: amt,
          credit: 0,
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
    for (const ev of events) {
      running = running + (ev.row.credit - ev.row.debit);
      rowsAll.push({ ...ev.row, balance: running });
    }

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
