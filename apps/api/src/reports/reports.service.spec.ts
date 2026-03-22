import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let svc: ReportsService;
  let prisma: {
    invoice: { findMany: jest.Mock; count: jest.Mock };
    purchase: { findMany: jest.Mock };
    invoiceItem: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const prismaMock = {
      invoice: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      purchase: {
        findMany: jest.fn(),
      },
      invoiceItem: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    svc = moduleRef.get(ReportsService);
    prisma = moduleRef.get(PrismaService) as any;
  });

  it('salesSummary returns the normalized summary contract', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'inv1',
        status: 'issued',
        issueDate: new Date('2026-03-01'),
        subTotal: { toString: () => '100.00' },
        taxTotal: { toString: () => '18.00' },
        total: { toString: () => '118.00' },
        amountPaid: { toString: () => '80.00' },
        balanceDue: { toString: () => '38.00' },
      },
      {
        id: 'inv2',
        status: 'paid',
        issueDate: new Date('2026-03-02'),
        subTotal: { toString: () => '200.00' },
        taxTotal: { toString: () => '36.00' },
        total: { toString: () => '236.00' },
        amountPaid: { toString: () => '236.00' },
        balanceDue: { toString: () => '0.00' },
      },
    ]);

    const result = await svc.salesSummary({ companyId: 'c1' });

    expect(result.data).toEqual({
      gross_sales: 354,
      net_sales: 300,
      tax_total: 54,
      invoices_count: 2,
      average_invoice: 177,
      amount_paid: 316,
      balance_due: 38,
      currency: 'INR',
    });
  });

  it('purchasesSummary returns the normalized summary contract', async () => {
    prisma.purchase.findMany.mockResolvedValue([
      {
        id: 'pur1',
        status: 'received',
        purchaseDate: new Date('2026-03-01'),
        subTotal: { toString: () => '120.00' },
        taxTotal: { toString: () => '21.60' },
        total: { toString: () => '141.60' },
      },
      {
        id: 'pur2',
        status: 'draft',
        purchaseDate: new Date('2026-03-02'),
        subTotal: { toString: () => '80.00' },
        taxTotal: { toString: () => '14.40' },
        total: { toString: () => '94.40' },
      },
    ]);

    const result = await svc.purchasesSummary({ companyId: 'c1' });

    expect(result.data).toEqual({
      gross_purchases: 236,
      net_purchases: 200,
      tax_total: 36,
      purchases_count: 2,
      average_purchase: 118,
      currency: 'INR',
    });
  });

  it('outstandingInvoices returns normalized rows and pagination meta', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'inv1',
        invoiceNumber: 'INV-001',
        customerId: 'cust1',
        issueDate: new Date('2026-03-01'),
        dueDate: new Date('2026-03-05'),
        total: { toString: () => '118.00' },
        amountPaid: { toString: () => '20.00' },
        balanceDue: { toString: () => '98.00' },
        status: 'issued',
        createdAt: new Date('2026-03-01'),
        customer: { name: 'Acme Retail' },
      },
    ]);
    prisma.invoice.count.mockResolvedValue(1);

    const result = await svc.outstandingInvoices({
      companyId: 'c1',
      page: 1,
      limit: 20,
    });

    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    expect(result.data[0]).toMatchObject({
      invoice_id: 'inv1',
      invoice_number: 'INV-001',
      customer_id: 'cust1',
      customer_name: 'Acme Retail',
      issue_date: '2026-03-01',
      due_date: '2026-03-05',
      total: 118,
      amount_paid: 20,
      amount_due: 98,
      status: 'issued',
    });
  });

  it('topProducts aggregates rows and sorts by requested metric', async () => {
    prisma.invoiceItem.findMany.mockResolvedValue([
      {
        productId: 'p1',
        quantity: { toString: () => '2.00' },
        lineTotal: { toString: () => '200.00' },
        product: { name: 'Widget', sku: 'W1', hsn: '1001' },
      },
      {
        productId: 'p1',
        quantity: { toString: () => '1.00' },
        lineTotal: { toString: () => '100.00' },
        product: { name: 'Widget', sku: 'W1', hsn: '1001' },
      },
      {
        productId: 'p2',
        quantity: { toString: () => '5.00' },
        lineTotal: { toString: () => '150.00' },
        product: { name: 'Tape', sku: 'T1', hsn: '1002' },
      },
    ]);

    const result = await svc.topProducts({
      companyId: 'c1',
      limit: 5,
      sortBy: 'quantity',
    });

    expect(result.meta).toEqual({ limit: 5, sort_by: 'quantity' });
    expect(result.data[0]).toEqual({
      product_id: 'p2',
      name: 'Tape',
      sku: 'T1',
      hsn: '1002',
      quantity: 5,
      amount: 150,
    });
    expect(result.data[1]).toEqual({
      product_id: 'p1',
      name: 'Widget',
      sku: 'W1',
      hsn: '1001',
      quantity: 3,
      amount: 300,
    });
  });

  it('profitSnapshot returns the normalized estimate contract', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      { total: { toString: () => '118.00' } },
      { total: { toString: () => '236.00' } },
    ]);
    prisma.purchase.findMany.mockResolvedValue([
      { total: { toString: () => '150.00' } },
    ]);

    const result = await svc.profitSnapshot({ companyId: 'c1' });

    expect(result.data).toEqual({
      revenue: 354,
      cogs: 150,
      gross_profit: 204,
      net_profit: 204,
      currency: 'INR',
      is_estimate: true,
      note: 'Profit uses purchase totals as a temporary COGS proxy until true inventory costing is introduced.',
    });
  });
});
