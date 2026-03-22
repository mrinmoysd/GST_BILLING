import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from './accounting.service';

describe('AccountingService', () => {
  let svc: AccountingService;
  let prisma: {
    company: { findUnique: jest.Mock; update: jest.Mock };
    ledger: {
      findMany: jest.Mock;
      createMany: jest.Mock;
      create: jest.Mock;
    };
    journal: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
    };
    journalLine: { findMany: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const prismaMock = {
      company: {
        findUnique: jest.fn().mockResolvedValue({ invoiceSettings: null }),
        update: jest.fn(),
      },
      ledger: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        create: jest.fn(),
      },
      journal: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      journalLine: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    svc = moduleRef.get(AccountingService);
    prisma = moduleRef.get(PrismaService) as any;
  });

  it('trialBalance aggregates debit and credit per ledger up to as_of', async () => {
    prisma.ledger.findMany.mockResolvedValue([
      { id: 'l1', accountName: 'Cash', type: 'cash' },
      { id: 'l2', accountName: 'Sales', type: 'sales' },
    ]);

    prisma.journalLine.findMany.mockResolvedValue([
      { amount: '100.00', debitLedgerId: 'l1', creditLedgerId: 'l2' },
      { amount: '50.00', debitLedgerId: 'l1', creditLedgerId: 'l2' },
    ]);

    const result = await svc.trialBalance('c1', '2026-01-31');
    expect(result).toEqual({
      as_of: '2026-01-31',
      rows: [
        {
          ledger_id: 'l1',
          ledger_name: 'Cash',
          ledger_type: 'cash',
          top_level: 'asset',
          debit: 150,
          credit: 0,
          net_balance: 150,
        },
        {
          ledger_id: 'l2',
          ledger_name: 'Sales',
          ledger_type: 'sales',
          top_level: 'income',
          debit: 0,
          credit: 150,
          net_balance: -150,
        },
      ],
      totals: { debit: 150, credit: 150, difference: 0 },
    });
  });

  it('trialBalance rejects invalid as_of date', async () => {
    await expect(svc.trialBalance('c1', 'bad-date')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('createJournal enforces balancing invariant', async () => {
    prisma.ledger.findMany.mockResolvedValue([
      { accountCode: '1000' },
      { accountCode: '4000' },
      { id: 'l1' },
      { id: 'l2' },
    ]);

    await expect(
      svc.createJournal('c1', {
        date: '2026-03-06',
        narration: 'test',
        lines: [
          { debit_ledger_id: 'l1', amount: '100.00' },
          { credit_ledger_id: 'l2', amount: '99.00' },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createJournal validates ledgers belong to the company', async () => {
    prisma.ledger.findMany
      .mockResolvedValueOnce([
        { accountCode: '1000' },
        { accountCode: '4000' },
      ])
      .mockResolvedValueOnce([{ id: 'l1' }]);

    await expect(
      svc.createJournal('c1', {
        date: '2026-03-06',
        lines: [
          { debit_ledger_id: 'l1', amount: '50.00' },
          { credit_ledger_id: 'missing', amount: '50.00' },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createJournal rejects posting inside a locked period', async () => {
    prisma.company.findUnique.mockResolvedValue({
      invoiceSettings: {
        accounting: {
          period_lock: {
            lock_until: '2026-03-31',
            reason: 'March books closed',
          },
        },
      },
    });
    prisma.ledger.findMany.mockResolvedValue([
      { accountCode: '1000' },
      { accountCode: '4000' },
      { id: 'l1' },
      { id: 'l2' },
    ]);

    await expect(
      svc.createJournal('c1', {
        date: '2026-03-15',
        lines: [
          { debit_ledger_id: 'l1', amount: '50.00' },
          { credit_ledger_id: 'l2', amount: '50.00' },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('postInvoiceIssued creates a source-linked system journal', async () => {
    prisma.company.findUnique.mockResolvedValue({ invoiceSettings: null });
    prisma.ledger.findMany.mockResolvedValue([
      { accountCode: '1000' },
      { accountCode: '1010' },
      { accountCode: '1100', id: 'ar' },
      { accountCode: '1200', id: 'inventory' },
      { accountCode: '1300' },
      { accountCode: '1310' },
      { accountCode: '1320' },
      { accountCode: '2000' },
      { accountCode: '2100', id: 'cgst_out' },
      { accountCode: '2110', id: 'sgst_out' },
      { accountCode: '2120', id: 'igst_out' },
      { accountCode: '3000' },
      { accountCode: '4000', id: 'sales' },
      { accountCode: '5000', id: 'cogs' },
    ]);
    prisma.journal.findFirst.mockResolvedValue(null);
    prisma.journal.create.mockResolvedValue({
      id: 'j1',
      date: new Date('2026-03-22'),
      narration: 'Invoice issued',
      sourceType: 'invoice_issue',
      sourceId: 'inv1',
      isSystemGenerated: true,
    });

    const tx = prisma as any;

    await svc.postInvoiceIssued(tx, {
      companyId: 'c1',
      invoice: {
        id: 'inv1',
        invoiceNumber: 'INV-1',
        issueDate: new Date('2026-03-22'),
        total: '118.00',
        subTotal: '100.00',
        items: [
          {
            quantity: '2',
            cgstAmount: '9.00',
            sgstAmount: '9.00',
            igstAmount: '0.00',
            product: { costPrice: '30.00' },
          },
        ],
      },
    });

    expect(prisma.journal.create).toHaveBeenCalled();
    expect(prisma.journalLine.createMany).toHaveBeenCalled();
  });

  it('profitLoss returns statement sections and summary totals', async () => {
    prisma.journalLine.findMany.mockResolvedValue([
      {
        amount: '500.00',
        debitLedgerId: 'cash',
        creditLedgerId: 'sales',
        debitLedger: { id: 'cash', type: 'cash', accountName: 'Cash' },
        creditLedger: { id: 'sales', type: 'sales', accountName: 'Sales' },
      },
      {
        amount: '180.00',
        debitLedgerId: 'rent',
        creditLedgerId: 'cash',
        debitLedger: { id: 'rent', type: 'rent', accountName: 'Rent' },
        creditLedger: { id: 'cash', type: 'cash', accountName: 'Cash' },
      },
    ]);

    const result = await svc.profitLoss('c1', '2026-03-01', '2026-03-31');

    expect(result).toEqual({
      period: { from: '2026-03-01', to: '2026-03-31' },
      summary: { income: 500, expense: 180, profit: 320 },
      income: [{ ledger_id: 'sales', ledger_name: 'Sales', amount: 500 }],
      expenses: [{ ledger_id: 'rent', ledger_name: 'Rent', amount: 180 }],
    });
  });

  it('balanceSheet returns statement sections and integrity summary', async () => {
    prisma.ledger.findMany.mockResolvedValue([
      { id: 'cash', accountName: 'Cash', type: 'cash' },
      { id: 'payable', accountName: 'Accounts Payable', type: 'accounts_payable' },
      { id: 'capital', accountName: 'Owner Capital', type: 'capital' },
    ]);
    prisma.journalLine.findMany.mockResolvedValue([
      { amount: '600.00', debitLedgerId: 'cash', creditLedgerId: 'capital' },
      { amount: '200.00', debitLedgerId: 'cash', creditLedgerId: 'payable' },
    ]);

    const result = await svc.balanceSheet('c1', '2026-03-31');

    expect(result).toEqual({
      as_of: '2026-03-31',
      summary: {
        assets: 800,
        liabilities: 200,
        equity: 600,
        liabilities_and_equity: 800,
        difference: 0,
      },
      assets: [{ ledger_id: 'cash', ledger_name: 'Cash', amount: 800 }],
      liabilities: [{ ledger_id: 'payable', ledger_name: 'Accounts Payable', amount: 200 }],
      equity: [{ ledger_id: 'capital', ledger_name: 'Owner Capital', amount: 600 }],
    });
  });
});
