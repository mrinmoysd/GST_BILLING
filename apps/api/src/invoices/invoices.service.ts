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
import { InvoiceNumberService } from './invoice-number.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { ShareInvoiceDto } from './dto/share-invoice.dto';
import { GstService } from '../gst/gst.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { PricingService } from '../pricing/pricing.service';
import { InvoiceComplianceService } from './invoice-compliance.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';

function toDecimal(value: string | undefined, fallback = '0'): Decimal {
  const v = (value ?? fallback).trim();
  return new Decimal(v);
}

function extractLegacyFreeQuantity(snapshot: unknown): Decimal {
  if (!snapshot || typeof snapshot !== 'object') return new Decimal(0);
  const raw = (snapshot as Record<string, unknown>).free_quantity;
  if (raw === null || raw === undefined || raw === '') return new Decimal(0);
  return new Decimal(String(raw));
}

function extractPreferredBatchAllocations(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const raw = (snapshot as Record<string, unknown>).preferred_batch_allocations;
  if (!Array.isArray(raw)) return [];
  const allocations: Array<{ productBatchId: string; quantity?: Decimal }> = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const productBatchId = (entry as Record<string, unknown>).product_batch_id;
    const quantity = (entry as Record<string, unknown>).quantity;
    if (typeof productBatchId !== 'string' || !productBatchId) continue;
    allocations.push({
      productBatchId,
      quantity:
        quantity === null || quantity === undefined || quantity === ''
          ? undefined
          : new Decimal(String(quantity)),
    });
  }
  return allocations;
}

function resolveTotalQuantityForStock(item: {
  quantity: Decimal;
  totalQuantity?: Decimal | null;
  pricingSnapshot?: unknown;
}) {
  const storedTotal = item.totalQuantity ? new Decimal(item.totalQuantity) : new Decimal(0);
  if (storedTotal.gt(0)) return storedTotal;
  return new Decimal(item.quantity).add(extractLegacyFreeQuantity(item.pricingSnapshot));
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceNumber: InvoiceNumberService,
    private readonly inventory: InventoryService,
    private readonly gst: GstService,
    private readonly idempotency: IdempotencyService,
    private readonly accounting: AccountingService,
    private readonly pricing: PricingService,
    private readonly compliance: InvoiceComplianceService,
    private readonly salesOrders: SalesOrdersService,
  ) {}

  private async resolveSalespersonUserId(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    customerSalespersonUserId?: string | null;
    explicitSalespersonUserId?: string | null;
  }) {
    const candidateId =
      args.explicitSalespersonUserId ?? args.customerSalespersonUserId ?? null;
    if (!candidateId) return null;

    const salesperson = await args.tx.user.findFirst({
      where: {
        id: candidateId,
        companyId: args.companyId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!salesperson) throw new NotFoundException('Salesperson not found');
    return salesperson.id;
  }

  private async evaluateCreditControl(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    customerId: string;
    draftInvoiceId: string;
    nextInvoiceTotal: Decimal;
    overrideReason?: string | null;
  }) {
    const customer = await args.tx.customer.findFirst({
      where: {
        id: args.customerId,
        companyId: args.companyId,
        deletedAt: null,
      },
      select: {
        creditLimit: true,
        creditDays: true,
        creditControlMode: true,
        creditWarningPercent: true,
        creditBlockPercent: true,
        creditHold: true,
        creditHoldReason: true,
        creditOverrideUntil: true,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const openInvoices = await args.tx.invoice.findMany({
      where: {
        companyId: args.companyId,
        customerId: args.customerId,
        id: { not: args.draftInvoiceId },
        status: { in: ['issued', 'paid'] },
        balanceDue: { gt: 0 },
      },
      select: {
        dueDate: true,
        balanceDue: true,
      },
    });

    const openExposure = openInvoices.reduce(
      (acc, invoice) => acc.add(invoice.balanceDue),
      new Decimal(0),
    );
    const projectedExposure = openExposure.add(args.nextInvoiceTotal);
    const warnings: string[] = [];
    const activeOverride =
      customer.creditOverrideUntil &&
      customer.creditOverrideUntil.getTime() >= Date.now();

    if (customer.creditHold && !activeOverride && !args.overrideReason?.trim()) {
      throw new BadRequestException(
        customer.creditHoldReason || 'Customer is on credit hold',
      );
    }

    if (customer.creditLimit) {
      const warningThreshold = new Decimal(customer.creditLimit)
        .mul(customer.creditWarningPercent)
        .div(100);
      const blockThreshold = new Decimal(customer.creditLimit)
        .mul(customer.creditBlockPercent)
        .div(100);

      if (projectedExposure.gte(warningThreshold)) {
        warnings.push(
          `Projected exposure ${projectedExposure.toFixed(2)} crosses warning threshold`,
        );
      }

      if (
        projectedExposure.gte(blockThreshold) &&
        !activeOverride &&
        !args.overrideReason?.trim()
      ) {
        throw new BadRequestException(
          `Projected exposure ${projectedExposure.toFixed(2)} exceeds credit limit policy`,
        );
      }
    }

    if (customer.creditDays && customer.creditDays > 0) {
      const now = Date.now();
      const maxOverdueDays = openInvoices.reduce((acc, invoice) => {
        if (!invoice.dueDate) return acc;
        const dueAt = new Date(invoice.dueDate).getTime();
        if (!Number.isFinite(dueAt) || dueAt >= now) return acc;
        const days = Math.floor((now - dueAt) / 86_400_000);
        return Math.max(acc, days);
      }, 0);

      if (maxOverdueDays > customer.creditDays) {
        const message = `Customer overdue by ${maxOverdueDays} days exceeds allowed credit days`;
        warnings.push(message);
        if (!activeOverride && !args.overrideReason?.trim()) {
          throw new BadRequestException(message);
        }
      }
    }

    return {
      projectedExposure,
      warnings,
      overrideApplied: Boolean(args.overrideReason?.trim()),
    };
  }

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
              { invoiceNumber: { contains: args.q, mode: 'insensitive' } },
              { customer: { name: { contains: args.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(args.from || args.to
        ? {
            issueDate: {
              ...(args.from ? { gte: new Date(args.from) } : {}),
              ...(args.to ? { lte: new Date(args.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
        include: {
          customer: true,
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, page: args.page, limit: args.limit, total };
  }

  async get(args: { companyId: string; invoiceId: string }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: args.invoiceId, companyId: args.companyId },
      include: {
        items: { include: { product: true } },
        customer: true,
        salesperson: {
          select: { id: true, name: true, email: true, role: true },
        },
        creditNotes: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
        },
        shares: { orderBy: { createdAt: 'desc' } },
        lifecycleEvents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return { data: invoice };
  }

  async createDraft(args: {
    companyId: string;
    createdByUserId?: string | null;
    dto: CreateInvoiceDto;
    idempotencyKey?: string;
  }) {
    if (!args.dto.items?.length) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    const route = 'POST:/api/companies/:companyId/invoices';

    const out = await this.idempotency.run({
      companyId: args.companyId,
      route,
      key: args.idempotencyKey,
      requestBody: args.dto,
      action: async () => {
        const body = await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const customer = await tx.customer.findFirst({
              where: {
                id: args.dto.customer_id,
                companyId: args.companyId,
                deletedAt: null,
              },
            });
            if (!customer) throw new NotFoundException('Customer not found');
            const salespersonUserId = await this.resolveSalespersonUserId({
              tx,
              companyId: args.companyId,
              customerSalespersonUserId: customer.salespersonUserId,
              explicitSalespersonUserId: args.dto.salesperson_user_id,
            });

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

            const gstContext = await this.gst.resolveSalesContext(
              args.companyId,
              customer.id,
            );

            // Validate products & compute totals.
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

            const itemsComputed = await Promise.all(args.dto.items.map(async (item) => {
              const quantity = toDecimal(item.quantity);
              const unitPrice = toDecimal(item.unit_price);
              const discount = toDecimal(item.discount, '0');
              if (quantity.lte(0))
                throw new BadRequestException('quantity must be > 0');
              if (unitPrice.lt(0))
                throw new BadRequestException('unit_price must be >= 0');
              if (discount.lt(0))
                throw new BadRequestException('discount must be >= 0');

              const lineSubTotal = quantity.mul(unitPrice).sub(discount);
              const product = products.find(
                (p: (typeof products)[number]) => p.id === item.product_id,
              )!;
              const resolvedPricing = await this.pricing.resolveLine({
                tx,
                companyId: args.companyId,
                customerId: customer.id,
                productId: item.product_id,
                quantity,
                documentDate: args.dto.issue_date
                  ? new Date(args.dto.issue_date)
                  : undefined,
                documentType: 'invoice',
              });
              const resolvedCommercial = await this.pricing.resolveCommercialLine({
                tx,
                companyId: args.companyId,
                customerId: customer.id,
                productId: item.product_id,
                quantity,
                documentDate: args.dto.issue_date
                  ? new Date(args.dto.issue_date)
                  : undefined,
                documentType: 'invoice',
              });
              const guardrails = await this.pricing.evaluateCommercialGuardrails({
                tx,
                companyId: args.companyId,
                quantity,
                resolvedUnitPrice: resolvedPricing.resolvedUnitPrice,
                resolvedDiscount: resolvedCommercial.resolvedDiscount,
                enteredUnitPrice: unitPrice,
                enteredDiscount: discount,
                costPrice: product.costPrice,
                overrideReason: item.override_reason,
              });
              const taxRate = product.taxRate;
              const split = this.gst.computeTaxSplit({
                companyStateCode: gstContext.companyStateCode,
                placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
                taxableValue: lineSubTotal,
                taxRate,
              });
              const lineTaxTotal = split.taxTotal;
              const lineTotal = lineSubTotal.add(lineTaxTotal);
              const freeQuantity = resolvedCommercial.freeQuantity;
              const totalQuantity = quantity.add(freeQuantity);
              const preferredBatchAllocations = (item.batch_allocations ?? []).map(
                (allocation) => ({
                  product_batch_id: allocation.product_batch_id,
                  quantity: allocation.quantity,
                }),
              );
              if (
                preferredBatchAllocations.length > 0 &&
                !args.dto.warehouse_id
              ) {
                throw new BadRequestException(
                  'warehouse_id is required when batch_allocations are provided',
                );
              }
              const preferredBatchTotal = preferredBatchAllocations.reduce(
                (acc, allocation) => acc.add(new Decimal(allocation.quantity)),
                new Decimal(0),
              );
              if (preferredBatchTotal.gt(totalQuantity)) {
                throw new BadRequestException(
                  'Preferred batch allocation exceeds invoice line quantity',
                );
              }

              return {
                productId: item.product_id,
                hsnCode: product.hsn,
                quantity,
                freeQuantity,
                totalQuantity,
                unitPrice,
                discount,
                pricingSource:
                  guardrails.hasCommercialOverride
                    ? 'manual_override'
                    : resolvedPricing.source,
                pricingSnapshot: {
                  ...resolvedCommercial.snapshot,
                  entered_unit_price: unitPrice.toString(),
                  entered_discount: discount.toString(),
                  override_reason: guardrails.overrideReason,
                  warnings: guardrails.warnings,
                  policy: guardrails.policy,
                  effective_discount_percent:
                    guardrails.effectiveDiscountPercent.toString(),
                  margin_percent: guardrails.marginPercent?.toString() ?? null,
                  applied_schemes: resolvedCommercial.appliedSchemes,
                  resolved_discount: resolvedCommercial.resolvedDiscount.toString(),
                  free_quantity: resolvedCommercial.freeQuantity.toString(),
                  preferred_batch_allocations:
                    preferredBatchAllocations.length > 0
                      ? preferredBatchAllocations
                      : undefined,
                  override:
                    guardrails.hasCommercialOverride
                      ? {
                          type: 'commercial_override',
                          resolved_unit_price:
                            resolvedPricing.resolvedUnitPrice.toString(),
                          entered_unit_price: unitPrice.toString(),
                          override_reason: guardrails.overrideReason,
                        }
                      : null,
                },
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
            }));

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

            const invoiceData = {
                companyId: args.companyId,
                customerId: customer.id,
                salespersonUserId,
                status: 'draft',
                customerGstin: gstContext.customerGstin,
                placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
                warehouseId: args.dto.warehouse_id ?? null,
                issueDate: args.dto.issue_date
                  ? new Date(args.dto.issue_date)
                  : null,
                dueDate: args.dto.due_date ? new Date(args.dto.due_date) : null,
                notes: args.dto.idempotency_key
                  ? `[idempotency:${args.dto.idempotency_key}] ${args.dto.notes ?? ''}`.trim()
                  : args.dto.notes,
                subTotal,
                taxTotal,
                total,
                amountPaid: new Decimal(0),
                balanceDue: total,
                items: {
                  create: itemsComputed.map((i) => ({
                    companyId: args.companyId,
                    productId: i.productId,
                    hsnCode: i.hsnCode,
                    quantity: i.quantity,
                    freeQuantity: i.freeQuantity,
                    totalQuantity: i.totalQuantity,
                    unitPrice: i.unitPrice,
                    discount: i.discount,
                    pricingSource: i.pricingSource,
                    pricingSnapshot: i.pricingSnapshot as Prisma.InputJsonValue,
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
              } satisfies Prisma.InvoiceUncheckedCreateInput;

            const invoice = await tx.invoice.create({
              data: invoiceData,
              include: { items: true },
            });

            await this.pricing.createCommercialAuditLogs({
              tx,
              companyId: args.companyId,
              actorUserId: args.createdByUserId,
              documentType: 'invoice',
              documentId: invoice.id,
              rows: invoice.items.map((item) => ({
                documentLineId: item.id,
                customerId: invoice.customerId,
                productId: item.productId,
                pricingSource: item.pricingSource,
                action:
                  item.pricingSource === 'manual_override'
                    ? 'manual_override'
                    : 'resolved_pricing',
                overrideReason:
                  (item.pricingSnapshot as Record<string, unknown> | null)
                    ?.override_reason as string | null | undefined,
                warnings:
                  (item.pricingSnapshot as Record<string, unknown> | null)
                    ?.warnings,
                snapshot: item.pricingSnapshot as Prisma.InputJsonValue,
              })),
            });

            await this.createLifecycleEvent(tx, {
              companyId: args.companyId,
              invoiceId: invoice.id,
              eventType: 'invoice.draft_created',
              summary: 'Draft invoice created',
              payload: {
                item_count: invoice.items.length,
                total: invoice.total.toString(),
              },
            });

            return { data: invoice };
          },
        );

        return { status: 201, body, data: body.data };
      },
    });

    return out.body;
  }

  async patchDraft(args: {
    companyId: string;
    invoiceId: string;
    patch: Partial<{ notes: string; due_date: string; issue_date: string }>;
  }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: args.invoiceId, companyId: args.companyId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'draft') {
      throw new ConflictException('Only draft invoices can be updated');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        notes: args.patch.notes ?? undefined,
        dueDate: args.patch.due_date
          ? new Date(args.patch.due_date)
          : undefined,
        issueDate: args.patch.issue_date
          ? new Date(args.patch.issue_date)
          : undefined,
      },
    });

    return { data: updated };
  }

  async issue(args: {
    companyId: string;
    invoiceId: string;
    seriesCode?: string;
    creditOverrideReason?: string | null;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice: any = await tx.invoice.findFirst({
        where: { id: args.invoiceId, companyId: args.companyId },
        include: {
          items: {
            include: {
              batchAllocations: true,
              product: {
                select: {
                  costPrice: true,
                  batchTrackingEnabled: true,
                },
              },
            },
          },
        } as any,
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status !== 'draft') {
        throw new ConflictException('Only draft invoices can be issued');
      }

      const creditDecision = await this.evaluateCreditControl({
        tx,
        companyId: args.companyId,
        customerId: invoice.customerId,
        draftInvoiceId: invoice.id,
        nextInvoiceTotal: new Decimal(invoice.total),
        overrideReason: args.creditOverrideReason,
      });

      const { seriesId, invoiceNumber } =
        await this.invoiceNumber.reserveNextInvoiceNumber({
          tx,
          companyId: args.companyId,
          seriesCode: args.seriesCode,
        });

      // Decrement stock per invoice item.
      for (const item of invoice.items) {
        const stockQuantity = resolveTotalQuantityForStock(item);
        if (item.product?.batchTrackingEnabled) {
          await this.inventory.allocateInvoiceItemBatches({
            tx,
            companyId: args.companyId,
            warehouseId: invoice.warehouseId ?? undefined,
            invoiceItemId: item.id,
            productId: item.productId,
            quantity: stockQuantity,
            preferredAllocations: extractPreferredBatchAllocations(
              item.pricingSnapshot,
            ),
          });
        }
        await this.inventory.adjustStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          delta: stockQuantity.mul(-1),
          note: `Invoice ${invoiceNumber}`,
          sourceType: 'invoice',
          sourceId: invoice.id,
          warehouseId: invoice.warehouseId ?? undefined,
        });
      }

      if (invoice.salesOrderId) {
        await this.salesOrders.reverseFulfillment({
          tx,
          companyId: args.companyId,
          salesOrderId: invoice.salesOrderId,
          invoiceItems: invoice.items.map((item: any) => ({
            salesOrderItemId: item.salesOrderItemId ?? null,
            quantity: new Decimal(item.quantity),
          })),
        });
      }

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'issued',
          seriesId,
          invoiceNumber,
          issueDate: invoice.issueDate ?? new Date(),
        },
      });

      await this.accounting.postInvoiceIssued(tx, {
        companyId: args.companyId,
        invoice: {
          id: invoice.id,
          invoiceNumber,
          issueDate: updated.issueDate,
          total: invoice.total,
          subTotal: invoice.subTotal,
          items: invoice.items,
        },
      });

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        invoiceId: invoice.id,
        eventType: 'invoice.issued',
        summary: `Invoice issued as ${invoiceNumber}`,
        payload: {
          invoice_number: invoiceNumber,
          series_id: seriesId,
          credit_control: {
            warnings: creditDecision.warnings,
            projected_exposure: creditDecision.projectedExposure.toString(),
            override_reason: args.creditOverrideReason ?? null,
          },
        },
      });

      return { data: updated };
    });
  }

  async cancel(args: { companyId: string; invoiceId: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice: any = await tx.invoice.findFirst({
        where: { id: args.invoiceId, companyId: args.companyId },
        include: {
          items: {
            include: {
              batchAllocations: true,
              product: {
                select: {
                  costPrice: true,
                  batchTrackingEnabled: true,
                },
              },
            },
          },
        } as any,
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status !== 'issued') {
        throw new ConflictException('Only issued invoices can be cancelled');
      }

      const hasPayments = await tx.payment.count({
        where: { companyId: args.companyId, invoiceId: invoice.id },
      });
      if (hasPayments > 0) {
        throw new ConflictException(
          'Cannot cancel invoice with payments (void payments first)',
        );
      }

      await this.compliance.assertNoActiveComplianceForInvoiceCancellation({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
      });

      // Reverse stock.
      for (const item of invoice.items) {
        const stockQuantity = resolveTotalQuantityForStock(item);
        if (item.product?.batchTrackingEnabled && item.batchAllocations?.length) {
          await this.inventory.restoreInvoiceItemBatches({
            tx,
            companyId: args.companyId,
            warehouseId: invoice.warehouseId ?? undefined,
            allocations: item.batchAllocations.map((allocation: any) => ({
              productBatchId: allocation.productBatchId,
              quantity: new Decimal(allocation.quantity),
            })),
          });
        }
        await this.inventory.adjustStock({
          tx,
          companyId: args.companyId,
          productId: item.productId,
          delta: stockQuantity,
          note: `Invoice cancel ${invoice.invoiceNumber ?? invoice.id}`,
          sourceType: 'invoice_cancel',
          sourceId: invoice.id,
          warehouseId: invoice.warehouseId ?? undefined,
        });
      }

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      await this.accounting.postInvoiceCancelled(tx, {
        companyId: args.companyId,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          cancelledAt: updated.cancelledAt,
          total: invoice.total,
          subTotal: invoice.subTotal,
          items: invoice.items,
        },
      });

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        invoiceId: invoice.id,
        eventType: 'invoice.cancelled',
        summary: `Invoice ${invoice.invoiceNumber ?? invoice.id} cancelled`,
      });

      return { data: updated };
    });
  }

  async createCreditNote(args: {
    companyId: string;
    invoiceId: string;
    dto: CreateCreditNoteDto;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: args.invoiceId, companyId: args.companyId },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              totalQuantity: true,
              pricingSnapshot: true,
              unitPrice: true,
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
          creditNotes: {
            include: {
              items: {
                select: {
                  invoiceItemId: true,
                  productId: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (!['issued', 'paid', 'credited_partial', 'credited'].includes(invoice.status)) {
        throw new ConflictException(
          'Credit notes are only allowed for issued or settled invoices',
        );
      }
      if (!args.dto.items?.length) {
        throw new BadRequestException('Credit note must have at least one item');
      }

      const priorCreditedByItem = new Map<string, Decimal>();
      for (const creditNote of invoice.creditNotes) {
        for (const item of creditNote.items) {
          const key = item.invoiceItemId ?? `${item.productId}`;
          const current = priorCreditedByItem.get(key) ?? new Decimal(0);
          priorCreditedByItem.set(key, current.add(new Decimal(item.quantity)));
        }
      }

      const computedItems = args.dto.items.map((item) => {
        const invoiceItem =
          (item.invoice_item_id
            ? invoice.items.find((candidate) => candidate.id === item.invoice_item_id)
            : invoice.items.find((candidate) => candidate.productId === item.product_id)) ??
          null;

        if (!invoiceItem) {
          throw new BadRequestException('Invoice item not found for credit note');
        }

        const quantity = toDecimal(item.quantity);
        if (quantity.lte(0)) {
          throw new BadRequestException('quantity must be > 0');
        }

        const alreadyCredited =
          priorCreditedByItem.get(invoiceItem.id) ??
          priorCreditedByItem.get(String(invoiceItem.productId)) ??
          new Decimal(0);
        const available = new Decimal(invoiceItem.quantity).sub(alreadyCredited);
        if (quantity.gt(available)) {
          throw new BadRequestException(
            `Requested quantity exceeds available credited quantity for product ${invoiceItem.productId}`,
          );
        }

        const perUnitSubTotal = new Decimal(invoiceItem.lineSubTotal).div(
          invoiceItem.quantity,
        );
        const perUnitTaxTotal = new Decimal(invoiceItem.lineTaxTotal).div(
          invoiceItem.quantity,
        );
        const perUnitTaxableValue = new Decimal(invoiceItem.taxableValue).div(
          invoiceItem.quantity,
        );
        const perUnitCgst = new Decimal(invoiceItem.cgstAmount).div(
          invoiceItem.quantity,
        );
        const perUnitSgst = new Decimal(invoiceItem.sgstAmount).div(
          invoiceItem.quantity,
        );
        const perUnitIgst = new Decimal(invoiceItem.igstAmount).div(
          invoiceItem.quantity,
        );
        const perUnitCess = new Decimal(invoiceItem.cessAmount).div(
          invoiceItem.quantity,
        );
        const lineSubTotal = perUnitSubTotal.mul(quantity);
        const lineTaxTotal = perUnitTaxTotal.mul(quantity);
        const lineTotal = lineSubTotal.add(lineTaxTotal);
        const stockQuantity = resolveTotalQuantityForStock({
          quantity: new Decimal(invoiceItem.quantity),
          totalQuantity: invoiceItem.totalQuantity
            ? new Decimal(invoiceItem.totalQuantity)
            : null,
          pricingSnapshot: invoiceItem.pricingSnapshot,
        }).mul(quantity.div(invoiceItem.quantity));

        return {
          invoiceItemId: invoiceItem.id,
          productId: invoiceItem.productId,
          quantity,
          stockQuantity,
              unitPrice: new Decimal(invoiceItem.unitPrice),
              hsnCode: invoiceItem.hsnCode,
              taxRate: invoiceItem.taxRate,
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

      const noteNumber = `CN-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;

      const creditNoteData = {
          companyId: args.companyId,
          invoiceId: invoice.id,
          kind: args.dto.kind ?? (args.dto.restock ? 'sales_return' : 'credit_note'),
          noteNumber,
          noteDate: args.dto.note_date ? new Date(args.dto.note_date) : new Date(),
          notes: args.dto.notes ?? null,
          restock: Boolean(args.dto.restock),
          subTotal,
          taxTotal,
          total,
          items: {
            create: computedItems.map((item) => ({
              companyId: args.companyId,
              invoiceItemId: item.invoiceItemId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
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
        } satisfies Prisma.DocumentCreditNoteUncheckedCreateInput;

      const creditNote: any = await tx.documentCreditNote.create({
        data: creditNoteData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true,
                },
              },
            },
          },
        } as any,
      });

      if (creditNote.restock) {
        for (const item of computedItems) {
          await this.inventory.adjustStock({
            tx,
            companyId: args.companyId,
            productId: item.productId,
            delta: item.stockQuantity,
            sourceType: 'credit_note',
            sourceId: creditNote.id,
            note: `Credit note ${creditNote.noteNumber}`,
            warehouseId: invoice.warehouseId ?? undefined,
          });
        }
      }

      const creditedStatus = this.deriveInvoiceStatusAfterCredit({
        invoiceItems: invoice.items.map((item) => ({
          id: item.id,
          quantity: new Decimal(item.quantity),
        })),
        priorCreditNotes: invoice.creditNotes.flatMap((credit) => credit.items),
        nextItems: computedItems.map((item) => ({
          invoiceItemId: item.invoiceItemId,
          quantity: item.quantity,
        })),
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: creditedStatus,
        },
      });

      await this.accounting.postCreditNote(tx, {
        companyId: args.companyId,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
        creditNote: {
          id: creditNote.id,
          noteNumber: creditNote.noteNumber,
          noteDate: creditNote.noteDate,
          total: creditNote.total,
          subTotal: creditNote.subTotal,
          restock: creditNote.restock,
          items: creditNote.items,
        },
      });

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        invoiceId: invoice.id,
        eventType: 'invoice.credit_noted',
        summary: `${creditNote.kind === 'sales_return' ? 'Sales return' : 'Credit note'} ${creditNote.noteNumber} created`,
        payload: {
          credit_note_id: creditNote.id,
          note_number: creditNote.noteNumber,
          total: creditNote.total.toString(),
          restock: creditNote.restock,
        },
      });

      return { data: creditNote };
    });
  }

  async shareInvoice(args: {
    companyId: string;
    invoiceId: string;
    dto: ShareInvoiceDto;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: args.invoiceId, companyId: args.companyId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (!['issued', 'paid', 'credited_partial', 'credited'].includes(invoice.status)) {
        throw new ConflictException('Only issued invoices can be shared');
      }

      const share = await tx.documentShare.create({
        data: {
          companyId: args.companyId,
          invoiceId: invoice.id,
          channel: args.dto.channel,
          recipient: args.dto.recipient,
          message: args.dto.message ?? null,
          status: 'logged',
          sentAt: new Date(),
        },
      });

      await this.createLifecycleEvent(tx, {
        companyId: args.companyId,
        invoiceId: invoice.id,
        eventType: 'invoice.shared',
        summary: `Invoice shared via ${share.channel} to ${share.recipient}`,
        payload: {
          share_id: share.id,
          recipient: share.recipient,
          channel: share.channel,
        },
      });

      return {
        data: {
          share,
          pdf_url: invoice.pdfUrl ?? `/api/companies/${args.companyId}/invoices/${invoice.id}/pdf`,
        },
      };
    });
  }

  private deriveInvoiceStatusAfterCredit(args: {
    invoiceItems: Array<{ id: string; quantity: Decimal }>;
    priorCreditNotes: Array<{ invoiceItemId: string | null; productId: string; quantity: Decimal }>;
    nextItems: Array<{ invoiceItemId: string; quantity: Decimal }>;
  }) {
    const creditedByItem = new Map<string, Decimal>();
    for (const item of args.priorCreditNotes) {
      if (!item.invoiceItemId) continue;
      const current = creditedByItem.get(item.invoiceItemId) ?? new Decimal(0);
      creditedByItem.set(item.invoiceItemId, current.add(new Decimal(item.quantity)));
    }
    for (const item of args.nextItems) {
      const current = creditedByItem.get(item.invoiceItemId) ?? new Decimal(0);
      creditedByItem.set(item.invoiceItemId, current.add(item.quantity));
    }

    const fullyCredited = args.invoiceItems.every((item) => {
      const credited = creditedByItem.get(item.id) ?? new Decimal(0);
      return credited.gte(item.quantity);
    });

    return fullyCredited ? 'credited' : 'credited_partial';
  }

  private async createLifecycleEvent(
    tx: Prisma.TransactionClient,
    args: {
      companyId: string;
      invoiceId?: string;
      purchaseId?: string;
      eventType: string;
      summary: string;
      payload?: Prisma.InputJsonValue;
    },
  ) {
    await tx.documentLifecycleEvent.create({
      data: {
        companyId: args.companyId,
        invoiceId: args.invoiceId,
        purchaseId: args.purchaseId,
        eventType: args.eventType,
        summary: args.summary,
        payload: args.payload,
      },
    });
  }
}
