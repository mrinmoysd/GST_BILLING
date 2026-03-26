import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { AccountingService } from '../accounting/accounting.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { GstService } from '../gst/gst.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
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
    private readonly gst: GstService,
    private readonly accounting: AccountingService,
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
      include: {
        supplier: true,
        items: { include: { product: true, batchEntries: true } },
        purchaseReturns: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
        },
        lifecycleEvents: { orderBy: { createdAt: 'desc' } },
      },
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

        if (args.dto.warehouse_id) {
          const warehouse = await tx.warehouse.findFirst({
            where: {
              id: args.dto.warehouse_id,
              companyId: args.companyId,
              isActive: true,
            },
          });
          if (!warehouse) throw new NotFoundException('Warehouse not found');
        }

        const gstContext = await this.gst.resolvePurchaseContext(
          args.companyId,
          supplier.id,
        );

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
          const batchEntries = (item.batches ?? []).map((batch) => ({
            batchNumber: batch.batch_number.trim(),
            quantity: toDecimal(batch.quantity),
            expiryDate: batch.expiry_date ? new Date(batch.expiry_date) : null,
            manufacturingDate: batch.manufacturing_date
              ? new Date(batch.manufacturing_date)
              : null,
          }));
          const batchTotal = batchEntries.reduce(
            (acc, batch) => acc.add(batch.quantity),
            new Decimal(0),
          );
          if (product.batchTrackingEnabled) {
            if (!batchEntries.length) {
              throw new BadRequestException(
                `Batch entries are required for product ${product.name}`,
              );
            }
            if (!batchTotal.equals(quantity)) {
              throw new BadRequestException(
                `Batch quantities must equal purchase quantity for product ${product.name}`,
              );
            }
            if (product.expiryTrackingEnabled) {
              const missingExpiry = batchEntries.some((batch) => !batch.expiryDate);
              if (missingExpiry) {
                throw new BadRequestException(
                  `Expiry date is required for product ${product.name}`,
                );
              }
            }
          } else if (batchEntries.length) {
            throw new BadRequestException(
              `Batch entries are only allowed for batch-tracked product ${product.name}`,
            );
          }
          const taxRate = product.taxRate;
          const split = this.gst.computeTaxSplit({
            companyStateCode: gstContext.companyStateCode,
            placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
            taxableValue: lineSubTotal,
            taxRate,
          });
          const lineTaxTotal = split.taxTotal;
          const lineTotal = lineSubTotal.add(lineTaxTotal);

          return {
            productId: item.product_id,
            hsnCode: product.hsn,
            quantity,
            unitCost,
            discount,
            batchEntries,
            taxRate,
            taxableValue: split.taxableValue,
            cgstAmount: split.cgstAmount,
            sgstAmount: split.sgstAmount,
            igstAmount: split.igstAmount,
            cessAmount: split.cessAmount,
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

        const purchaseData = {
            companyId: args.companyId,
            supplierId: supplier.id,
            status: 'draft',
            supplierGstin: gstContext.supplierGstin,
            placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
            warehouseId: args.dto.warehouse_id ?? null,
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
                  hsnCode: i.hsnCode,
                  quantity: i.quantity,
                  unitCost: i.unitCost,
                  discount: i.discount,
                  batchEntries: i.batchEntries.length
                    ? {
                        create: i.batchEntries.map((batch) => ({
                          companyId: args.companyId,
                          batchNumber: batch.batchNumber,
                          quantity: batch.quantity,
                          expiryDate: batch.expiryDate,
                          manufacturingDate: batch.manufacturingDate,
                        })),
                      }
                    : undefined,
                  taxRate: i.taxRate,
                  taxableValue: i.taxableValue,
                  cgstAmount: i.cgstAmount,
                  sgstAmount: i.sgstAmount,
                  igstAmount: i.igstAmount,
                  cessAmount: i.cessAmount,
                  lineSubTotal: i.lineSubTotal,
                  lineTaxTotal: i.lineTaxTotal,
                  lineTotal: i.lineTotal,
              })),
            },
          } satisfies Prisma.PurchaseUncheckedCreateInput;

        const purchase = await tx.purchase.create({
          data: purchaseData,
          include: { items: true },
        });

        await this.createLifecycleEvent(tx, {
          companyId: args.companyId,
          purchaseId: purchase.id,
          eventType: 'purchase.draft_created',
          summary: 'Draft purchase created',
          payload: {
            item_count: purchase.items.length,
            total: purchase.total.toString(),
          },
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
        include: { items: { include: { batchEntries: true } } },
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

      await this.accounting.postPurchaseReceived(tx, {
        companyId: args.companyId,
        purchase: {
          id: purchase.id,
          purchaseDate: purchase.purchaseDate,
          total: purchase.total,
          subTotal: purchase.subTotal,
          items: purchase.items,
        },
      });

      // Increase stock for each item
      for (const item of purchase.items) {
        await this.inventory.recordPurchaseBatchReceipt({
          tx,
          companyId: args.companyId,
          warehouseId: purchase.warehouseId ?? undefined,
          productId: item.productId,
          purchaseItemId: item.id,
          quantity: new Decimal(item.quantity),
          entries: item.batchEntries.map((entry) => ({
            id: entry.id,
            batchNumber: entry.batchNumber,
            quantity: new Decimal(entry.quantity),
            expiryDate: entry.expiryDate ?? null,
            manufacturingDate: entry.manufacturingDate ?? null,
          })),
        });
        await this.inventory.adjustStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          delta: new Decimal(item.quantity),
          sourceType: 'purchase',
          sourceId: purchase.id,
          note: 'Purchase received',
          warehouseId: purchase.warehouseId ?? undefined,
        });
      }

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        purchaseId: purchase.id,
        eventType: 'purchase.received',
        summary: `Purchase ${purchase.id} received into stock`,
      });

      return { data: updated };
    });
  }

  async cancel(args: { companyId: string; purchaseId: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.purchase.findFirst({
        where: { companyId: args.companyId, id: args.purchaseId },
        include: { items: { include: { batchEntries: true } } },
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
        await this.createLifecycleEvent(tx, {
          companyId: args.companyId,
          purchaseId: purchase.id,
          eventType: 'purchase.cancelled',
          summary: `Draft purchase ${purchase.id} cancelled`,
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
        await this.inventory.reversePurchaseBatchReceipt({
          tx,
          companyId: args.companyId,
          warehouseId: purchase.warehouseId ?? undefined,
          productId: item.productId,
          entries: item.batchEntries.map((entry) => ({
            productBatchId: entry.productBatchId ?? null,
            batchNumber: entry.batchNumber,
            quantity: new Decimal(entry.quantity),
          })),
        });
        await this.inventory.adjustStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          delta: new Decimal(item.quantity).mul(-1),
          sourceType: 'purchase_return',
          sourceId: purchase.id,
          note: 'Purchase cancelled (reversal)',
          warehouseId: purchase.warehouseId ?? undefined,
        });
      }

      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      await this.accounting.postPurchaseCancelled(tx, {
        companyId: args.companyId,
        purchase: {
          id: purchase.id,
          cancelledAt: updated.cancelledAt,
          total: purchase.total,
          subTotal: purchase.subTotal,
          items: purchase.items,
        },
      });

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        purchaseId: purchase.id,
        eventType: 'purchase.cancelled',
        summary: `Purchase ${purchase.id} cancelled and stock reversed`,
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

    await this.prisma.documentLifecycleEvent.create({
      data: {
        companyId: args.companyId,
        purchaseId: purchase.id,
        eventType: 'purchase.bill_attached',
        summary: `Supplier bill attached${args.originalName ? ` (${args.originalName})` : ''}`,
        payload: {
          bill_url: args.billUrl,
          original_name: args.originalName ?? null,
        },
      },
    });

    return { data: updated };
  }

  async createReturn(args: {
    companyId: string;
    purchaseId: string;
    dto: CreatePurchaseReturnDto;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.purchase.findFirst({
        where: { companyId: args.companyId, id: args.purchaseId },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              batchEntries: {
                select: {
                  productBatchId: true,
                  batchNumber: true,
                  quantity: true,
                  createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
              },
              unitCost: true,
              hsnCode: true,
              taxRate: true,
              taxableValue: true,
              cgstAmount: true,
              sgstAmount: true,
              igstAmount: true,
              cessAmount: true,
              lineSubTotal: true,
              lineTaxTotal: true,
              lineTotal: true,
            },
          },
          purchaseReturns: {
            include: {
              items: {
                select: {
                  purchaseItemId: true,
                  productId: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });
      if (!purchase) throw new NotFoundException('Purchase not found');
      if (!['received', 'returned_partial', 'returned'].includes(purchase.status)) {
        throw new ConflictException('Purchase returns require a received purchase');
      }
      if (!args.dto.items?.length) {
        throw new BadRequestException('Purchase return must have at least one item');
      }

      const priorReturnedByItem = new Map<string, Decimal>();
      for (const purchaseReturn of purchase.purchaseReturns) {
        for (const item of purchaseReturn.items) {
          const key = item.purchaseItemId ?? `${item.productId}`;
          const current = priorReturnedByItem.get(key) ?? new Decimal(0);
          priorReturnedByItem.set(key, current.add(new Decimal(item.quantity)));
        }
      }

      const computedItems = args.dto.items.map((item) => {
        const purchaseItem =
          (item.purchase_item_id
            ? purchase.items.find((candidate) => candidate.id === item.purchase_item_id)
            : purchase.items.find((candidate) => candidate.productId === item.product_id)) ??
          null;
        if (!purchaseItem) {
          throw new BadRequestException('Purchase item not found for return');
        }

        const quantity = toDecimal(item.quantity);
        if (quantity.lte(0)) {
          throw new BadRequestException('quantity must be > 0');
        }

        const alreadyReturned =
          priorReturnedByItem.get(purchaseItem.id) ??
          priorReturnedByItem.get(String(purchaseItem.productId)) ??
          new Decimal(0);
        const available = new Decimal(purchaseItem.quantity).sub(alreadyReturned);
        if (quantity.gt(available)) {
          throw new BadRequestException(
            `Requested quantity exceeds returnable quantity for product ${purchaseItem.productId}`,
          );
        }

        const perUnitSubTotal = new Decimal(purchaseItem.lineSubTotal).div(
          purchaseItem.quantity,
        );
        const perUnitTaxTotal = new Decimal(purchaseItem.lineTaxTotal).div(
          purchaseItem.quantity,
        );
        const perUnitTaxableValue = new Decimal(purchaseItem.taxableValue).div(
          purchaseItem.quantity,
        );
        const perUnitCgst = new Decimal(purchaseItem.cgstAmount).div(
          purchaseItem.quantity,
        );
        const perUnitSgst = new Decimal(purchaseItem.sgstAmount).div(
          purchaseItem.quantity,
        );
        const perUnitIgst = new Decimal(purchaseItem.igstAmount).div(
          purchaseItem.quantity,
        );
        const perUnitCess = new Decimal(purchaseItem.cessAmount).div(
          purchaseItem.quantity,
        );
        const lineSubTotal = perUnitSubTotal.mul(quantity);
        const lineTaxTotal = perUnitTaxTotal.mul(quantity);
        const lineTotal = lineSubTotal.add(lineTaxTotal);
        const batchReversalEntries = this.computePurchaseReturnBatchEntries({
          batchEntries: purchaseItem.batchEntries.map((entry) => ({
            productBatchId: entry.productBatchId ?? null,
            batchNumber: entry.batchNumber,
            quantity: new Decimal(entry.quantity),
          })),
          priorReturnedQuantity: alreadyReturned,
          returnQuantity: quantity,
        });

        return {
          purchaseItemId: purchaseItem.id,
          productId: purchaseItem.productId,
          quantity,
          batchReversalEntries,
          unitCost: new Decimal(purchaseItem.unitCost),
          hsnCode: purchaseItem.hsnCode,
          taxRate: purchaseItem.taxRate,
          taxableValue: perUnitTaxableValue.mul(quantity),
          cgstAmount: perUnitCgst.mul(quantity),
          sgstAmount: perUnitSgst.mul(quantity),
          igstAmount: perUnitIgst.mul(quantity),
          cessAmount: perUnitCess.mul(quantity),
          lineSubTotal,
          lineTaxTotal,
          lineTotal,
        };
      });

      const subTotal = computedItems.reduce(
        (acc, item) => acc.add(item.lineSubTotal),
        new Decimal(0),
      );
      const taxTotal = computedItems.reduce(
        (acc, item) => acc.add(item.lineTaxTotal),
        new Decimal(0),
      );
      const total = computedItems.reduce(
        (acc, item) => acc.add(item.lineTotal),
        new Decimal(0),
      );

      const returnNumber = `PR-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;

      const purchaseReturnData = {
          companyId: args.companyId,
          purchaseId: purchase.id,
          returnNumber,
          returnDate: args.dto.return_date ? new Date(args.dto.return_date) : new Date(),
          notes: args.dto.notes ?? null,
          subTotal,
          taxTotal,
          total,
          items: {
            create: computedItems.map((item) => ({
              companyId: args.companyId,
              purchaseItemId: item.purchaseItemId,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              hsnCode: item.hsnCode,
              taxRate: item.taxRate,
              taxableValue: item.taxableValue,
              cgstAmount: item.cgstAmount,
              sgstAmount: item.sgstAmount,
              igstAmount: item.igstAmount,
              cessAmount: item.cessAmount,
              lineSubTotal: item.lineSubTotal,
              lineTaxTotal: item.lineTaxTotal,
              lineTotal: item.lineTotal,
            })),
          },
        } satisfies Prisma.PurchaseReturnUncheckedCreateInput;

      const purchaseReturn = await tx.purchaseReturn.create({
        data: purchaseReturnData,
        include: { items: true },
      });

      for (const item of computedItems) {
        await this.inventory.reversePurchaseBatchReceipt({
          tx,
          companyId: args.companyId,
          warehouseId: purchase.warehouseId ?? undefined,
          productId: item.productId,
          entries: item.batchReversalEntries,
        });
        await this.inventory.adjustStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          delta: item.quantity.mul(-1),
          sourceType: 'purchase_return',
          sourceId: purchaseReturn.id,
          note: `Purchase return ${purchaseReturn.returnNumber}`,
          warehouseId: purchase.warehouseId ?? undefined,
        });
      }

      const nextStatus = this.derivePurchaseStatusAfterReturn({
        purchaseItems: purchase.items.map((item) => ({
          id: item.id,
          quantity: new Decimal(item.quantity),
        })),
        priorReturns: purchase.purchaseReturns.flatMap((purchaseReturn) => purchaseReturn.items),
        nextItems: computedItems.map((item) => ({
          purchaseItemId: item.purchaseItemId,
          quantity: item.quantity,
        })),
      });

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: nextStatus },
      });

      await this.accounting.postPurchaseReturn(tx, {
        companyId: args.companyId,
        purchase: {
          id: purchase.id,
        },
        purchaseReturn: {
          id: purchaseReturn.id,
          returnNumber: purchaseReturn.returnNumber,
          returnDate: purchaseReturn.returnDate,
          total: purchaseReturn.total,
          subTotal: purchaseReturn.subTotal,
          items: purchaseReturn.items,
        },
      });

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        purchaseId: purchase.id,
        eventType: 'purchase.return_created',
        summary: `Purchase return ${purchaseReturn.returnNumber} created`,
        payload: {
          purchase_return_id: purchaseReturn.id,
          return_number: purchaseReturn.returnNumber,
          total: purchaseReturn.total.toString(),
        },
      });

      return { data: purchaseReturn };
    });
  }

  private derivePurchaseStatusAfterReturn(args: {
    purchaseItems: Array<{ id: string; quantity: Decimal }>;
    priorReturns: Array<{ purchaseItemId: string | null; productId: string; quantity: Decimal }>;
    nextItems: Array<{ purchaseItemId: string; quantity: Decimal }>;
  }) {
    const returnedByItem = new Map<string, Decimal>();
    for (const item of args.priorReturns) {
      if (!item.purchaseItemId) continue;
      const current = returnedByItem.get(item.purchaseItemId) ?? new Decimal(0);
      returnedByItem.set(item.purchaseItemId, current.add(new Decimal(item.quantity)));
    }
    for (const item of args.nextItems) {
      const current = returnedByItem.get(item.purchaseItemId) ?? new Decimal(0);
      returnedByItem.set(item.purchaseItemId, current.add(item.quantity));
    }

    const fullyReturned = args.purchaseItems.every((item) => {
      const returned = returnedByItem.get(item.id) ?? new Decimal(0);
      return returned.gte(item.quantity);
    });
    return fullyReturned ? 'returned' : 'returned_partial';
  }

  private computePurchaseReturnBatchEntries(args: {
    batchEntries: Array<{
      productBatchId: string | null;
      batchNumber: string;
      quantity: Decimal;
    }>;
    priorReturnedQuantity: Decimal;
    returnQuantity: Decimal;
  }) {
    if (!args.batchEntries.length || args.returnQuantity.lte(0)) return [];

    let skip = new Decimal(args.priorReturnedQuantity);
    let remaining = new Decimal(args.returnQuantity);
    const allocations: Array<{
      productBatchId: string | null;
      batchNumber: string;
      quantity: Decimal;
    }> = [];

    for (const entry of args.batchEntries) {
      if (remaining.lte(0)) break;
      if (skip.gte(entry.quantity)) {
        skip = skip.sub(entry.quantity);
        continue;
      }

      const availableFromEntry = entry.quantity.sub(skip);
      const take = Decimal.min(availableFromEntry, remaining);
      if (take.gt(0)) {
        allocations.push({
          productBatchId: entry.productBatchId,
          batchNumber: entry.batchNumber,
          quantity: take,
        });
        remaining = remaining.sub(take);
      }
      skip = new Decimal(0);
    }

    return allocations;
  }

  private async createLifecycleEvent(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      purchaseId?: string;
      eventType: string;
      summary: string;
      payload?: Prisma.InputJsonValue;
    },
  ) {
    await tx.documentLifecycleEvent.create({
      data: {
        companyId: args.companyId,
        purchaseId: args.purchaseId,
        eventType: args.eventType,
        summary: args.summary,
        payload: args.payload,
      },
    });
  }
}
