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
  | 'transfer_dispatch'
  | 'transfer_receive'
  | 'opening'
  | 'correction';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDateOnly(value?: Date | null) {
    if (!value) return null;
    return value.toISOString().slice(0, 10);
  }

  private async getBatchTrackedProduct(args: {
    tx: Prisma.TransactionClient | PrismaService;
    companyId: string;
    productId: string;
  }) {
    const product = await args.tx.product.findFirst({
      where: {
        id: args.productId,
        companyId: args.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
        batchIssuePolicy: true,
      },
    });
    if (!product) {
      throw new UnprocessableEntityException('Product not found');
    }
    return product;
  }

  /**
   * Contract:
   * - Always updates Product.stock and writes StockMovement in the SAME transaction.
   * - Enforces Company.allowNegativeStock unless overrideAllowNegative is true.
   */
  async assertStockAvailable(args: {
    tx?: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    items: Array<{ productId: string; quantity: Decimal }>;
  }) {
    if (!args.items.length) return;

    const client = args.tx ?? this.prisma;

    const run = async (txc: Prisma.TransactionClient | PrismaService) => {
      const company = await txc.company.findUnique({
        where: { id: args.companyId },
        select: { allowNegativeStock: true },
      });
      if (!company) throw new UnprocessableEntityException('Company not found');
      if (company.allowNegativeStock) return;

      if (args.warehouseId) {
        const warehouse = await txc.warehouse.findFirst({
          where: {
            id: args.warehouseId,
            companyId: args.companyId,
            isActive: true,
          },
          select: { id: true },
        });
        if (!warehouse) {
          throw new UnprocessableEntityException('Warehouse not found');
        }
      }

      const requiredByProduct = new Map<string, Decimal>();
      for (const item of args.items) {
        if (item.quantity.lte(0)) continue;
        const current = requiredByProduct.get(item.productId) ?? new Decimal(0);
        requiredByProduct.set(item.productId, current.add(item.quantity));
      }
      if (!requiredByProduct.size) return;

      const productIds = Array.from(requiredByProduct.keys());
      const products = await txc.product.findMany({
        where: {
          companyId: args.companyId,
          id: { in: productIds },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          stock: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new UnprocessableEntityException('One or more products not found');
      }

      const productById = new Map(products.map((product) => [product.id, product]));

      let warehouseStockByProduct = new Map<string, Decimal>();
      if (args.warehouseId) {
        const warehouseStocks = await txc.warehouseStock.findMany({
          where: {
            companyId: args.companyId,
            warehouseId: args.warehouseId,
            productId: { in: productIds },
          },
          select: {
            productId: true,
            quantity: true,
          },
        });
        warehouseStockByProduct = new Map(
          warehouseStocks.map((row) => [row.productId, new Decimal(row.quantity)]),
        );
      }

      for (const [productId, required] of requiredByProduct.entries()) {
        const product = productById.get(productId);
        if (!product) {
          throw new UnprocessableEntityException('One or more products not found');
        }

        const globalCurrent = new Decimal(product.stock ?? 0);
        if (globalCurrent.lt(required)) {
          throw new UnprocessableEntityException({
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock for ${product.name}`,
            details: {
              productId,
              required: required.toString(),
              available: globalCurrent.toString(),
            },
          });
        }

        if (args.warehouseId) {
          const warehouseCurrent =
            warehouseStockByProduct.get(productId) ?? new Decimal(0);
          if (warehouseCurrent.lt(required)) {
            throw new UnprocessableEntityException({
              code: 'INSUFFICIENT_WAREHOUSE_STOCK',
              message: `Insufficient stock in selected warehouse for ${product.name}`,
              details: {
                productId,
                warehouseId: args.warehouseId,
                required: required.toString(),
                available: warehouseCurrent.toString(),
              },
            });
          }
        }
      }
    };

    if (args.tx) return run(client);
    return this.prisma.$transaction(async (txc: Prisma.TransactionClient) =>
      run(txc),
    );
  }

  async adjustStock(args: {
    tx?: Prisma.TransactionClient;
    companyId: string;
    productId: string;
    delta: Decimal;
    sourceType: StockSourceType;
    sourceId?: string;
    note?: string;
    overrideAllowNegative?: boolean;
    warehouseId?: string;
  }) {
    const {
      tx,
      companyId,
      productId,
      delta,
      sourceType,
      sourceId,
      note,
      overrideAllowNegative,
      warehouseId,
    } = args;

    const client = tx ?? this.prisma;

    const run = async (txc: Prisma.TransactionClient | PrismaService) => {
      const company = await txc.company.findUnique({ where: { id: companyId } });
      if (!company) throw new UnprocessableEntityException('Company not found');

      const product = await txc.product.findFirst({
        where: { id: productId, companyId, deletedAt: null },
      });
      if (!product) throw new UnprocessableEntityException('Product not found');

      let warehouseNext: Decimal | null = null;
      if (warehouseId) {
        const warehouse = await txc.warehouse.findFirst({
          where: { id: warehouseId, companyId, isActive: true },
        });
        if (!warehouse) {
          throw new UnprocessableEntityException('Warehouse not found');
        }

        const warehouseStock = await txc.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId,
              productId,
            },
          },
        });

        const currentWarehouseQty = new Decimal(warehouseStock?.quantity ?? 0);
        warehouseNext = currentWarehouseQty.add(delta);

        if (
          !overrideAllowNegative &&
          !company.allowNegativeStock &&
          warehouseNext.isNegative()
        ) {
          throw new UnprocessableEntityException({
            code: 'INSUFFICIENT_WAREHOUSE_STOCK',
            message: 'Negative warehouse stock is not allowed for this company',
            details: {
              warehouseId,
              productId,
              current: currentWarehouseQty.toString(),
              delta: delta.toString(),
            },
          });
        }
      }

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

      const updated = await txc.product.update({
        where: { id: productId },
        data: { stock: next },
      });

      if (warehouseId && warehouseNext) {
        await txc.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId,
              productId,
            },
          },
          create: {
            companyId,
            warehouseId,
            productId,
            quantity: warehouseNext,
          },
          update: {
            quantity: warehouseNext,
            updatedAt: new Date(),
          },
        });
      }

      await txc.stockMovement.create({
        data: {
          companyId,
          productId,
          warehouseId: warehouseId ?? null,
          changeQty: delta,
          balanceQty: next,
          sourceType,
          sourceId: sourceId ?? null,
          note: note ?? null,
        },
      });

      return updated;
    };

    if (tx) return run(client);
    return this.prisma.$transaction(async (txc: Prisma.TransactionClient) =>
      run(txc),
    );
  }

  async moveWarehouseStock(args: {
    tx?: Prisma.TransactionClient;
    companyId: string;
    productId: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    quantity: Decimal;
    sourceId?: string;
    note?: string;
    overrideAllowNegative?: boolean;
  }) {
    const {
      tx,
      companyId,
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      sourceId,
      note,
      overrideAllowNegative,
    } = args;

    if (quantity.lte(0)) {
      throw new UnprocessableEntityException(
        'Transfer quantity must be greater than zero',
      );
    }

    if (!fromWarehouseId && !toWarehouseId) {
      throw new UnprocessableEntityException(
        'At least one warehouse is required',
      );
    }

    const run = async (txc: Prisma.TransactionClient | PrismaService) => {
      const company = await txc.company.findUnique({ where: { id: companyId } });
      if (!company) throw new UnprocessableEntityException('Company not found');

      const product = await txc.product.findFirst({
        where: { id: productId, companyId, deletedAt: null },
      });
      if (!product) throw new UnprocessableEntityException('Product not found');

      const ensureWarehouse = async (warehouseId: string) => {
        const warehouse = await txc.warehouse.findFirst({
          where: { id: warehouseId, companyId, isActive: true },
        });
        if (!warehouse) {
          throw new UnprocessableEntityException('Warehouse not found');
        }
        return warehouse;
      };

      if (fromWarehouseId) await ensureWarehouse(fromWarehouseId);
      if (toWarehouseId) await ensureWarehouse(toWarehouseId);

      if (fromWarehouseId) {
        const current = await txc.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: fromWarehouseId,
              productId,
            },
          },
        });

        const next = new Decimal(current?.quantity ?? 0).sub(quantity);
        if (
          !overrideAllowNegative &&
          !company.allowNegativeStock &&
          next.isNegative()
        ) {
          throw new UnprocessableEntityException({
            code: 'INSUFFICIENT_WAREHOUSE_STOCK',
            message: 'Negative warehouse stock is not allowed for this company',
            details: {
              warehouseId: fromWarehouseId,
              productId,
              current: new Decimal(current?.quantity ?? 0).toString(),
              delta: quantity.mul(-1).toString(),
            },
          });
        }

        await txc.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: fromWarehouseId,
              productId,
            },
          },
          create: {
            companyId,
            warehouseId: fromWarehouseId,
            productId,
            quantity: next,
          },
          update: {
            quantity: next,
            updatedAt: new Date(),
          },
        });

        await txc.stockMovement.create({
          data: {
            companyId,
            productId,
            warehouseId: fromWarehouseId,
            changeQty: quantity.mul(-1),
            balanceQty: next,
            sourceType: 'transfer_dispatch',
            sourceId: sourceId ?? null,
            note: note ?? null,
          },
        });
      }

      if (toWarehouseId) {
        const current = await txc.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: toWarehouseId,
              productId,
            },
          },
        });

        const next = new Decimal(current?.quantity ?? 0).add(quantity);
        await txc.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: toWarehouseId,
              productId,
            },
          },
          create: {
            companyId,
            warehouseId: toWarehouseId,
            productId,
            quantity: next,
          },
          update: {
            quantity: next,
            updatedAt: new Date(),
          },
        });

        await txc.stockMovement.create({
          data: {
            companyId,
            productId,
            warehouseId: toWarehouseId,
            changeQty: quantity,
            balanceQty: next,
            sourceType: 'transfer_receive',
            sourceId: sourceId ?? null,
            note: note ?? null,
          },
        });
      }

      return product;
    };

    if (tx) return run(tx);
    return this.prisma.$transaction(async (txc: Prisma.TransactionClient) =>
      run(txc),
    );
  }

  async recordPurchaseBatchReceipt(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    productId: string;
    purchaseItemId: string;
    quantity: Decimal;
    entries: Array<{
      id: string;
      batchNumber: string;
      quantity: Decimal;
      expiryDate?: Date | null;
      manufacturingDate?: Date | null;
    }>;
  }) {
    const product = await this.getBatchTrackedProduct({
      tx: args.tx,
      companyId: args.companyId,
      productId: args.productId,
    });

    if (!product.batchTrackingEnabled) {
      return [];
    }

    if (!args.warehouseId) {
      throw new UnprocessableEntityException(
        `Warehouse is required to receive batch-tracked product ${product.name}`,
      );
    }

    if (!args.entries.length) {
      throw new UnprocessableEntityException(
        `Batch entries are required for product ${product.name}`,
      );
    }

    const total = args.entries.reduce(
      (acc, entry) => acc.add(entry.quantity),
      new Decimal(0),
    );
    if (!total.equals(args.quantity)) {
      throw new UnprocessableEntityException(
        `Batch quantities must match received quantity for product ${product.name}`,
      );
    }

    const created: Array<{ productBatchId: string; quantity: Decimal }> = [];

    for (const entry of args.entries) {
      if (entry.quantity.lte(0)) {
        throw new UnprocessableEntityException('Batch quantity must be > 0');
      }
      if (!entry.batchNumber.trim()) {
        throw new UnprocessableEntityException('Batch number is required');
      }
      if (product.expiryTrackingEnabled && !entry.expiryDate) {
        throw new UnprocessableEntityException(
          `Expiry date is required for product ${product.name}`,
        );
      }

      const productBatch = await args.tx.productBatch.upsert({
        where: {
          companyId_productId_batchNumber: {
            companyId: args.companyId,
            productId: args.productId,
            batchNumber: entry.batchNumber.trim(),
          },
        },
        create: {
          companyId: args.companyId,
          productId: args.productId,
          batchNumber: entry.batchNumber.trim(),
          expiryDate: entry.expiryDate ?? null,
          manufacturingDate: entry.manufacturingDate ?? null,
        },
        update: {
          expiryDate: entry.expiryDate ?? undefined,
          manufacturingDate: entry.manufacturingDate ?? undefined,
          updatedAt: new Date(),
        },
      });

      await args.tx.purchaseItemBatch.update({
        where: { id: entry.id },
        data: {
          productBatchId: productBatch.id,
          expiryDate: entry.expiryDate ?? undefined,
          manufacturingDate: entry.manufacturingDate ?? undefined,
        },
      });

      const current = await args.tx.warehouseBatchStock.findUnique({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: productBatch.id,
          },
        },
      });
      const next = new Decimal(current?.quantity ?? 0).add(entry.quantity);

      await args.tx.warehouseBatchStock.upsert({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: productBatch.id,
          },
        },
        create: {
          companyId: args.companyId,
          warehouseId: args.warehouseId,
          productBatchId: productBatch.id,
          quantity: next,
          reservedQuantity: new Decimal(current?.reservedQuantity ?? 0),
        },
        update: {
          quantity: next,
          updatedAt: new Date(),
        },
      });

      created.push({ productBatchId: productBatch.id, quantity: entry.quantity });
    }

    return created;
  }

  async reversePurchaseBatchReceipt(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    productId: string;
    entries: Array<{
      productBatchId?: string | null;
      batchNumber: string;
      quantity: Decimal;
    }>;
  }) {
    const product = await this.getBatchTrackedProduct({
      tx: args.tx,
      companyId: args.companyId,
      productId: args.productId,
    });

    if (!product.batchTrackingEnabled || !args.entries.length) {
      return;
    }

    if (!args.warehouseId) {
      throw new UnprocessableEntityException(
        `Warehouse is required to reverse batch-tracked product ${product.name}`,
      );
    }

    for (const entry of args.entries) {
      const productBatchId =
        entry.productBatchId ??
        (
          await args.tx.productBatch.findUnique({
            where: {
              companyId_productId_batchNumber: {
                companyId: args.companyId,
                productId: args.productId,
                batchNumber: entry.batchNumber,
              },
            },
            select: { id: true },
          })
        )?.id;

      if (!productBatchId) {
        throw new UnprocessableEntityException(
          `Batch ${entry.batchNumber} not found for product ${product.name}`,
        );
      }

      const stock = await args.tx.warehouseBatchStock.findUnique({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId,
          },
        },
      });
      const next = new Decimal(stock?.quantity ?? 0).sub(entry.quantity);
      if (next.isNegative()) {
        throw new UnprocessableEntityException({
          code: 'INSUFFICIENT_BATCH_STOCK',
          message: `Batch reversal would make stock negative for product ${product.name}`,
          details: {
            productId: args.productId,
            batchNumber: entry.batchNumber,
            warehouseId: args.warehouseId,
          },
        });
      }

      await args.tx.warehouseBatchStock.update({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId,
          },
        },
        data: {
          quantity: next,
          updatedAt: new Date(),
        },
      });
    }
  }

  private async allocateWarehouseBatches(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    productId: string;
    quantity: Decimal;
    preferredAllocations?: Array<{ productBatchId: string; quantity?: Decimal }>;
  }) {
    const product = await this.getBatchTrackedProduct({
      tx: args.tx,
      companyId: args.companyId,
      productId: args.productId,
    });

    if (!product.batchTrackingEnabled || args.quantity.lte(0)) {
      return [];
    }

    if (!args.warehouseId) {
      throw new UnprocessableEntityException(
        `Warehouse is required to issue batch-tracked product ${product.name}`,
      );
    }

    const today = this.normalizeDateOnly(new Date());
    const preferredOrder = new Map(
      (args.preferredAllocations ?? []).map((entry, index) => [
        entry.productBatchId,
        index,
      ]),
    );
    const preferredRemaining = new Map(
      (args.preferredAllocations ?? []).map((entry) => [
        entry.productBatchId,
        entry.quantity ? new Decimal(entry.quantity) : null,
      ]),
    );
    const batches = await args.tx.productBatch.findMany({
      where: {
        companyId: args.companyId,
        productId: args.productId,
        warehouseStocks: {
          some: {
            warehouseId: args.warehouseId,
            companyId: args.companyId,
          },
        },
      },
      include: {
        warehouseStocks: {
          where: {
            warehouseId: args.warehouseId,
            companyId: args.companyId,
          },
        },
      },
    });

    const candidates = batches
      .map((batch) => {
        const stock = batch.warehouseStocks[0];
        const available = new Decimal(stock?.quantity ?? 0).sub(
          new Decimal(stock?.reservedQuantity ?? 0),
        );
        return {
          batch,
          stock,
          available,
        };
      })
      .filter((entry) => {
        if (entry.available.lte(0)) return false;
        if (!product.expiryTrackingEnabled || !today) return true;
        const expiry = this.normalizeDateOnly(entry.batch.expiryDate);
        return !expiry || expiry >= today;
      });

    candidates.sort((left, right) => {
      const leftPreferred = preferredOrder.get(left.batch.id);
      const rightPreferred = preferredOrder.get(right.batch.id);
      if (leftPreferred !== undefined || rightPreferred !== undefined) {
        if (leftPreferred === undefined) return 1;
        if (rightPreferred === undefined) return -1;
        return leftPreferred - rightPreferred;
      }

      const leftExpiry = this.normalizeDateOnly(left.batch.expiryDate) ?? '9999-12-31';
      const rightExpiry = this.normalizeDateOnly(right.batch.expiryDate) ?? '9999-12-31';
      const leftCreated = left.batch.createdAt.toISOString();
      const rightCreated = right.batch.createdAt.toISOString();
      const policy = product.batchIssuePolicy ?? 'NONE';

      if (policy === 'FEFO') {
        return leftExpiry.localeCompare(rightExpiry) || leftCreated.localeCompare(rightCreated);
      }
      if (policy === 'FIFO') {
        return leftCreated.localeCompare(rightCreated);
      }
      if (product.expiryTrackingEnabled) {
        return leftExpiry.localeCompare(rightExpiry) || leftCreated.localeCompare(rightCreated);
      }
      return leftCreated.localeCompare(rightCreated);
    });

    let remaining = new Decimal(args.quantity);
    const allocations: Array<{ productBatchId: string; quantity: Decimal }> = [];

    for (const candidate of candidates) {
      if (remaining.lte(0)) break;
      const preferredTarget = preferredRemaining.get(candidate.batch.id);
      const cappedAvailable =
        preferredTarget && preferredTarget.gte(0)
          ? Decimal.min(candidate.available, preferredTarget)
          : candidate.available;
      const allocate = Decimal.min(cappedAvailable, remaining);
      if (allocate.lte(0)) continue;

      await args.tx.warehouseBatchStock.update({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: candidate.batch.id,
          },
        },
        data: {
          quantity: new Decimal(candidate.stock?.quantity ?? 0).sub(allocate),
          updatedAt: new Date(),
        },
      });

      allocations.push({ productBatchId: candidate.batch.id, quantity: allocate });
      remaining = remaining.sub(allocate);
      if (preferredTarget && preferredTarget.gte(0)) {
        preferredRemaining.set(candidate.batch.id, preferredTarget.sub(allocate));
      }
    }

    if (remaining.gt(0)) {
      throw new UnprocessableEntityException({
        code: 'INSUFFICIENT_BATCH_STOCK',
        message: `Insufficient batch stock for product ${product.name}`,
        details: {
          productId: args.productId,
          warehouseId: args.warehouseId,
          requested: args.quantity.toString(),
          remaining: remaining.toString(),
        },
      });
    }

    return allocations;
  }

  async allocateInvoiceItemBatches(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    invoiceItemId: string;
    productId: string;
    quantity: Decimal;
    preferredAllocations?: Array<{ productBatchId: string; quantity?: Decimal }>;
  }) {
    const allocations = await this.allocateWarehouseBatches({
      tx: args.tx,
      companyId: args.companyId,
      warehouseId: args.warehouseId,
      productId: args.productId,
      quantity: args.quantity,
      preferredAllocations: args.preferredAllocations,
    });

    for (const allocation of allocations) {
      await args.tx.invoiceItemBatchAllocation.create({
        data: {
          companyId: args.companyId,
          invoiceItemId: args.invoiceItemId,
          productBatchId: allocation.productBatchId,
          quantity: allocation.quantity,
        },
      });
    }

    return allocations;
  }

  async allocateTransferItemBatches(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    stockTransferItemId: string;
    productId: string;
    quantity: Decimal;
  }) {
    const allocations = await this.allocateWarehouseBatches({
      tx: args.tx,
      companyId: args.companyId,
      warehouseId: args.warehouseId,
      productId: args.productId,
      quantity: args.quantity,
    });

    for (const allocation of allocations) {
      await args.tx.stockTransferItemBatchAllocation.create({
        data: {
          companyId: args.companyId,
          stockTransferItemId: args.stockTransferItemId,
          productBatchId: allocation.productBatchId,
          quantity: allocation.quantity,
        },
      });
    }

    return allocations;
  }

  async restoreInvoiceItemBatches(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    allocations: Array<{ productBatchId: string; quantity: Decimal }>;
  }) {
    if (!args.warehouseId || !args.allocations.length) return;

    for (const allocation of args.allocations) {
      const current = await args.tx.warehouseBatchStock.findUnique({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: allocation.productBatchId,
          },
        },
      });
      const next = new Decimal(current?.quantity ?? 0).add(allocation.quantity);
      await args.tx.warehouseBatchStock.upsert({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: allocation.productBatchId,
          },
        },
        create: {
          companyId: args.companyId,
          warehouseId: args.warehouseId,
          productBatchId: allocation.productBatchId,
          quantity: next,
          reservedQuantity: new Decimal(current?.reservedQuantity ?? 0),
        },
        update: {
          quantity: next,
          updatedAt: new Date(),
        },
      });
    }
  }

  async receiveTransferItemBatches(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    warehouseId?: string;
    allocations: Array<{ productBatchId: string; quantity: Decimal }>;
  }) {
    if (!args.warehouseId || !args.allocations.length) return;

    for (const allocation of args.allocations) {
      const current = await args.tx.warehouseBatchStock.findUnique({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: allocation.productBatchId,
          },
        },
      });
      const next = new Decimal(current?.quantity ?? 0).add(allocation.quantity);
      await args.tx.warehouseBatchStock.upsert({
        where: {
          warehouseId_productBatchId: {
            warehouseId: args.warehouseId,
            productBatchId: allocation.productBatchId,
          },
        },
        create: {
          companyId: args.companyId,
          warehouseId: args.warehouseId,
          productBatchId: allocation.productBatchId,
          quantity: next,
          reservedQuantity: new Decimal(current?.reservedQuantity ?? 0),
        },
        update: {
          quantity: next,
          updatedAt: new Date(),
        },
      });
    }
  }

  async listBatchStock(args: {
    companyId: string;
    warehouseId?: string;
    productId?: string;
    nearExpiryDays?: number;
    page: number;
    limit: number;
  }) {
    const skip = (args.page - 1) * args.limit;
    const today = new Date();
    const cutoff = args.nearExpiryDays
      ? new Date(today.getTime() + args.nearExpiryDays * 24 * 60 * 60 * 1000)
      : null;

    const where: Prisma.WarehouseBatchStockWhereInput = {
      companyId: args.companyId,
      ...(args.warehouseId ? { warehouseId: args.warehouseId } : {}),
      productBatch: {
        ...(args.productId ? { productId: args.productId } : {}),
        ...(cutoff
          ? {
              expiryDate: {
                lte: cutoff,
              },
            }
          : {}),
      },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.warehouseBatchStock.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          productBatch: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  batchTrackingEnabled: true,
                  expiryTrackingEnabled: true,
                },
              },
            },
          },
        },
        orderBy: [
          { productBatch: { expiryDate: 'asc' } },
          { productBatch: { createdAt: 'asc' } },
        ],
        skip,
        take: args.limit,
      }),
      this.prisma.warehouseBatchStock.count({ where }),
    ]);

    return { data, meta: { total, page: args.page, limit: args.limit } };
  }

  async listMovements(args: {
    companyId: string;
    productId?: string;
    warehouseId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const { companyId, productId, warehouseId, from, to, page, limit } = args;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
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
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
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

    const where: Prisma.ProductWhereInput = {
      companyId,
      deletedAt: null,
    };

    const products = await this.prisma.product.findMany({
      where,
      orderBy: [{ stock: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        companyId: true,
        categoryId: true,
        name: true,
        sku: true,
        hsn: true,
        unit: true,
        price: true,
        costPrice: true,
        taxRate: true,
        stock: true,
        reorderLevel: true,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
        batchIssuePolicy: true,
        nearExpiryDays: true,
        metadata: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const low = products.filter((product) => {
      const stock = Number(product.stock ?? 0);
      const level =
        product.reorderLevel === null || product.reorderLevel === undefined
          ? thr
          : Number(product.reorderLevel);
      return stock <= level;
    });

    const total = low.length;
    const data = low.slice(skip, skip + limit);

    return { data, meta: { total, page, limit } };
  }

  async listWarehouses(args: {
    companyId: string;
    page: number;
    limit: number;
    q?: string;
    activeOnly?: boolean;
  }) {
    const { companyId, page, limit, q, activeOnly } = args;
    const skip = (page - 1) * limit;
    const where: Prisma.WarehouseWhereInput = {
      companyId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
              { locationLabel: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              stocks: true,
              outboundTransfers: true,
              inboundTransfers: true,
            },
          },
        },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async createWarehouse(args: {
    companyId: string;
    name: string;
    code: string;
    locationLabel?: string;
    isDefault?: boolean;
  }) {
    const code = args.code.trim().toUpperCase();
    const name = args.name.trim();
    if (!name) {
      throw new UnprocessableEntityException('Warehouse name is required');
    }
    if (!code) {
      throw new UnprocessableEntityException('Warehouse code is required');
    }

    return this.prisma.$transaction(async (tx) => {
      if (args.isDefault) {
        await tx.warehouse.updateMany({
          where: { companyId: args.companyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const warehouse = await tx.warehouse.create({
        data: {
          companyId: args.companyId,
          name,
          code,
          locationLabel: args.locationLabel?.trim() || null,
          isDefault: Boolean(args.isDefault),
          isActive: true,
        },
      });

      return warehouse;
    });
  }

  async updateWarehouse(args: {
    companyId: string;
    warehouseId: string;
    name?: string;
    code?: string;
    locationLabel?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: args.warehouseId, companyId: args.companyId },
    });
    if (!warehouse) {
      throw new UnprocessableEntityException('Warehouse not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (args.isDefault) {
        await tx.warehouse.updateMany({
          where: {
            companyId: args.companyId,
            isDefault: true,
            id: { not: args.warehouseId },
          },
          data: { isDefault: false },
        });
      }

      const updated = await tx.warehouse.update({
        where: { id: args.warehouseId },
        data: {
          name: args.name?.trim() || undefined,
          code: args.code?.trim().toUpperCase() || undefined,
          locationLabel:
            args.locationLabel === undefined
              ? undefined
              : args.locationLabel?.trim() || null,
          isDefault: args.isDefault ?? undefined,
          isActive: args.isActive ?? undefined,
        },
      });

      return updated;
    });
  }

  async warehouseStock(args: {
    companyId: string;
    warehouseId: string;
    q?: string;
    page: number;
    limit: number;
  }) {
    const { companyId, warehouseId, q, page, limit } = args;
    const skip = (page - 1) * limit;

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId },
    });
    if (!warehouse) {
      throw new UnprocessableEntityException('Warehouse not found');
    }

    const where: Prisma.WarehouseStockWhereInput = {
      companyId,
      warehouseId,
      ...(q
        ? {
            product: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.warehouseStock.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              reorderLevel: true,
            },
          },
        },
        orderBy: [{ product: { name: 'asc' } }],
        skip,
        take: limit,
      }),
      this.prisma.warehouseStock.count({ where }),
    ]);

    return {
      data,
      warehouse,
      meta: { page, limit, total },
    };
  }

  async listTransfers(args: {
    companyId: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    const { companyId, page, limit, status } = args;
    const skip = (page - 1) * limit;
    const where: Prisma.StockTransferWhereInput = {
      companyId,
      ...(status ? { status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockTransfer.findMany({
        where,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
              batchAllocations: {
                include: {
                  productBatch: {
                    select: {
                      id: true,
                      batchNumber: true,
                      expiryDate: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getTransfer(args: { companyId: string; transferId: string }) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { companyId: args.companyId, id: args.transferId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, stock: true },
            },
            batchAllocations: {
              include: {
                productBatch: {
                  select: {
                    id: true,
                    batchNumber: true,
                    expiryDate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      throw new UnprocessableEntityException('Stock transfer not found');
    }

    return transfer;
  }

  async createTransfer(args: {
    companyId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    transferDate?: Date;
    notes?: string;
    items: Array<{ productId: string; quantity: Decimal }>;
  }) {
    if (!args.items.length) {
      throw new UnprocessableEntityException(
        'Transfer must have at least one item',
      );
    }
    if (args.fromWarehouseId === args.toWarehouseId) {
      throw new UnprocessableEntityException(
        'Source and destination warehouses must be different',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const [fromWarehouse, toWarehouse] = await Promise.all([
        tx.warehouse.findFirst({
          where: {
            id: args.fromWarehouseId,
            companyId: args.companyId,
            isActive: true,
          },
        }),
        tx.warehouse.findFirst({
          where: {
            id: args.toWarehouseId,
            companyId: args.companyId,
            isActive: true,
          },
        }),
      ]);

      if (!fromWarehouse || !toWarehouse) {
        throw new UnprocessableEntityException('Warehouse not found');
      }

      const productIds = args.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          companyId: args.companyId,
          id: { in: productIds },
          deletedAt: null,
        },
      });
      if (products.length !== productIds.length) {
        throw new UnprocessableEntityException('One or more products not found');
      }

      const transfer = await tx.stockTransfer.create({
        data: {
          companyId: args.companyId,
          fromWarehouseId: args.fromWarehouseId,
          toWarehouseId: args.toWarehouseId,
          transferNumber: `TR-${Date.now()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
          transferDate: args.transferDate ?? new Date(),
          notes: args.notes ?? null,
          status: 'requested',
          items: {
            create: args.items.map((item) => ({
              companyId: args.companyId,
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
              batchAllocations: {
                include: {
                  productBatch: {
                    select: {
                      id: true,
                      batchNumber: true,
                      expiryDate: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return transfer;
    });
  }

  async dispatchTransfer(args: { companyId: string; transferId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({
        where: { companyId: args.companyId, id: args.transferId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  batchTrackingEnabled: true,
                },
              },
              batchAllocations: true,
            },
          },
        },
      });
      if (!transfer) {
        throw new UnprocessableEntityException('Stock transfer not found');
      }
      if (transfer.status !== 'requested') {
        throw new UnprocessableEntityException(
          'Only requested transfers can be dispatched',
        );
      }

      for (const item of transfer.items) {
        if (item.product.batchTrackingEnabled) {
          await this.allocateTransferItemBatches({
            tx,
            companyId: args.companyId,
            warehouseId: transfer.fromWarehouseId,
            stockTransferItemId: item.id,
            productId: item.productId,
            quantity: new Decimal(item.quantity),
          });
        }
        await this.moveWarehouseStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          fromWarehouseId: transfer.fromWarehouseId,
          quantity: new Decimal(item.quantity),
          sourceId: transfer.id,
          note: `Transfer ${transfer.transferNumber} dispatched`,
        });
      }

      return tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'dispatched',
          dispatchedAt: new Date(),
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
              batchAllocations: {
                include: {
                  productBatch: {
                    select: {
                      id: true,
                      batchNumber: true,
                      expiryDate: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });
  }

  async receiveTransfer(args: { companyId: string; transferId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({
        where: { companyId: args.companyId, id: args.transferId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  batchTrackingEnabled: true,
                },
              },
              batchAllocations: true,
            },
          },
        },
      });
      if (!transfer) {
        throw new UnprocessableEntityException('Stock transfer not found');
      }
      if (transfer.status !== 'dispatched') {
        throw new UnprocessableEntityException(
          'Only dispatched transfers can be received',
        );
      }

      for (const item of transfer.items) {
        if (item.product.batchTrackingEnabled && item.batchAllocations.length > 0) {
          await this.receiveTransferItemBatches({
            tx,
            companyId: args.companyId,
            warehouseId: transfer.toWarehouseId,
            allocations: item.batchAllocations.map((allocation) => ({
              productBatchId: allocation.productBatchId,
              quantity: new Decimal(allocation.quantity),
            })),
          });
        }
        await this.moveWarehouseStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          toWarehouseId: transfer.toWarehouseId,
          quantity: new Decimal(item.quantity),
          sourceId: transfer.id,
          note: `Transfer ${transfer.transferNumber} received`,
        });
      }

      return tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'received',
          receivedAt: new Date(),
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      });
    });
  }

  async cancelTransfer(args: { companyId: string; transferId: string }) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { companyId: args.companyId, id: args.transferId },
    });
    if (!transfer) {
      throw new UnprocessableEntityException('Stock transfer not found');
    }
    if (!['requested', 'dispatched'].includes(transfer.status)) {
      throw new UnprocessableEntityException(
        'Only requested or dispatched transfers can be cancelled',
      );
    }
    if (transfer.status === 'dispatched') {
      throw new UnprocessableEntityException(
        'Dispatched transfers must be received before reconciliation',
      );
    }

    return this.prisma.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: 'cancelled' },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });
  }
}
