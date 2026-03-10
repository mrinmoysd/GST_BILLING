import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';

export type StockSourceType =
  | 'manual'
  | 'invoice'
  | 'invoice_cancel'
  | 'purchase'
  | 'purchase_return'
  | 'credit_note'
  | 'opening'
  | 'correction';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Contract:
   * - Always updates Product.stock and writes StockMovement in the SAME transaction.
   * - Enforces Company.allowNegativeStock unless overrideAllowNegative is true.
   */
  async adjustStock(args: {
    companyId: string;
    productId: string;
    delta: Decimal;
    sourceType: StockSourceType;
    sourceId?: string;
    note?: string;
    overrideAllowNegative?: boolean;
  }) {
    const {
      companyId,
      productId,
      delta,
      sourceType,
      sourceId,
      note,
      overrideAllowNegative,
    } = args;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const company = await tx.company.findUnique({ where: { id: companyId } });
      if (!company) throw new UnprocessableEntityException('Company not found');

      const product = await tx.product.findFirst({
        where: { id: productId, companyId, deletedAt: null },
      });
      if (!product) throw new UnprocessableEntityException('Product not found');

      const next = new Decimal(product.stock).add(delta);

      if (
        !overrideAllowNegative &&
        !company.allowNegativeStock &&
        next.isNegative()
      ) {
        throw new UnprocessableEntityException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Negative stock is not allowed for this company',
          details: {
            productId,
            current: product.stock.toString(),
            delta: delta.toString(),
          },
        });
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: next },
      });

      await tx.stockMovement.create({
        data: {
          companyId,
          productId,
          changeQty: delta,
          balanceQty: next,
          sourceType,
          sourceId: sourceId ?? null,
          note: note ?? null,
        },
      });

      return updated;
    });
  }

  async listMovements(args: {
    companyId: string;
    productId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const { companyId, productId, from, to, page, limit } = args;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (productId) where.productId = productId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [total, data] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async lowStock(args: {
    companyId: string;
    threshold?: number;
    page: number;
    limit: number;
  }) {
    const { companyId, threshold, page, limit } = args;
    const skip = (page - 1) * limit;

    // If Product.reorderLevel is set, use it; otherwise fall back to threshold.
    // If neither exists, treat as 0.
    const thr = threshold ?? 0;

    const where: any = {
      companyId,
      deletedAt: null,
      OR: [{ reorderLevel: { not: null } }, { reorderLevel: null }],
    };

    const products = await this.prisma.product.findMany({ where });
    const low = products.filter((p: (typeof products)[number]) => {
      const level =
        p.reorderLevel === null
          ? new Decimal(thr)
          : new Decimal(p.reorderLevel);
      return new Decimal(p.stock).lte(level);
    });

    const total = low.length;
    const data = low.slice(skip, skip + limit);

    return { data, meta: { total, page, limit } };
  }
}
