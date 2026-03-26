import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { GstService } from '../gst/gst.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrderFulfillmentItemDto } from './dto/convert-sales-order-to-invoice.dto';

function toDecimal(value: string | undefined, fallback = '0'): Decimal {
  return new Decimal((value ?? fallback).trim());
}

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gst: GstService,
    private readonly pricing: PricingService,
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
    const where = {
      companyId: args.companyId,
      ...(args.status ? { status: args.status } : {}),
      ...(args.q
        ? {
            OR: [
              { orderNumber: { contains: args.q, mode: 'insensitive' as const } },
              { customer: { name: { contains: args.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(args.from || args.to
        ? {
            orderDate: {
              ...(args.from ? { gte: new Date(args.from) } : {}),
              ...(args.to ? { lte: new Date(args.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.salesOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
        include: {
          customer: true,
          quotation: true,
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return { data, page: args.page, limit: args.limit, total };
  }

  async get(args: { companyId: string; salesOrderId: string }) {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { companyId: args.companyId, id: args.salesOrderId },
      include: {
        customer: true,
        quotation: true,
        salesperson: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: { include: { product: true, invoiceItems: { include: { invoice: true } } } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!salesOrder) throw new NotFoundException('Sales order not found');
    return { data: salesOrder };
  }

  async create(args: {
    companyId: string;
    dto: CreateSalesOrderDto;
    actorUserId?: string | null;
  }) {
    if (!args.dto.items?.length) {
      throw new BadRequestException('Sales order must have at least one item');
    }

    const created = await this.prisma.$transaction(async (tx) => {
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

      const quotation = args.dto.quotation_id
        ? await tx.quotation.findFirst({
            where: { id: args.dto.quotation_id, companyId: args.companyId },
          })
        : null;
      if (args.dto.quotation_id && !quotation) {
        throw new NotFoundException('Quotation not found');
      }

      const computed = await this.computeItems({
        tx,
        companyId: args.companyId,
        customerId: customer.id,
        documentDate: args.dto.order_date,
        items: args.dto.items,
      });

      const orderNumber = await this.nextOrderNumber(tx, args.companyId);

      const order = await tx.salesOrder.create({
        data: {
          companyId: args.companyId,
          customerId: customer.id,
          salespersonUserId,
          quotationId: quotation?.id,
          orderNumber,
          orderDate: args.dto.order_date ? new Date(args.dto.order_date) : null,
          expectedDispatchDate: args.dto.expected_dispatch_date
            ? new Date(args.dto.expected_dispatch_date)
            : null,
          notes: args.dto.notes,
          subTotal: computed.subTotal,
          taxTotal: computed.taxTotal,
          total: computed.total,
          items: {
            create: computed.items.map((item) => ({
              companyId: args.companyId,
              productId: item.productId,
              quantityOrdered: item.quantity,
              freeQuantity: item.freeQuantity,
              totalQuantity: item.totalQuantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              pricingSource: item.pricingSource,
              pricingSnapshot: item.pricingSnapshot as Prisma.InputJsonValue,
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
        },
        include: {
          customer: true,
          quotation: true,
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      if (quotation && quotation.status !== 'converted') {
        await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            status: 'converted',
            convertedAt: new Date(),
          },
        });
      }

      await this.pricing.createCommercialAuditLogs({
        tx,
        companyId: args.companyId,
        actorUserId: args.actorUserId,
        documentType: 'sales_order',
        documentId: order.id,
        rows: order.items.map((item) => ({
          documentLineId: item.id,
          customerId: order.customerId,
          productId: item.productId,
          pricingSource: item.pricingSource,
          action:
            item.pricingSource === 'manual_override'
              ? 'manual_override'
              : 'resolved_pricing',
          overrideReason:
            (item.pricingSnapshot as Record<string, unknown> | null)?.override_reason as
              | string
              | null
              | undefined,
          warnings:
            (item.pricingSnapshot as Record<string, unknown> | null)?.warnings,
          snapshot: item.pricingSnapshot as Prisma.InputJsonValue,
        })),
      });

      return order;
    });

    return { data: created };
  }

  async patch(args: {
    companyId: string;
    salesOrderId: string;
    dto: UpdateSalesOrderDto;
    actorUserId?: string | null;
  }) {
    const existing = await this.prisma.salesOrder.findFirst({
      where: { companyId: args.companyId, id: args.salesOrderId },
    });
    if (!existing) throw new NotFoundException('Sales order not found');
    if (existing.status !== 'draft') {
      throw new ConflictException('Only draft sales orders can be updated');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const customerId = args.dto.customer_id ?? existing.customerId;
      let customerSalespersonUserId: string | null | undefined;
      if (args.dto.customer_id) {
        const customer = await tx.customer.findFirst({
          where: { id: args.dto.customer_id, companyId: args.companyId, deletedAt: null },
        });
        if (!customer) throw new NotFoundException('Customer not found');
        customerSalespersonUserId = customer.salespersonUserId;
      } else {
        customerSalespersonUserId = existing.salespersonUserId;
      }

      const salespersonUserId =
        args.dto.salesperson_user_id !== undefined || args.dto.customer_id !== undefined
          ? await this.resolveSalespersonUserId({
              tx,
              companyId: args.companyId,
              customerSalespersonUserId,
              explicitSalespersonUserId: args.dto.salesperson_user_id,
            })
          : undefined;

      let computed:
        | Awaited<ReturnType<SalesOrdersService['computeItems']>>
        | undefined;

      if (args.dto.items) {
        if (!args.dto.items.length) {
          throw new BadRequestException('Sales order must have at least one item');
        }
        computed = await this.computeItems({
          tx,
          companyId: args.companyId,
          customerId,
          documentDate: args.dto.order_date ?? undefined,
          items: args.dto.items,
        });
        await tx.salesOrderItem.deleteMany({
          where: { salesOrderId: args.salesOrderId, companyId: args.companyId },
        });
      }

      const order = await tx.salesOrder.update({
        where: { id: args.salesOrderId },
        data: {
          customerId,
          salespersonUserId,
          orderDate:
            args.dto.order_date !== undefined
              ? args.dto.order_date
                ? new Date(args.dto.order_date)
                : null
              : undefined,
          expectedDispatchDate:
            args.dto.expected_dispatch_date !== undefined
              ? args.dto.expected_dispatch_date
                ? new Date(args.dto.expected_dispatch_date)
                : null
              : undefined,
          notes: args.dto.notes,
          subTotal: computed?.subTotal,
          taxTotal: computed?.taxTotal,
          total: computed?.total,
          items: computed
            ? {
                create: computed.items.map((item) => ({
                  companyId: args.companyId,
                  productId: item.productId,
                  quantityOrdered: item.quantity,
                  freeQuantity: item.freeQuantity,
                  totalQuantity: item.totalQuantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  pricingSource: item.pricingSource,
                  pricingSnapshot: item.pricingSnapshot as Prisma.InputJsonValue,
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
              }
            : undefined,
        },
        include: {
          customer: true,
          quotation: true,
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      if (computed) {
        await this.pricing.createCommercialAuditLogs({
          tx,
          companyId: args.companyId,
          actorUserId: args.actorUserId,
          documentType: 'sales_order',
          documentId: order.id,
          rows: order.items.map((item) => ({
            documentLineId: item.id,
            customerId: order.customerId,
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
              (item.pricingSnapshot as Record<string, unknown> | null)?.warnings,
            snapshot: item.pricingSnapshot as Prisma.InputJsonValue,
          })),
        });
      }

      return order;
    });

    return { data: updated };
  }

  async transition(args: {
    companyId: string;
    salesOrderId: string;
    status: 'confirmed' | 'cancelled';
  }) {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { companyId: args.companyId, id: args.salesOrderId },
    });
    if (!salesOrder) throw new NotFoundException('Sales order not found');
    if (salesOrder.status === 'fulfilled') {
      throw new ConflictException('Fulfilled sales orders cannot be changed');
    }
    if (args.status === 'cancelled' && ['partially_fulfilled', 'fulfilled'].includes(salesOrder.status)) {
      throw new ConflictException('Fulfilled sales orders cannot be cancelled');
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id: args.salesOrderId },
      data: { status: args.status },
      include: {
        customer: true,
        quotation: true,
        salesperson: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: { include: { product: true } },
      },
    });
    return { data: updated };
  }

  async convertToInvoice(args: {
    companyId: string;
    salesOrderId: string;
    seriesCode?: string;
    items?: SalesOrderFulfillmentItemDto[];
  }) {
    const invoice = await this.prisma.$transaction(async (tx) => {
      const salesOrder = await tx.salesOrder.findFirst({
        where: { companyId: args.companyId, id: args.salesOrderId },
        include: {
          items: true,
          customer: true,
          quotation: true,
        },
      });
      if (!salesOrder) throw new NotFoundException('Sales order not found');
      if (!['confirmed', 'partially_fulfilled'].includes(salesOrder.status)) {
        throw new ConflictException('Only confirmed or partially fulfilled orders can be converted');
      }

      const fulfillmentRequest = args.items?.length
        ? args.items.map((item) => ({
            salesOrderItemId: item.sales_order_item_id,
            quantity: toDecimal(item.quantity),
          }))
        : salesOrder.items.map((item) => ({
            salesOrderItemId: item.id,
            quantity: new Decimal(item.quantityOrdered).sub(item.quantityFulfilled),
          }));

      const selectedItems = fulfillmentRequest
        .map((requested) => {
          const item = salesOrder.items.find((entry) => entry.id === requested.salesOrderItemId);
          if (!item) throw new BadRequestException('Sales order item not found');
          const remaining = new Decimal(item.quantityOrdered).sub(item.quantityFulfilled);
          if (requested.quantity.lte(0)) {
            throw new BadRequestException('quantity must be > 0');
          }
          if (requested.quantity.gt(remaining)) {
            throw new ConflictException('Requested quantity exceeds remaining order quantity');
          }
          return { item, quantity: requested.quantity };
        })
        .filter((entry) => entry.quantity.gt(0));

      if (selectedItems.length === 0) {
        throw new BadRequestException('No convertible sales order quantity remains');
      }

      const gstContext = await this.gst.resolveSalesContext(args.companyId, salesOrder.customerId);

      let seriesId: string | undefined;
      if (args.seriesCode) {
        const series = await tx.invoiceSeries.findFirst({
          where: { companyId: args.companyId, code: args.seriesCode, isActive: true },
        });
        if (!series) throw new NotFoundException('Invoice series not found');
        seriesId = series.id;
      }

      const subTotal = selectedItems.reduce((acc, entry) => {
        const ratio = entry.quantity.div(entry.item.quantityOrdered);
        return acc.add(entry.item.lineSubTotal.mul(ratio));
      }, new Decimal(0));
      const taxTotal = selectedItems.reduce((acc, entry) => {
        const ratio = entry.quantity.div(entry.item.quantityOrdered);
        return acc.add(entry.item.lineTaxTotal.mul(ratio));
      }, new Decimal(0));
      const total = selectedItems.reduce((acc, entry) => {
        const ratio = entry.quantity.div(entry.item.quantityOrdered);
        return acc.add(entry.item.lineTotal.mul(ratio));
      }, new Decimal(0));

      const created = await tx.invoice.create({
        data: {
          companyId: args.companyId,
          customerId: salesOrder.customerId,
          salespersonUserId: salesOrder.salespersonUserId,
          quotationId: salesOrder.quotationId,
          salesOrderId: salesOrder.id,
          seriesId,
          status: 'draft',
          customerGstin: gstContext.customerGstin,
          placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
          issueDate: salesOrder.orderDate ?? new Date(),
          notes: salesOrder.notes,
          subTotal,
          taxTotal,
          total,
          amountPaid: new Decimal(0),
          balanceDue: total,
          items: {
            create: selectedItems.map(({ item, quantity }) => {
              const ratio = quantity.div(item.quantityOrdered);
              const freeQuantity = new Decimal(item.freeQuantity ?? 0).mul(ratio);
              const totalQuantity = quantity.add(freeQuantity);
              return {
                companyId: args.companyId,
                productId: item.productId,
                salesOrderItemId: item.id,
                hsnCode: item.hsnCode,
                quantity,
                freeQuantity,
                totalQuantity,
                unitPrice: item.unitPrice,
                discount: item.discount.mul(ratio),
                pricingSource: item.pricingSource,
                pricingSnapshot: item.pricingSnapshot as Prisma.InputJsonValue,
                taxRate: item.taxRate,
                taxableValue: item.taxableValue.mul(ratio),
                cgstAmount: item.cgstAmount.mul(ratio),
                sgstAmount: item.sgstAmount.mul(ratio),
                igstAmount: item.igstAmount.mul(ratio),
                cessAmount: item.cessAmount.mul(ratio),
                lineSubTotal: item.lineSubTotal.mul(ratio),
                lineTaxTotal: item.lineTaxTotal.mul(ratio),
                lineTotal: item.lineTotal.mul(ratio),
              };
            }),
          },
        },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      for (const { item, quantity } of selectedItems) {
        await tx.salesOrderItem.update({
          where: { id: item.id },
          data: {
            quantityFulfilled: item.quantityFulfilled.add(quantity),
          },
        });
      }

      const refreshedItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: salesOrder.id },
      });
      const isFulfilled = refreshedItems.every((item) =>
        new Decimal(item.quantityFulfilled).gte(item.quantityOrdered),
      );

      await tx.salesOrder.update({
        where: { id: salesOrder.id },
        data: {
          status: isFulfilled ? 'fulfilled' : 'partially_fulfilled',
        },
      });

      await tx.documentLifecycleEvent.create({
        data: {
          companyId: args.companyId,
          invoiceId: created.id,
          eventType: 'invoice.created_from_sales_order',
          summary: `Draft invoice created from sales order ${salesOrder.orderNumber ?? salesOrder.id}`,
          payload: {
            sales_order_id: salesOrder.id,
            order_number: salesOrder.orderNumber,
          },
        },
      });

      return created;
    });

    return { data: invoice };
  }

  async createFromQuotation(args: { companyId: string; quotationId: string }) {
    const created = await this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findFirst({
        where: { companyId: args.companyId, id: args.quotationId },
        include: { items: true },
      });
      if (!quotation) throw new NotFoundException('Quotation not found');
      if (quotation.status === 'converted') {
        throw new ConflictException('Quotation already converted');
      }

      const orderNumber = await this.nextOrderNumber(tx, args.companyId);
      const order = await tx.salesOrder.create({
        data: {
          companyId: args.companyId,
          customerId: quotation.customerId,
          salespersonUserId: quotation.salespersonUserId,
          quotationId: quotation.id,
          orderNumber,
          orderDate: quotation.issueDate,
          expectedDispatchDate: quotation.expiryDate,
          notes: quotation.notes,
          subTotal: quotation.subTotal,
          taxTotal: quotation.taxTotal,
          total: quotation.total,
          items: {
            create: quotation.items.map((item) => ({
              companyId: args.companyId,
              productId: item.productId,
              quantityOrdered: item.quantity,
              freeQuantity: item.freeQuantity,
              totalQuantity: item.totalQuantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              pricingSource: item.pricingSource,
              pricingSnapshot: item.pricingSnapshot as Prisma.InputJsonValue,
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
        },
        include: {
          customer: true,
          quotation: true,
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'converted', convertedAt: new Date() },
      });

      await this.pricing.createCommercialAuditLogs({
        tx,
        companyId: args.companyId,
        documentType: 'sales_order',
        documentId: order.id,
        rows: order.items.map((item) => ({
          documentLineId: item.id,
          customerId: order.customerId,
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
            (item.pricingSnapshot as Record<string, unknown> | null)?.warnings,
          snapshot: item.pricingSnapshot as Prisma.InputJsonValue,
        })),
      });

      return order;
    });

    return { data: created };
  }

  async reverseFulfillment(args: {
    tx: any;
    companyId: string;
    salesOrderId: string;
    invoiceItems: Array<{ salesOrderItemId: string | null; quantity: Decimal }>;
  }) {
    for (const item of args.invoiceItems) {
      if (!item.salesOrderItemId) continue;
      const salesOrderItem = await (args.tx as any).salesOrderItem.findUnique({
        where: { id: item.salesOrderItemId },
      });
      if (!salesOrderItem) continue;
      await (args.tx as any).salesOrderItem.update({
        where: { id: salesOrderItem.id },
        data: {
          quantityFulfilled: new Decimal(salesOrderItem.quantityFulfilled).sub(item.quantity),
        },
      });
    }

    const items = await (args.tx as any).salesOrderItem.findMany({
      where: { salesOrderId: args.salesOrderId, companyId: args.companyId },
    });
    const anyFulfilled = items.some((item: any) => new Decimal(item.quantityFulfilled).gt(0));
    await (args.tx as any).salesOrder.update({
      where: { id: args.salesOrderId },
      data: {
        status: anyFulfilled ? 'partially_fulfilled' : 'confirmed',
      },
    });
  }

  private async nextOrderNumber(tx: any, companyId: string) {
    const count = await tx.salesOrder.count({ where: { companyId } });
    return `SO-${count + 1}`;
  }

  private async computeItems(args: {
    tx: any;
    companyId: string;
    customerId: string;
    documentDate?: string;
    items: Array<{
      product_id: string;
      quantity: string;
      unit_price: string;
      discount?: string;
      override_reason?: string;
    }>;
  }) {
    const gstContext = await this.gst.resolveSalesContext(args.companyId, args.customerId);
    const productIds = args.items.map((item) => item.product_id);
    const products = await args.tx.product.findMany({
      where: { companyId: args.companyId, id: { in: productIds }, deletedAt: null },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const items = await Promise.all(args.items.map(async (item) => {
      const quantity = toDecimal(item.quantity);
      const unitPrice = toDecimal(item.unit_price);
      const discount = toDecimal(item.discount, '0');
      if (quantity.lte(0)) throw new BadRequestException('quantity must be > 0');
      if (unitPrice.lt(0)) throw new BadRequestException('unit_price must be >= 0');
      if (discount.lt(0)) throw new BadRequestException('discount must be >= 0');

      const product = products.find((entry: any) => entry.id === item.product_id);
      if (!product) throw new BadRequestException('Product not found');
      const resolvedPricing = await this.pricing.resolveLine({
        tx: args.tx,
        companyId: args.companyId,
        customerId: args.customerId,
        productId: item.product_id,
        quantity,
        documentDate: args.documentDate ? new Date(args.documentDate) : undefined,
        documentType: 'sales_order',
      });
      const resolvedCommercial = await this.pricing.resolveCommercialLine({
        tx: args.tx,
        companyId: args.companyId,
        customerId: args.customerId,
        productId: item.product_id,
        quantity,
        documentDate: args.documentDate ? new Date(args.documentDate) : undefined,
        documentType: 'sales_order',
      });
      const guardrails = await this.pricing.evaluateCommercialGuardrails({
        tx: args.tx,
        companyId: args.companyId,
        quantity,
        resolvedUnitPrice: resolvedPricing.resolvedUnitPrice,
        resolvedDiscount: resolvedCommercial.resolvedDiscount,
        enteredUnitPrice: unitPrice,
        enteredDiscount: discount,
        costPrice: product.costPrice,
        overrideReason: item.override_reason,
      });

      const lineSubTotal = quantity.mul(unitPrice).sub(discount);
      const split = this.gst.computeTaxSplit({
        companyStateCode: gstContext.companyStateCode,
        placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
        taxableValue: lineSubTotal,
        taxRate: product.taxRate,
      });
      const freeQuantity = resolvedCommercial.freeQuantity;
      const totalQuantity = quantity.add(freeQuantity);
      return {
        productId: product.id,
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
          override:
            guardrails.hasCommercialOverride
              ? {
                  type: 'commercial_override',
                  resolved_unit_price: resolvedPricing.resolvedUnitPrice.toString(),
                  entered_unit_price: unitPrice.toString(),
                  override_reason: guardrails.overrideReason,
                }
              : null,
        },
        hsnCode: product.hsn,
        taxRate: product.taxRate,
        taxableValue: split.taxableValue,
        cgstAmount: split.cgstAmount,
        sgstAmount: split.sgstAmount,
        igstAmount: split.igstAmount,
        cessAmount: split.cessAmount,
        lineSubTotal,
        lineTaxTotal: split.taxTotal,
        lineTotal: lineSubTotal.add(split.taxTotal),
      };
    }));

    const subTotal = items.reduce((acc, item) => acc.add(item.lineSubTotal), new Decimal(0));
    const taxTotal = items.reduce((acc, item) => acc.add(item.lineTaxTotal), new Decimal(0));
    const total = items.reduce((acc, item) => acc.add(item.lineTotal), new Decimal(0));

    return { items, subTotal, taxTotal, total };
  }
}
