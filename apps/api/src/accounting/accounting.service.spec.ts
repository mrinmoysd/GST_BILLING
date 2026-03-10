import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountingService } from './accounting.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AccountingService', () => {
  let svc: AccountingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: PrismaService,
          useValue: {
            ledger: { findMany: jest.fn() },
            journalLine: { findMany: jest.fn() },
            journal: { findMany: jest.fn(), count: jest.fn() },
            $transaction: jest.fn((queries) => Promise.all(queries)),
          },
        },
      ],
    }).compile();

    svc = moduleRef.get(AccountingService);
    prisma = moduleRef.get(PrismaService);
  });

  it('trialBalance aggregates debit and credit per ledger up to as_of', async () => {
    (prisma.ledger.findMany as jest.Mock).mockResolvedValue([
      { id: 'l1', accountName: 'Cash' },
      { id: 'l2', accountName: 'Sales' },
    ]);

    (prisma.journalLine.findMany as jest.Mock).mockResolvedValue([
      { amount: '100.00', debitLedgerId: 'l1', creditLedgerId: 'l2' },
      { amount: '50.00', debitLedgerId: 'l1', creditLedgerId: 'l2' },
    ]);

    const rows = await svc.trialBalance('c1', '2026-01-31');
    expect(rows).toEqual([
      { ledger_id: 'l1', ledger_name: 'Cash', debit: 150, credit: 0 },
      { ledger_id: 'l2', ledger_name: 'Sales', debit: 0, credit: 150 },
    ]);
  });

  it('trialBalance rejects invalid as_of date', async () => {
    await expect(svc.trialBalance('c1', 'bad-date')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('createJournal enforces balancing invariant', async () => {
    (prisma.ledger.findMany as jest.Mock).mockResolvedValue([
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
    (prisma.ledger.findMany as jest.Mock).mockResolvedValue([{ id: 'l1' }]);

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
});
