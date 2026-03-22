import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { CreateJournalDto } from './dto/create-journal.dto';

type TrialBalanceRow = {
  ledger_id: string;
  ledger_name: string;
  ledger_type?: string;
  debit: number;
  credit: number;
};

type LedgerSeed = {
  code: string;
  name: string;
  type: string;
};

type JournalPostingLine = {
  debitLedgerId?: string | null;
  creditLedgerId?: string | null;
  amount: unknown;
};

type SystemPostingLine = {
  side: 'debit' | 'credit';
  ledgerCode: string;
  amount: unknown;
};

const LEDGER_CODES = {
  cash: '1000',
  bank: '1010',
  accountsReceivable: '1100',
  inventory: '1200',
  gstInputCgst: '1300',
  gstInputSgst: '1310',
  gstInputIgst: '1320',
  accountsPayable: '2000',
  gstOutputCgst: '2100',
  gstOutputSgst: '2110',
  gstOutputIgst: '2120',
  ownerCapital: '3000',
  sales: '4000',
  cogs: '5000',
} as const;

const DEFAULT_LEDGERS: LedgerSeed[] = [
  { code: LEDGER_CODES.cash, name: 'Cash', type: 'cash' },
  { code: LEDGER_CODES.bank, name: 'Bank', type: 'bank' },
  {
    code: LEDGER_CODES.accountsReceivable,
    name: 'Accounts Receivable',
    type: 'accounts_receivable',
  },
  { code: LEDGER_CODES.inventory, name: 'Inventory', type: 'inventory' },
  {
    code: LEDGER_CODES.gstInputCgst,
    name: 'GST Input CGST',
    type: 'current_asset',
  },
  {
    code: LEDGER_CODES.gstInputSgst,
    name: 'GST Input SGST',
    type: 'current_asset',
  },
  {
    code: LEDGER_CODES.gstInputIgst,
    name: 'GST Input IGST',
    type: 'current_asset',
  },
  {
    code: LEDGER_CODES.accountsPayable,
    name: 'Accounts Payable',
    type: 'accounts_payable',
  },
  {
    code: LEDGER_CODES.gstOutputCgst,
    name: 'GST Output CGST',
    type: 'tax_payable',
  },
  {
    code: LEDGER_CODES.gstOutputSgst,
    name: 'GST Output SGST',
    type: 'tax_payable',
  },
  {
    code: LEDGER_CODES.gstOutputIgst,
    name: 'GST Output IGST',
    type: 'tax_payable',
  },
  { code: LEDGER_CODES.ownerCapital, name: 'Owner Capital', type: 'capital' },
  { code: LEDGER_CODES.sales, name: 'Sales', type: 'sales' },
  {
    code: LEDGER_CODES.cogs,
    name: 'Cost of Goods Sold',
    type: 'cost_of_goods_sold',
  },
];

type AccountingConfig = {
  period_lock?: {
    lock_until?: string | null;
    reason?: string | null;
  };
};

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRangeBoundary(input: string | undefined, fallback: Date): Date {
    const trimmed = String(input ?? '').trim();
    if (!trimmed) return fallback;
    return this.assertValidDate(trimmed, 'date');
  }

  private normalizeLedgerType(type: string): string {
    return String(type ?? '')
      .trim()
      .toLowerCase();
  }

  private decimal(value: unknown, fallback = '0'): Decimal {
    if (value === null || value === undefined) return new Decimal(fallback);
    return new Decimal(value as any);
  }

  private decimalToNumber(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
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
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`${label} must be finite`);
    }
    if (n <= 0) throw new BadRequestException(`${label} must be > 0`);
    return n;
  }

  private assertValidDate(date: string, label: string) {
    const d = new Date(date);
    if (Number.isNaN(d.valueOf())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return d;
  }

  private classifyTopLevel(
    type: string,
  ): 'asset' | 'liability' | 'equity' | 'income' | 'expense' | 'unknown' {
    const t = this.normalizeLedgerType(type);

    if (t === 'asset') return 'asset';
    if (t === 'liability') return 'liability';
    if (t === 'equity') return 'equity';
    if (t === 'income') return 'income';
    if (t === 'expense') return 'expense';

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

    if (
      ['owner_equity', 'retained_earnings', 'capital', 'drawings'].includes(t)
    ) {
      return 'equity';
    }

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

  private async getTrialBalanceRows(companyId: string, asOfDate: Date): Promise<TrialBalanceRow[]> {
    await this.ensureDefaultLedgers(companyId);

    const ledgers = await this.prisma.ledger.findMany({
      where: { companyId },
      select: { id: true, accountName: true, type: true },
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

    return ledgers.map((l) => {
      const agg = map.get(l.id) ?? { debit: 0, credit: 0 };
      return {
        ledger_id: l.id,
        ledger_name: l.accountName,
        ledger_type: l.type,
        debit: Number(agg.debit.toFixed(2)),
        credit: Number(agg.credit.toFixed(2)),
      };
    });
  }

  private getAccountingConfig(invoiceSettings: unknown): AccountingConfig {
    if (!invoiceSettings || typeof invoiceSettings !== 'object') {
      return {};
    }
    const row = invoiceSettings as Record<string, unknown>;
    const accounting =
      row.accounting && typeof row.accounting === 'object'
        ? (row.accounting as Record<string, unknown>)
        : {};
    const periodLock =
      accounting.period_lock && typeof accounting.period_lock === 'object'
        ? (accounting.period_lock as Record<string, unknown>)
        : {};

    return {
      period_lock: {
        lock_until:
          typeof periodLock.lock_until === 'string' ? periodLock.lock_until : null,
        reason: typeof periodLock.reason === 'string' ? periodLock.reason : null,
      },
    };
  }

  private async assertPeriodOpen(
    companyId: string,
    date: Date,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: { invoiceSettings: true },
    });
    if (!company) {
      throw new BadRequestException('Company not found');
    }

    const cfg = this.getAccountingConfig(company.invoiceSettings);
    const lockUntil = cfg.period_lock?.lock_until?.trim();
    if (!lockUntil) return;

    const lockDate = new Date(lockUntil);
    if (Number.isNaN(lockDate.valueOf())) return;

    if (date <= lockDate) {
      throw new BadRequestException(
        `Accounting period locked through ${lockUntil}${
          cfg.period_lock?.reason ? ` (${cfg.period_lock.reason})` : ''
        }`,
      );
    }
  }

  async getPeriodLock(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { invoiceSettings: true },
    });
    if (!company) throw new BadRequestException('Company not found');

    const cfg = this.getAccountingConfig(company.invoiceSettings);
    return {
      lock_until: cfg.period_lock?.lock_until ?? null,
      reason: cfg.period_lock?.reason ?? null,
    };
  }

  async updatePeriodLock(
    companyId: string,
    input: { lock_until?: string | null; reason?: string | null },
  ) {
    if (input.lock_until) {
      this.assertValidDate(input.lock_until, 'lock_until');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { invoiceSettings: true },
    });
    if (!company) throw new BadRequestException('Company not found');

    const base =
      company.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? ({ ...(company.invoiceSettings as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    const accounting =
      base.accounting && typeof base.accounting === 'object'
        ? ({ ...(base.accounting as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    accounting.period_lock = {
      lock_until: input.lock_until?.trim() || null,
      reason: input.reason?.trim() || null,
    };
    base.accounting = accounting;

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        invoiceSettings: base as Prisma.InputJsonValue,
      },
    });

    return {
      lock_until: input.lock_until?.trim() || null,
      reason: input.reason?.trim() || null,
    };
  }

  async ensureDefaultLedgers(
    companyId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const existing = await tx.ledger.findMany({
      where: { companyId, accountCode: { in: DEFAULT_LEDGERS.map((l) => l.code) } },
      select: { accountCode: true },
    });
    const found = new Set(existing.map((l) => l.accountCode));
    const missing = DEFAULT_LEDGERS.filter((l) => !found.has(l.code));
    if (!missing.length) return;

    await tx.ledger.createMany({
      data: missing.map((l) => ({
        companyId,
        accountCode: l.code,
        accountName: l.name,
        type: l.type,
      })),
      skipDuplicates: true,
    });
  }

  private async getLedgerMap(
    companyId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await this.ensureDefaultLedgers(companyId, tx);
    const ledgers = await tx.ledger.findMany({
      where: { companyId },
      select: { id: true, accountCode: true, accountName: true, type: true },
    });
    return new Map(
      ledgers.map((l) => [
        l.accountCode,
        {
          id: l.id,
          accountCode: l.accountCode,
          accountName: l.accountName,
          type: l.type,
        },
      ]),
    );
  }

  private async createJournalRecord(args: {
    companyId: string;
    date: Date;
    narration?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
    isSystemGenerated?: boolean;
    lines: JournalPostingLine[];
    tx?: Prisma.TransactionClient;
  }) {
    const tx = args.tx ?? this.prisma;
    await this.assertPeriodOpen(args.companyId, args.date, tx);

    const linesNormalized = args.lines
      .map((line, idx) => {
        const debitId = line.debitLedgerId ?? null;
        const creditId = line.creditLedgerId ?? null;
        if ((debitId && creditId) || (!debitId && !creditId)) {
          throw new BadRequestException(
            `lines[${idx}] must have exactly one of debitLedgerId or creditLedgerId`,
          );
        }
        const amount = this.decimal(line.amount);
        if (amount.lte(0)) {
          throw new BadRequestException(`lines[${idx}].amount must be > 0`);
        }
        return {
          debitLedgerId: debitId,
          creditLedgerId: creditId,
          amount,
        };
      })
      .filter((line) => line.amount.gt(0));

    const debitTotal = linesNormalized
      .filter((l) => l.debitLedgerId)
      .reduce((acc, l) => acc.add(l.amount), new Decimal(0));
    const creditTotal = linesNormalized
      .filter((l) => l.creditLedgerId)
      .reduce((acc, l) => acc.add(l.amount), new Decimal(0));

    if (!debitTotal.eq(creditTotal)) {
      throw new BadRequestException(
        `Journal not balanced: debit=${debitTotal.toFixed(
          2,
        )} credit=${creditTotal.toFixed(2)}`,
      );
    }

    if (args.sourceType && args.sourceId) {
      const existing: any = await tx.journal.findFirst({
        where: {
          companyId: args.companyId,
          sourceType: args.sourceType,
          sourceId: args.sourceId,
        } as any,
        select: { id: true, date: true, narration: true } as any,
      });
      if (existing) {
        return existing;
      }
    }

    const journal: any = await tx.journal.create({
      data: {
        companyId: args.companyId,
        date: args.date,
        narration: args.narration?.trim() || null,
        sourceType: args.sourceType ?? null,
        sourceId: args.sourceId ?? null,
        isSystemGenerated: Boolean(args.isSystemGenerated),
      } as any,
      select: {
        id: true,
        date: true,
        narration: true,
        sourceType: true,
        sourceId: true,
        isSystemGenerated: true,
      } as any,
    });

    await tx.journalLine.createMany({
      data: linesNormalized.map((line) => ({
        companyId: args.companyId,
        journalId: journal.id,
        debitLedgerId: line.debitLedgerId,
        creditLedgerId: line.creditLedgerId,
        amount: line.amount,
      })),
    });

    return journal;
  }

  private async createSystemJournal(args: {
    companyId: string;
    date: Date;
    narration: string;
    sourceType: string;
    sourceId: string;
    lines: SystemPostingLine[];
    tx: Prisma.TransactionClient;
  }) {
    const ledgerMap = await this.getLedgerMap(args.companyId, args.tx);
    const postings: JournalPostingLine[] = args.lines
      .map((line) => {
        const ledger = ledgerMap.get(line.ledgerCode);
        if (!ledger) {
          throw new BadRequestException(
            `Required default ledger missing: ${line.ledgerCode}`,
          );
        }
        return line.side === 'debit'
          ? { debitLedgerId: ledger.id, amount: line.amount }
          : { creditLedgerId: ledger.id, amount: line.amount };
      })
      .filter((line) => this.decimal(line.amount).gt(0));

    return this.createJournalRecord({
      companyId: args.companyId,
      date: args.date,
      narration: args.narration,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      isSystemGenerated: true,
      lines: postings,
      tx: args.tx,
    });
  }

  private methodLedgerCode(method?: string | null) {
    return String(method ?? '').trim().toLowerCase() === 'cash'
      ? LEDGER_CODES.cash
      : LEDGER_CODES.bank;
  }

  private getGstTotals(
    items: Array<{
      cgstAmount?: unknown;
      sgstAmount?: unknown;
      igstAmount?: unknown;
    }>,
  ) {
    return items.reduce(
      (acc, item) => ({
        cgst: acc.cgst.add(this.decimal(item.cgstAmount)),
        sgst: acc.sgst.add(this.decimal(item.sgstAmount)),
        igst: acc.igst.add(this.decimal(item.igstAmount)),
      }),
      {
        cgst: new Decimal(0),
        sgst: new Decimal(0),
        igst: new Decimal(0),
      },
    );
  }

  private getInventoryValue(
    items: Array<{ quantity?: unknown; product?: { costPrice?: unknown } | null }>,
  ) {
    return items.reduce((acc, item) => {
      const qty = this.decimal(item.quantity);
      const unitValue = this.decimal(item.product?.costPrice);
      return acc.add(qty.mul(unitValue));
    }, new Decimal(0));
  }

  async postInvoiceIssued(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      invoice: {
        id: string;
        invoiceNumber?: string | null;
        issueDate?: Date | null;
        total: unknown;
        subTotal: unknown;
        items: Array<{
          quantity: unknown;
          cgstAmount?: unknown;
          sgstAmount?: unknown;
          igstAmount?: unknown;
          product?: { costPrice?: unknown } | null;
        }>;
      };
    },
  ) {
    const gst = this.getGstTotals(args.invoice.items);
    const inventoryValue = this.getInventoryValue(args.invoice.items);
    const lines: SystemPostingLine[] = [
      {
        side: 'debit',
        ledgerCode: LEDGER_CODES.accountsReceivable,
        amount: args.invoice.total,
      },
      {
        side: 'credit',
        ledgerCode: LEDGER_CODES.sales,
        amount: args.invoice.subTotal,
      },
      {
        side: 'credit',
        ledgerCode: LEDGER_CODES.gstOutputCgst,
        amount: gst.cgst,
      },
      {
        side: 'credit',
        ledgerCode: LEDGER_CODES.gstOutputSgst,
        amount: gst.sgst,
      },
      {
        side: 'credit',
        ledgerCode: LEDGER_CODES.gstOutputIgst,
        amount: gst.igst,
      },
      {
        side: 'debit',
        ledgerCode: LEDGER_CODES.cogs,
        amount: inventoryValue,
      },
      {
        side: 'credit',
        ledgerCode: LEDGER_CODES.inventory,
        amount: inventoryValue,
      },
    ];

    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.invoice.issueDate ?? new Date(),
      narration: `Invoice issued ${args.invoice.invoiceNumber ?? args.invoice.id}`,
      sourceType: 'invoice_issue',
      sourceId: args.invoice.id,
      lines,
    });
  }

  async postInvoiceCancelled(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      invoice: {
        id: string;
        invoiceNumber?: string | null;
        cancelledAt?: Date | null;
        total: unknown;
        subTotal: unknown;
        items: Array<{
          quantity: unknown;
          cgstAmount?: unknown;
          sgstAmount?: unknown;
          igstAmount?: unknown;
          product?: { costPrice?: unknown } | null;
        }>;
      };
    },
  ) {
    const gst = this.getGstTotals(args.invoice.items);
    const inventoryValue = this.getInventoryValue(args.invoice.items);

    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.invoice.cancelledAt ?? new Date(),
      narration: `Invoice cancelled ${args.invoice.invoiceNumber ?? args.invoice.id}`,
      sourceType: 'invoice_cancel',
      sourceId: args.invoice.id,
      lines: [
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.sales,
          amount: args.invoice.subTotal,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.gstOutputCgst,
          amount: gst.cgst,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.gstOutputSgst,
          amount: gst.sgst,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.gstOutputIgst,
          amount: gst.igst,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.accountsReceivable,
          amount: args.invoice.total,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.inventory,
          amount: inventoryValue,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.cogs,
          amount: inventoryValue,
        },
      ],
    });
  }

  async postInvoicePayment(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      payment: {
        id: string;
        amount: unknown;
        method?: string | null;
        paymentDate?: Date | null;
      };
      invoice: { id: string; invoiceNumber?: string | null };
    },
  ) {
    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.payment.paymentDate ?? new Date(),
      narration: `Payment received for invoice ${args.invoice.invoiceNumber ?? args.invoice.id}`,
      sourceType: 'invoice_payment',
      sourceId: args.payment.id,
      lines: [
        {
          side: 'debit',
          ledgerCode: this.methodLedgerCode(args.payment.method),
          amount: args.payment.amount,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.accountsReceivable,
          amount: args.payment.amount,
        },
      ],
    });
  }

  async postCreditNote(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      invoice: { id: string; invoiceNumber?: string | null };
      creditNote: {
        id: string;
        noteNumber: string;
        noteDate: Date;
        total: unknown;
        subTotal: unknown;
        restock: boolean;
        items: Array<{
          quantity?: unknown;
          cgstAmount?: unknown;
          sgstAmount?: unknown;
          igstAmount?: unknown;
          product?: { costPrice?: unknown } | null;
        }>;
      };
    },
  ) {
    const gst = this.getGstTotals(args.creditNote.items);
    const inventoryValue = this.getInventoryValue(args.creditNote.items);
    const lines: SystemPostingLine[] = [
      {
        side: 'debit',
        ledgerCode: LEDGER_CODES.sales,
        amount: args.creditNote.subTotal,
      },
      {
        side: 'debit',
        ledgerCode: LEDGER_CODES.gstOutputCgst,
        amount: gst.cgst,
      },
      {
        side: 'debit',
        ledgerCode: LEDGER_CODES.gstOutputSgst,
        amount: gst.sgst,
      },
      {
        side: 'debit',
        ledgerCode: LEDGER_CODES.gstOutputIgst,
        amount: gst.igst,
      },
      {
        side: 'credit',
        ledgerCode: LEDGER_CODES.accountsReceivable,
        amount: args.creditNote.total,
      },
    ];

    if (args.creditNote.restock) {
      lines.push(
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.inventory,
          amount: inventoryValue,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.cogs,
          amount: inventoryValue,
        },
      );
    }

    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.creditNote.noteDate,
      narration: `Credit note ${args.creditNote.noteNumber} for invoice ${args.invoice.invoiceNumber ?? args.invoice.id}`,
      sourceType: 'credit_note',
      sourceId: args.creditNote.id,
      lines,
    });
  }

  async postPurchaseReceived(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      purchase: {
        id: string;
        purchaseDate?: Date | null;
        total: unknown;
        subTotal: unknown;
        items: Array<{
          cgstAmount?: unknown;
          sgstAmount?: unknown;
          igstAmount?: unknown;
        }>;
      };
    },
  ) {
    const gst = this.getGstTotals(args.purchase.items);
    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.purchase.purchaseDate ?? new Date(),
      narration: `Purchase received ${args.purchase.id}`,
      sourceType: 'purchase_receive',
      sourceId: args.purchase.id,
      lines: [
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.inventory,
          amount: args.purchase.subTotal,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.gstInputCgst,
          amount: gst.cgst,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.gstInputSgst,
          amount: gst.sgst,
        },
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.gstInputIgst,
          amount: gst.igst,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.accountsPayable,
          amount: args.purchase.total,
        },
      ],
    });
  }

  async postPurchaseCancelled(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      purchase: {
        id: string;
        cancelledAt?: Date | null;
        total: unknown;
        subTotal: unknown;
        items: Array<{
          cgstAmount?: unknown;
          sgstAmount?: unknown;
          igstAmount?: unknown;
        }>;
      };
    },
  ) {
    const gst = this.getGstTotals(args.purchase.items);
    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.purchase.cancelledAt ?? new Date(),
      narration: `Purchase cancelled ${args.purchase.id}`,
      sourceType: 'purchase_cancel',
      sourceId: args.purchase.id,
      lines: [
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.accountsPayable,
          amount: args.purchase.total,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.inventory,
          amount: args.purchase.subTotal,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.gstInputCgst,
          amount: gst.cgst,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.gstInputSgst,
          amount: gst.sgst,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.gstInputIgst,
          amount: gst.igst,
        },
      ],
    });
  }

  async postPurchasePayment(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      payment: {
        id: string;
        amount: unknown;
        method?: string | null;
        paymentDate?: Date | null;
      };
      purchase: { id: string };
    },
  ) {
    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.payment.paymentDate ?? new Date(),
      narration: `Payment made for purchase ${args.purchase.id}`,
      sourceType: 'purchase_payment',
      sourceId: args.payment.id,
      lines: [
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.accountsPayable,
          amount: args.payment.amount,
        },
        {
          side: 'credit',
          ledgerCode: this.methodLedgerCode(args.payment.method),
          amount: args.payment.amount,
        },
      ],
    });
  }

  async postPurchaseReturn(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      purchase: { id: string };
      purchaseReturn: {
        id: string;
        returnNumber: string;
        returnDate: Date;
        total: unknown;
        subTotal: unknown;
        items: Array<{
          cgstAmount?: unknown;
          sgstAmount?: unknown;
          igstAmount?: unknown;
        }>;
      };
    },
  ) {
    const gst = this.getGstTotals(args.purchaseReturn.items);
    await this.createSystemJournal({
      tx,
      companyId: args.companyId,
      date: args.purchaseReturn.returnDate,
      narration: `Purchase return ${args.purchaseReturn.returnNumber} for purchase ${args.purchase.id}`,
      sourceType: 'purchase_return',
      sourceId: args.purchaseReturn.id,
      lines: [
        {
          side: 'debit',
          ledgerCode: LEDGER_CODES.accountsPayable,
          amount: args.purchaseReturn.total,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.inventory,
          amount: args.purchaseReturn.subTotal,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.gstInputCgst,
          amount: gst.cgst,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.gstInputSgst,
          amount: gst.sgst,
        },
        {
          side: 'credit',
          ledgerCode: LEDGER_CODES.gstInputIgst,
          amount: gst.igst,
        },
      ],
    });
  }

  async listLedgers(companyId: string) {
    await this.ensureDefaultLedgers(companyId);
    const ledgers = await this.prisma.ledger.findMany({
      where: { companyId },
      orderBy: [{ accountCode: 'asc' }],
    });

    return ledgers.map((l) => ({
      id: l.id,
      account_code: l.accountCode,
      account_name: l.accountName,
      type: l.type,
      balance: 0,
    }));
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

    const txResult = (await this.prisma.$transaction([
      this.prisma.journal.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          date: true,
          narration: true,
          sourceType: true,
          sourceId: true,
          isSystemGenerated: true,
        } as any,
      }),
      this.prisma.journal.count({ where }),
    ])) as unknown as [
      Array<{
        id: string;
        date: Date;
        narration: string | null;
        sourceType?: string | null;
        sourceId?: string | null;
        isSystemGenerated?: boolean;
      }>,
      number,
    ];
    const [items, total] = txResult;

    return {
      data: items.map((j) => ({
        id: j.id,
        date: j.date.toISOString().slice(0, 10),
        narration: j.narration ?? null,
        source_type: j.sourceType ?? null,
        source_id: j.sourceId ?? null,
        is_system_generated: j.isSystemGenerated,
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getJournal(companyId: string, journalId: string) {
    const journal: any = await this.prisma.journal.findFirst({
      where: { companyId, id: journalId },
      select: {
        id: true,
        date: true,
        narration: true,
        sourceType: true,
        sourceId: true,
        isSystemGenerated: true,
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
      } as any,
    });

    if (!journal) return null;

    return {
      id: journal.id,
      date: journal.date.toISOString().slice(0, 10),
      narration: journal.narration ?? null,
      source_type: journal.sourceType ?? null,
      source_id: journal.sourceId ?? null,
      is_system_generated: journal.isSystemGenerated,
      lines: journal.lines.map((l: any) => ({
        id: l.id,
        amount: Number(this.decimalToNumber(l.amount).toFixed(2)),
        debit_ledger_id: l.debitLedgerId,
        credit_ledger_id: l.creditLedgerId,
        debit_ledger_name: l.debitLedger?.accountName ?? null,
        credit_ledger_name: l.creditLedger?.accountName ?? null,
      })),
    };
  }

  async createJournal(companyId: string, dto: CreateJournalDto) {
    const date = this.assertValidDate(dto.date, 'date');

    if (!Array.isArray(dto.lines) || dto.lines.length === 0) {
      throw new BadRequestException('lines must be a non-empty array');
    }

    await this.ensureDefaultLedgers(companyId);

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
        debitLedgerId: debitId ?? null,
        creditLedgerId: creditId ?? null,
        amount: amt,
      };
    });

    const ledgerIds = Array.from(new Set([...debitIds, ...creditIds]));
    const ledgers = await this.prisma.ledger.findMany({
      where: { companyId, id: { in: ledgerIds } },
      select: { id: true },
    });
    const found = new Set(ledgers.map((l) => l.id));
    const missing = ledgerIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Unknown ledger(s) for this company: ${missing.join(', ')}`,
      );
    }

    const created = await this.createJournalRecord({
      companyId,
      date,
      narration: dto.narration?.trim() || null,
      isSystemGenerated: false,
      lines: linesNormalized,
    });

    return {
      id: created.id,
      date: created.date.toISOString().slice(0, 10),
      narration: created.narration ?? null,
      source_type: created.sourceType ?? null,
      source_id: created.sourceId ?? null,
      is_system_generated: created.isSystemGenerated,
    };
  }

  async trialBalance(
    companyId: string,
    asOf: string,
  ) {
    const asOfDate = this.normalizeRangeBoundary(asOf, new Date());
    const rows = await this.getTrialBalanceRows(companyId, asOfDate);

    const totals = rows.reduce(
      (acc, row) => {
        acc.debit += row.debit;
        acc.credit += row.credit;
        return acc;
      },
      { debit: 0, credit: 0 },
    );

    const normalizedRows = rows.map((row) => ({
      ...row,
      top_level: row.ledger_type
        ? this.classifyTopLevel(String(row.ledger_type))
        : 'unknown',
      net_balance: Number((row.debit - row.credit).toFixed(2)),
    }));

    return {
      as_of: asOfDate.toISOString().slice(0, 10),
      rows: normalizedRows,
      totals: {
        debit: Number(totals.debit.toFixed(2)),
        credit: Number(totals.credit.toFixed(2)),
        difference: Number((totals.debit - totals.credit).toFixed(2)),
      },
    };
  }

  async profitLoss(companyId: string, from: string, to: string) {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromDate = this.normalizeRangeBoundary(from, defaultFrom);
    const toDate = this.normalizeRangeBoundary(to, today);

    const lines = await this.prisma.journalLine.findMany({
      where: {
        companyId,
        journal: { date: { gte: fromDate, lte: toDate } },
      },
      select: {
        amount: true,
        debitLedgerId: true,
        creditLedgerId: true,
        debitLedger: { select: { id: true, type: true, accountName: true } },
        creditLedger: { select: { id: true, type: true, accountName: true } },
      },
    });

    let income = 0;
    let expense = 0;
    const incomeMap = new Map<string, { ledger_id: string; ledger_name: string; amount: number }>();
    const expenseMap = new Map<string, { ledger_id: string; ledger_name: string; amount: number }>();

    for (const line of lines) {
      const amt = this.decimalToNumber(line.amount);
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

      if (creditTop === 'income' && line.creditLedger) {
        const current = incomeMap.get(line.creditLedger.id) ?? {
          ledger_id: line.creditLedger.id,
          ledger_name: line.creditLedger.accountName,
          amount: 0,
        };
        current.amount += amt;
        incomeMap.set(line.creditLedger.id, current);
      }
      if (debitTop === 'income' && line.debitLedger) {
        const current = incomeMap.get(line.debitLedger.id) ?? {
          ledger_id: line.debitLedger.id,
          ledger_name: line.debitLedger.accountName,
          amount: 0,
        };
        current.amount -= amt;
        incomeMap.set(line.debitLedger.id, current);
      }

      if (debitTop === 'expense' && line.debitLedger) {
        const current = expenseMap.get(line.debitLedger.id) ?? {
          ledger_id: line.debitLedger.id,
          ledger_name: line.debitLedger.accountName,
          amount: 0,
        };
        current.amount += amt;
        expenseMap.set(line.debitLedger.id, current);
      }
      if (creditTop === 'expense' && line.creditLedger) {
        const current = expenseMap.get(line.creditLedger.id) ?? {
          ledger_id: line.creditLedger.id,
          ledger_name: line.creditLedger.accountName,
          amount: 0,
        };
        current.amount -= amt;
        expenseMap.set(line.creditLedger.id, current);
      }
    }

    const profit = income - expense;
    return {
      period: {
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
      },
      summary: {
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        profit: Number(profit.toFixed(2)),
      },
      income: Array.from(incomeMap.values())
        .filter((row) => Math.abs(row.amount) > 0.0001)
        .map((row) => ({ ...row, amount: Number(row.amount.toFixed(2)) }))
        .sort((a, b) => b.amount - a.amount),
      expenses: Array.from(expenseMap.values())
        .filter((row) => Math.abs(row.amount) > 0.0001)
        .map((row) => ({ ...row, amount: Number(row.amount.toFixed(2)) }))
        .sort((a, b) => b.amount - a.amount),
    };
  }

  async balanceSheet(companyId: string, asOf: string) {
    const asOfDate = this.normalizeRangeBoundary(asOf, new Date());
    const rows = await this.getTrialBalanceRows(companyId, asOfDate);

    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    const assetRows: Array<{ ledger_id: string; ledger_name: string; amount: number }> = [];
    const liabilityRows: Array<{ ledger_id: string; ledger_name: string; amount: number }> = [];
    const equityRows: Array<{ ledger_id: string; ledger_name: string; amount: number }> = [];

    for (const r of rows) {
      const type = r.ledger_type
        ? this.normalizeLedgerType(String(r.ledger_type))
        : null;
      if (!type) continue;

      const top = this.classifyTopLevel(type);
      if (top === 'unknown') continue;

      const net = r.debit - r.credit;
      if (top === 'asset') {
        assets += net;
        assetRows.push({
          ledger_id: r.ledger_id,
          ledger_name: r.ledger_name,
          amount: Number(net.toFixed(2)),
        });
      }
      if (top === 'liability') {
        const amount = r.credit - r.debit;
        liabilities += amount;
        liabilityRows.push({
          ledger_id: r.ledger_id,
          ledger_name: r.ledger_name,
          amount: Number(amount.toFixed(2)),
        });
      }
      if (top === 'equity') {
        const amount = r.credit - r.debit;
        equity += amount;
        equityRows.push({
          ledger_id: r.ledger_id,
          ledger_name: r.ledger_name,
          amount: Number(amount.toFixed(2)),
        });
      }
    }

    return {
      as_of: asOfDate.toISOString().slice(0, 10),
      summary: {
        assets: Number(assets.toFixed(2)),
        liabilities: Number(liabilities.toFixed(2)),
        equity: Number(equity.toFixed(2)),
        liabilities_and_equity: Number((liabilities + equity).toFixed(2)),
        difference: Number((assets - (liabilities + equity)).toFixed(2)),
      },
      assets: assetRows.filter((row) => Math.abs(row.amount) > 0.0001),
      liabilities: liabilityRows.filter((row) => Math.abs(row.amount) > 0.0001),
      equity: equityRows.filter((row) => Math.abs(row.amount) > 0.0001),
    };
  }

  async cashBook(companyId: string, from: string, to: string) {
    const fromDate = this.assertValidDate(from, 'from');
    const toDate = this.assertValidDate(to, 'to');
    await this.ensureDefaultLedgers(companyId);

    const cashLedgers = await this.prisma.ledger.findMany({
      where: { companyId, type: 'cash' },
      select: { id: true },
    });
    const cashIds = cashLedgers.map((l) => l.id);
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
      .map((j) => {
        let amt = 0;
        for (const l of j.lines) {
          const v = this.decimalToNumber(l.amount);
          if (l.debitLedgerId && cashIds.includes(l.debitLedgerId)) amt += v;
          if (l.creditLedgerId && cashIds.includes(l.creditLedgerId)) amt -= v;
        }

        if (amt === 0) return null;
        return {
          date: j.date.toISOString().slice(0, 10),
          narration: j.narration ?? null,
          amount: Number(amt.toFixed(2)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }

  async bankBook(companyId: string, from: string, to: string) {
    const fromDate = this.assertValidDate(from, 'from');
    const toDate = this.assertValidDate(to, 'to');
    await this.ensureDefaultLedgers(companyId);

    const bankLedgers = await this.prisma.ledger.findMany({
      where: { companyId, type: 'bank' },
      select: { id: true },
    });
    const bankIds = bankLedgers.map((l) => l.id);
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
      .map((j) => {
        let amt = 0;
        for (const l of j.lines) {
          const v = this.decimalToNumber(l.amount);
          if (l.debitLedgerId && bankIds.includes(l.debitLedgerId)) amt += v;
          if (l.creditLedgerId && bankIds.includes(l.creditLedgerId)) amt -= v;
        }

        if (amt === 0) return null;
        return {
          date: j.date.toISOString().slice(0, 10),
          narration: j.narration ?? null,
          amount: Number(amt.toFixed(2)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }
}
