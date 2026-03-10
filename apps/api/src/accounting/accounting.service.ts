import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { CreateJournalDto } from './dto/create-journal.dto';

type TrialBalanceRow = {
  ledger_id: string;
  ledger_name: string;
  debit: number;
  credit: number;
};

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeLedgerType(type: string): string {
    return String(type ?? '')
      .trim()
      .toLowerCase();
  }

  private classifyTopLevel(
    type: string,
  ): 'asset' | 'liability' | 'equity' | 'income' | 'expense' | 'unknown' {
    const t = this.normalizeLedgerType(type);

    // Top-level
    if (t === 'asset') return 'asset';
    if (t === 'liability') return 'liability';
    if (t === 'equity') return 'equity';
    if (t === 'income') return 'income';
    if (t === 'expense') return 'expense';

    // Asset subtypes
    if (
      [
        'current_asset',
        'fixed_asset',
        'inventory',
        'accounts_receivable',
        'cash',
        'bank',
        'prepaid_expense',
      ].includes(t)
    ) {
      return 'asset';
    }

    // Liability subtypes
    if (
      [
        'current_liability',
        'long_term_liability',
        'accounts_payable',
        'tax_payable',
        'loan',
      ].includes(t)
    ) {
      return 'liability';
    }

    // Equity subtypes
    if (
      ['owner_equity', 'retained_earnings', 'capital', 'drawings'].includes(t)
    ) {
      return 'equity';
    }

    // Income subtypes
    if (
      [
        'sales',
        'service_income',
        'other_income',
        'discount_received',
        'interest_income',
      ].includes(t)
    ) {
      return 'income';
    }

    // Expense subtypes
    if (
      [
        'cost_of_goods_sold',
        'operating_expense',
        'salary',
        'rent',
        'utilities',
        'marketing',
        'purchase',
        'discount_given',
        'tax_expense',
      ].includes(t)
    ) {
      return 'expense';
    }

    return 'unknown';
  }

  async listLedgers(companyId: string) {
    const ledgers = await this.prisma.ledger.findMany({
      where: { companyId },
      orderBy: [{ accountCode: 'asc' }],
    });

    return ledgers.map(
      (l: {
        id: string;
        accountCode: string;
        accountName: string;
        type: string;
      }) => ({
        id: l.id,
        account_code: l.accountCode,
        account_name: l.accountName,
        type: l.type,
        balance: 0,
      }),
    );
  }

  async createLedger(companyId: string, dto: CreateLedgerDto) {
    const created = await this.prisma.ledger.create({
      data: {
        companyId,
        accountCode: dto.account_code,
        accountName: dto.account_name,
        type: dto.type,
      },
    });

    return {
      id: created.id,
      account_code: created.accountCode,
      account_name: created.accountName,
      type: created.type,
      balance: 0,
    };
  }

  async listJournals(params: {
    companyId: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    const { companyId, from, to, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: {
      companyId: string;
      date?: { gte?: Date; lte?: Date };
    } = { companyId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.journal.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: { id: true, date: true, narration: true },
      }),
      this.prisma.journal.count({ where }),
    ]);

    return {
      data: items.map(
        (j: { id: string; date: Date; narration: string | null }) => ({
          id: j.id,
          date: j.date.toISOString().slice(0, 10),
          narration: j.narration ?? null,
        }),
      ),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getJournal(companyId: string, journalId: string) {
    const journal = await this.prisma.journal.findFirst({
      where: { companyId, id: journalId },
      select: {
        id: true,
        date: true,
        narration: true,
        lines: {
          select: {
            id: true,
            amount: true,
            debitLedgerId: true,
            creditLedgerId: true,
            debitLedger: { select: { accountName: true } },
            creditLedger: { select: { accountName: true } },
          },
        },
      },
    });

    if (!journal) return null;

    return {
      id: journal.id,
      date: journal.date.toISOString().slice(0, 10),
      narration: journal.narration ?? null,
      lines: journal.lines.map(
        (l: {
          id: string;
          amount: unknown;
          debitLedgerId: string | null;
          creditLedgerId: string | null;
          debitLedger: { accountName: string } | null;
          creditLedger: { accountName: string } | null;
        }) => ({
          id: l.id,
          amount: Number(this.decimalToNumber(l.amount).toFixed(2)),
          debit_ledger_id: l.debitLedgerId,
          credit_ledger_id: l.creditLedgerId,
          debit_ledger_name: l.debitLedger?.accountName ?? null,
          credit_ledger_name: l.creditLedger?.accountName ?? null,
        }),
      ),
    };
  }

  private decimalToNumber(value: unknown): number {
    // Prisma Decimal type serializes as string in JS.
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeToString = (value as any)?.toString?.();
    if (typeof maybeToString === 'string') return Number(maybeToString);
    return Number(value);
  }

  private parseMoney(value: string, label: string): number {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) throw new BadRequestException(`${label} is required`);
    if (!/^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
      throw new BadRequestException(`${label} must be a decimal string`);
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n))
      throw new BadRequestException(`${label} must be finite`);
    if (n <= 0) throw new BadRequestException(`${label} must be > 0`);
    return n;
  }

  async createJournal(companyId: string, dto: CreateJournalDto) {
    const date = this.assertValidDate(dto.date, 'date');

    if (!Array.isArray(dto.lines) || dto.lines.length === 0) {
      throw new BadRequestException('lines must be a non-empty array');
    }

    // Validate shape and collect ledger ids.
    const debitIds = new Set<string>();
    const creditIds = new Set<string>();
    const linesNormalized = dto.lines.map((l, idx) => {
      const debitId = l.debit_ledger_id;
      const creditId = l.credit_ledger_id;

      if ((debitId && creditId) || (!debitId && !creditId)) {
        throw new BadRequestException(
          `lines[${idx}] must have exactly one of debit_ledger_id or credit_ledger_id`,
        );
      }

      const amt = this.parseMoney(l.amount, `lines[${idx}].amount`);
      if (debitId) debitIds.add(debitId);
      if (creditId) creditIds.add(creditId);

      return {
        debitId: debitId ?? null,
        creditId: creditId ?? null,
        amount: amt,
      };
    });

    // Ledger validation (company scoped)
    const ledgerIds = Array.from(new Set([...debitIds, ...creditIds]));
    const ledgers = await this.prisma.ledger.findMany({
      where: { companyId, id: { in: ledgerIds } },
      select: { id: true },
    });
    const found = new Set(ledgers.map((l: { id: string }) => l.id));
    const missing = ledgerIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Unknown ledger(s) for this company: ${missing.join(', ')}`,
      );
    }

    // Strict balancing invariant.
    const debitTotal = linesNormalized
      .filter((l) => l.debitId)
      .reduce((acc, l) => acc + l.amount, 0);
    const creditTotal = linesNormalized
      .filter((l) => l.creditId)
      .reduce((acc, l) => acc + l.amount, 0);
    if (Number(debitTotal.toFixed(2)) !== Number(creditTotal.toFixed(2))) {
      throw new BadRequestException(
        `Journal not balanced: debit=${debitTotal.toFixed(
          2,
        )} credit=${creditTotal.toFixed(2)}`,
      );
    }

    const created = await this.prisma.$transaction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (tx: any) => {
        const journal = await tx.journal.create({
          data: {
            companyId,
            date,
            narration: dto.narration?.trim() || null,
          },
          select: { id: true, date: true, narration: true },
        });

        // Store one row per debit/credit posting.
        await tx.journalLine.createMany({
          data: linesNormalized.map((l) => ({
            companyId,
            journalId: journal.id,
            debitLedgerId: l.debitId,
            creditLedgerId: l.creditId,
            amount: l.amount,
          })),
        });

        return journal;
      },
    );

    return {
      id: created.id,
      date: created.date.toISOString().slice(0, 10),
      narration: created.narration ?? null,
    };
  }

  private assertValidDate(date: string, label: string) {
    const d = new Date(date);
    if (Number.isNaN(d.valueOf()))
      throw new BadRequestException(`${label} is invalid`);
    return d;
  }

  async trialBalance(
    companyId: string,
    asOf: string,
  ): Promise<TrialBalanceRow[]> {
    const asOfDate = this.assertValidDate(asOf, 'as_of');

    const ledgers = await this.prisma.ledger.findMany({
      where: { companyId },
      select: { id: true, accountName: true },
      orderBy: [{ accountName: 'asc' }],
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        companyId,
        journal: { date: { lte: asOfDate } },
      },
      select: {
        amount: true,
        debitLedgerId: true,
        creditLedgerId: true,
      },
    });

    const map = new Map<string, { debit: number; credit: number }>();
    for (const l of ledgers) map.set(l.id, { debit: 0, credit: 0 });

    for (const line of lines) {
      const amt = this.decimalToNumber(line.amount);
      if (line.debitLedgerId) {
        const agg = map.get(line.debitLedgerId);
        if (agg) agg.debit += amt;
      }
      if (line.creditLedgerId) {
        const agg = map.get(line.creditLedgerId);
        if (agg) agg.credit += amt;
      }
    }

    return ledgers.map((l: { id: string; accountName: string }) => {
      const agg = map.get(l.id) ?? { debit: 0, credit: 0 };
      return {
        ledger_id: l.id,
        ledger_name: l.accountName,
        debit: Number(agg.debit.toFixed(2)),
        credit: Number(agg.credit.toFixed(2)),
      };
    });
  }

  async profitLoss(companyId: string, from: string, to: string) {
    const fromDate = this.assertValidDate(from, 'from');
    const toDate = this.assertValidDate(to, 'to');

    const lines = await this.prisma.journalLine.findMany({
      where: {
        companyId,
        journal: { date: { gte: fromDate, lte: toDate } },
      },
      select: {
        amount: true,
        debitLedger: { select: { type: true } },
        creditLedger: { select: { type: true } },
      },
    });

    let income = 0;
    let expense = 0;

    for (const line of lines) {
      const amt = this.decimalToNumber(line.amount);
      // Taxonomy (minimal, but explicit):
      // income: credit increases income, debit reduces income (returns/discounts)
      // expense: debit increases expense, credit reduces expense (refund/reversal)
      const creditType = line.creditLedger?.type
        ? this.normalizeLedgerType(line.creditLedger.type)
        : null;
      const debitType = line.debitLedger?.type
        ? this.normalizeLedgerType(line.debitLedger.type)
        : null;

      const creditTop = creditType ? this.classifyTopLevel(creditType) : null;
      const debitTop = debitType ? this.classifyTopLevel(debitType) : null;

      if (creditTop === 'income') income += amt;
      if (debitTop === 'income') income -= amt;

      if (debitTop === 'expense') expense += amt;
      if (creditTop === 'expense') expense -= amt;
    }

    const profit = income - expense;
    return {
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    };
  }

  async balanceSheet(companyId: string, asOf: string) {
    // Minimal implementation: compute totals by ledger type, using trial-balance style sums.
    const rows = await this.trialBalance(companyId, asOf);
    const ledgerTypes = await this.prisma.ledger.findMany({
      where: { companyId },
      select: { id: true, type: true },
    });
    const typeById = new Map(
      ledgerTypes.map(
        (l: { id: string; type: string }) => [l.id, l.type] as const,
      ),
    );

    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    for (const r of rows) {
      const typeRaw = typeById.get(r.ledger_id);
      const type = typeRaw ? this.normalizeLedgerType(String(typeRaw)) : null;
      if (!type) continue;

      const top = this.classifyTopLevel(type);
      if (top === 'unknown') continue;

      const net = r.debit - r.credit;

      // Convention:
      // - assets normally have debit balance (net positive)
      // - liabilities/equity normally have credit balance (credit - debit)
      if (top === 'asset') assets += net;
      if (top === 'liability') liabilities += r.credit - r.debit;
      if (top === 'equity') equity += r.credit - r.debit;
      // Optional expansion for future taxonomy:
      // - current_asset/current_liability/fixed_asset etc.
    }

    return {
      assets: Number(assets.toFixed(2)),
      liabilities: Number(liabilities.toFixed(2)),
      equity: Number(equity.toFixed(2)),
    };
  }

  async cashBook(companyId: string, from: string, to: string) {
    // For now: summarize cash ledger postings as net amount per day (debit - credit)
    const fromDate = this.assertValidDate(from, 'from');
    const toDate = this.assertValidDate(to, 'to');

    const cashLedgers = await this.prisma.ledger.findMany({
      where: { companyId, type: 'cash' },
      select: { id: true },
    });
    const cashIds = cashLedgers.map((l: { id: string }) => l.id);
    if (cashIds.length === 0) return [];

    const journals = await this.prisma.journal.findMany({
      where: { companyId, date: { gte: fromDate, lte: toDate } },
      select: {
        date: true,
        narration: true,
        lines: {
          select: { amount: true, debitLedgerId: true, creditLedgerId: true },
        },
      },
      orderBy: [{ date: 'asc' }],
    });

    return journals
      .map(
        (j: {
          date: Date;
          narration: string | null;
          lines: Array<{
            amount: unknown;
            debitLedgerId: string | null;
            creditLedgerId: string | null;
          }>;
        }) => {
          let amt = 0;
          for (const l of j.lines) {
            const v = this.decimalToNumber(l.amount);
            if (l.debitLedgerId && cashIds.includes(l.debitLedgerId)) amt += v;
            if (l.creditLedgerId && cashIds.includes(l.creditLedgerId))
              amt -= v;
          }

          if (amt === 0) return null;
          return {
            date: j.date.toISOString().slice(0, 10),
            narration: j.narration ?? null,
            amount: Number(amt.toFixed(2)),
          };
        },
      )
      .filter((x: unknown): x is NonNullable<typeof x> => Boolean(x));
  }

  async bankBook(companyId: string, from: string, to: string) {
    const fromDate = this.assertValidDate(from, 'from');
    const toDate = this.assertValidDate(to, 'to');

    const bankLedgers = await this.prisma.ledger.findMany({
      where: { companyId, type: 'bank' },
      select: { id: true },
    });
    const bankIds = bankLedgers.map((l: { id: string }) => l.id);
    if (bankIds.length === 0) return [];

    const journals = await this.prisma.journal.findMany({
      where: { companyId, date: { gte: fromDate, lte: toDate } },
      select: {
        date: true,
        narration: true,
        lines: {
          select: { amount: true, debitLedgerId: true, creditLedgerId: true },
        },
      },
      orderBy: [{ date: 'asc' }],
    });

    return journals
      .map(
        (j: {
          date: Date;
          narration: string | null;
          lines: Array<{
            amount: unknown;
            debitLedgerId: string | null;
            creditLedgerId: string | null;
          }>;
        }) => {
          let amt = 0;
          for (const l of j.lines) {
            const v = this.decimalToNumber(l.amount);
            if (l.debitLedgerId && bankIds.includes(l.debitLedgerId)) amt += v;
            if (l.creditLedgerId && bankIds.includes(l.creditLedgerId))
              amt -= v;
          }

          if (amt === 0) return null;
          return {
            date: j.date.toISOString().slice(0, 10),
            narration: j.narration ?? null,
            amount: Number(amt.toFixed(2)),
          };
        },
      )
      .filter((x: unknown): x is NonNullable<typeof x> => Boolean(x));
  }
}
