import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PatchPurchaseDto } from './dto/patch-purchase.dto';

function toDecimal(value: string | undefined, fallback = '0'): Decimal {
  const v = (value ?? fallback).trim();
  return new Decimal(v);
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async list(args: {
    companyId: string;
    page: number;
    limit: number;
    q?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const skip = (args.page - 1) * args.limit;

    const where: any = {
      companyId: args.companyId,
      ...(args.status ? { status: args.status } : {}),
      ...(args.q
        ? {
            OR: [
              { supplier: { name: { contains: args.q, mode: 'insensitive' } } },
              { notes: { contains: args.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(args.from || args.to
        ? {
            purchaseDate: {
              ...(args.from ? { gte: new Date(args.from) } : {}),
              ...(args.to ? { lte: new Date(args.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
        include: { supplier: true },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { data, meta: { page: args.page, limit: args.limit, total } };
  }

  async get(args: { companyId: string; purchaseId: string }) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { companyId: args.companyId, id: args.purchaseId },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return { data: purchase };
  }

  async createDraft(args: { companyId: string; dto: CreatePurchaseDto }) {
    if (!args.dto.items?.length) {
      throw new BadRequestException('Purchase must have at least one item');
    }

    const body = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const supplier = await tx.supplier.findFirst({
          where: {
            id: args.dto.supplier_id,
            companyId: args.companyId,
            deletedAt: null,
          },
        });
        if (!supplier) throw new NotFoundException('Supplier not found');

        const productIds = args.dto.items.map((i) => i.product_id);
        const products = await tx.product.findMany({
          where: {
            companyId: args.companyId,
            id: { in: productIds },
            deletedAt: null,
          },
        });
        if (products.length !== productIds.length) {
          throw new BadRequestException('One or more products not found');
        }

        const itemsComputed = args.dto.items.map((item) => {
          const quantity = toDecimal(item.quantity);
          const unitCost = toDecimal(item.unit_cost);
          const discount = toDecimal(item.discount, '0');

          if (quantity.lte(0))
            throw new BadRequestException('quantity must be > 0');
          if (unitCost.lt(0))
            throw new BadRequestException('unit_cost must be >= 0');
          if (discount.lt(0))
            throw new BadRequestException('discount must be >= 0');

          const lineSubTotal = quantity.mul(unitCost).sub(discount);
          const product = products.find(
            (p: (typeof products)[number]) => p.id === item.product_id,
          )!;
          const taxRate = product.taxRate;
          const lineTaxTotal = taxRate
            ? lineSubTotal.mul(taxRate).div(100)
            : new Decimal(0);
          const lineTotal = lineSubTotal.add(lineTaxTotal);

          return {
            productId: item.product_id,
            quantity,
            unitCost,
            discount,
            taxRate,
            lineSubTotal,
            lineTaxTotal,
            lineTotal,
          };
        });

        const subTotal = itemsComputed.reduce(
          (acc, i) => acc.add(i.lineSubTotal),
          new Decimal(0),
        );
        const taxTotal = itemsComputed.reduce(
          (acc, i) => acc.add(i.lineTaxTotal),
          new Decimal(0),
        );
        const total = itemsComputed.reduce(
          (acc, i) => acc.add(i.lineTotal),
          new Decimal(0),
        );

        const purchase = await tx.purchase.create({
          data: {
            companyId: args.companyId,
            supplierId: supplier.id,
            status: 'draft',
            purchaseDate: args.dto.purchase_date
              ? new Date(args.dto.purchase_date)
              : null,
            notes: args.dto.notes ?? null,
            subTotal,
            taxTotal,
            total,
            items: {
              create: itemsComputed.map((i) => ({
                companyId: args.companyId,
                productId: i.productId,
                quantity: i.quantity,
                unitCost: i.unitCost,
                discount: i.discount,
                taxRate: i.taxRate,
                lineSubTotal: i.lineSubTotal,
                lineTaxTotal: i.lineTaxTotal,
                lineTotal: i.lineTotal,
              })),
            },
          },
          include: { items: true },
        });

        return { data: purchase };
      },
    );

    return body;
  }

  async patchDraft(args: {
    companyId: string;
    purchaseId: string;
    patch: PatchPurchaseDto;
  }) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { companyId: args.companyId, id: args.purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status !== 'draft') {
      throw new ConflictException('Only draft purchases can be updated');
    }

    const updated = await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        notes: args.patch.notes ?? undefined,
        purchaseDate: args.patch.purchase_date
          ? new Date(args.patch.purchase_date)
          : undefined,
      },
    });

    return { data: updated };
  }

  async receive(args: { companyId: string; purchaseId: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.purchase.findFirst({
        where: { companyId: args.companyId, id: args.purchaseId },
        include: { items: true },
      });
      if (!purchase) throw new NotFoundException('Purchase not found');
      if (purchase.status !== 'draft') {
        throw new ConflictException('Only draft purchases can be received');
      }

      // Mark received first (still in same TX)
      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'received', receivedAt: new Date() },
      });

      // Increase stock for each item
      for (const item of purchase.items) {
        await this.inventory.adjustStock({
          companyId: args.companyId,
          productId: item.productId,
          delta: new Decimal(item.quantity),
          sourceType: 'purchase',
          sourceId: purchase.id,
          note: 'Purchase received',
        });
      }

      return { data: updated };
    });
  }

  async cancel(args: { companyId: string; purchaseId: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.purchase.findFirst({
        where: { companyId: args.companyId, id: args.purchaseId },
        include: { items: true },
      });
      if (!purchase) throw new NotFoundException('Purchase not found');
      if (purchase.status === 'cancelled') {
        throw new ConflictException('Purchase already cancelled');
      }

      // If draft: just cancel
      if (purchase.status === 'draft') {
        const updated = await tx.purchase.update({
          where: { id: purchase.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        });
        return { data: updated };
      }

      if (purchase.status !== 'received') {
        throw new ConflictException(
          `Cannot cancel purchase with status=${purchase.status}`,
        );
      }

      // Reverse stock for each item. Negative stock enforcement is respected.
      for (const item of purchase.items) {
        await this.inventory.adjustStock({
          companyId: args.companyId,
          productId: item.productId,
          delta: new Decimal(item.quantity).mul(-1),
          sourceType: 'purchase_return',
          sourceId: purchase.id,
          note: 'Purchase cancelled (reversal)',
        });
      }

      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      return { data: updated };
    });
  }

  async attachBill(args: {
    companyId: string;
    purchaseId: string;
    billUrl: string;
    originalName?: string;
  }) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { companyId: args.companyId, id: args.purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    const updated = await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        billUrl: args.billUrl,
        billOriginalName: args.originalName ?? null,
      },
    });

    return { data: updated };
  }
}
