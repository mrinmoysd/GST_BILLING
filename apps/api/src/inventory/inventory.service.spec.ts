import { UnprocessableEntityException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let svc: InventoryService;
  let prisma: {
    company: { findUnique: jest.Mock };
    product: { findFirst: jest.Mock; update: jest.Mock; findMany: jest.Mock };
    stockMovement: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const prismaMock: any = {
      company: { findUnique: jest.fn() },
      product: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      stockMovement: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    svc = moduleRef.get(InventoryService);
    prisma = moduleRef.get(PrismaService) as any;
  });

  it('blocks negative stock when company disallows it', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'c1',
      allowNegativeStock: false,
    });
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      companyId: 'c1',
      stock: new Decimal('1'),
      deletedAt: null,
    });

    await expect(
      svc.adjustStock({
        companyId: 'c1',
        productId: 'p1',
        delta: new Decimal('-2'),
        sourceType: 'invoice',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.product.update).not.toHaveBeenCalled();
    expect(prisma.stockMovement.create).not.toHaveBeenCalled();
  });

  it('updates stock and writes a stock movement in the same transaction', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'c1',
      allowNegativeStock: false,
    });
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      companyId: 'c1',
      stock: new Decimal('5'),
      deletedAt: null,
    });
    prisma.product.update.mockResolvedValue({
      id: 'p1',
      stock: new Decimal('3'),
    });

    const updated = await svc.adjustStock({
      companyId: 'c1',
      productId: 'p1',
      delta: new Decimal('-2'),
      sourceType: 'invoice',
      sourceId: 'inv1',
      note: 'invoice issue',
    });

    expect(updated).toEqual({ id: 'p1', stock: new Decimal('3') });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: new Decimal('3') },
    });
    expect(prisma.stockMovement.create).toHaveBeenCalledWith({
      data: {
        companyId: 'c1',
        productId: 'p1',
        changeQty: new Decimal('-2'),
        balanceQty: new Decimal('3'),
        sourceType: 'invoice',
        sourceId: 'inv1',
        note: 'invoice issue',
      },
    });
  });

  it('lowStock uses reorder level when present and threshold fallback otherwise', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        stock: new Decimal('2'),
        reorderLevel: new Decimal('3'),
      },
      {
        id: 'p2',
        stock: new Decimal('4'),
        reorderLevel: null,
      },
      {
        id: 'p3',
        stock: new Decimal('8'),
        reorderLevel: null,
      },
    ]);

    const result = await svc.lowStock({
      companyId: 'c1',
      threshold: 5,
      page: 1,
      limit: 10,
    });

    expect(result.meta.total).toBe(2);
    expect(result.data.map((row: any) => row.id)).toEqual(['p1', 'p2']);
  });
});
