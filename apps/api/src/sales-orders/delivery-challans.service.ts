import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { GstService } from '../gst/gst.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto';
import { UpdateDeliveryChallanDto } from './dto/update-delivery-challan.dto';
import { TransitionDeliveryChallanDto } from './dto/transition-delivery-challan.dto';

function toDecimal(value: string | undefined, fallback = '0') {
  return new Decimal((value ?? fallback).trim());
}

type Tx = Prisma.TransactionClient | PrismaClient;

@Injectable()
export class DeliveryChallansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gst: GstService,
  ) {}

  private async nextChallanNumber(tx: Tx, companyId: string) {
    const count = await tx.deliveryChallan.count({ where: { companyId } });
    return `DC-${count + 1}`;
  }

  private async createEvent(args: {
    tx: Tx;
    companyId: string;
    deliveryChallanId: string;
    eventType: string;
    summary: string;
    payload?: Prisma.InputJsonValue | null;
  }) {
    await args.tx.deliveryChallanEvent.create({
      data: {
        companyId: args.companyId,
        deliveryChallanId: args.deliveryChallanId,
        eventType: args.eventType,
        summary: args.summary,
        payload: args.payload ?? Prisma.JsonNull,
      },
    });
  }

  private async assertWarehouse(companyId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId, isActive: true },
      select: { id: true, name: true, code: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  private normalizeStatus(status: string) {
    return status.trim().toLowerCase();
  }

  private async loadSalesOrderWithDispatchContext(args: {
    tx: Tx;
    companyId: string;
    salesOrderId: string;
    excludeChallanId?: string;
  }) {
    const salesOrder = await args.tx.salesOrder.findFirst({
      where: { id: args.salesOrderId, companyId: args.companyId },
      include: {
        customer: true,
        items: true,
        challans: {
          where: args.excludeChallanId
            ? { id: { not: args.excludeChallanId } }
            : undefined,
          include: {
            items: true,
            invoice: { select: { id: true } },
          },
        },
      },
    });
    if (!salesOrder) throw new NotFoundException('Sales order not found');
    return salesOrder;
  }

  private calculateOpenCommittedQuantity(args: {
    salesOrderItemId: string;
    challans: Array<{
      status: string;
      invoice?: { id: string } | null;
      items: Array<{ salesOrderItemId: string; quantityRequested: Decimal }>;
    }>;
  }) {
    return args.challans.reduce((acc, challan) => {
      if (this.normalizeStatus(challan.status) === 'cancelled') return acc;
      if (challan.invoice?.id) return acc;
      const line = challan.items.find(
        (item) => item.salesOrderItemId === args.salesOrderItemId,
      );
      if (!line) return acc;
      return acc.add(line.quantityRequested);
    }, new Decimal(0));
  }

  private async buildItemCreates(args: {
    tx: Tx;
    companyId: string;
    salesOrderId: string;
    dto: CreateDeliveryChallanDto | UpdateDeliveryChallanDto;
    excludeChallanId?: string;
  }) {
    if (!args.dto.items?.length) {
      throw new BadRequestException('Delivery challan requires at least one item');
    }

    const salesOrder = await this.loadSalesOrderWithDispatchContext({
      tx: args.tx,
      companyId: args.companyId,
      salesOrderId: args.salesOrderId,
      excludeChallanId: args.excludeChallanId,
    });

    if (!['confirmed', 'partially_fulfilled'].includes(this.normalizeStatus(salesOrder.status))) {
      throw new ConflictException(
        'Only confirmed or partially fulfilled sales orders can create delivery challans',
      );
    }

    return args.dto.items.map((entry) => {
      const orderItem = salesOrder.items.find(
        (item) => item.id === entry.sales_order_item_id,
      );
      if (!orderItem) {
        throw new BadRequestException('Sales order item not found');
      }

      const requested = toDecimal(entry.quantity_requested);
      const dispatched = toDecimal(entry.quantity_dispatched, entry.quantity_requested);
      const delivered = toDecimal(entry.quantity_delivered, '0');
      const shortSupply = toDecimal(entry.short_supply_quantity, '0');

      if (requested.lte(0)) {
        throw new BadRequestException('quantity_requested must be > 0');
      }
      if (dispatched.lt(0) || delivered.lt(0) || shortSupply.lt(0)) {
        throw new BadRequestException('Dispatch quantities must be >= 0');
      }
      if (dispatched.gt(requested)) {
        throw new BadRequestException('quantity_dispatched cannot exceed quantity_requested');
      }
      if (delivered.gt(dispatched)) {
        throw new BadRequestException('quantity_delivered cannot exceed quantity_dispatched');
      }
      if (shortSupply.gt(requested)) {
        throw new BadRequestException('short_supply_quantity cannot exceed quantity_requested');
      }

      const openCommitted = this.calculateOpenCommittedQuantity({
        salesOrderItemId: orderItem.id,
        challans: salesOrder.challans as Array<any>,
      });
      const remaining = new Decimal(orderItem.quantityOrdered)
        .sub(orderItem.quantityFulfilled)
        .sub(openCommitted);

      if (requested.gt(remaining)) {
        throw new ConflictException(
          `Requested dispatch quantity exceeds remaining order quantity for ${orderItem.id}`,
        );
      }

      return {
        companyId: args.companyId,
        salesOrderItemId: orderItem.id,
        productId: orderItem.productId,
        quantityRequested: requested,
        quantityDispatched: dispatched,
        quantityDelivered: delivered,
        shortSupplyQuantity: shortSupply,
      };
    });
  }

  private async assertWarehouseStock(args: {
    tx: Tx;
    companyId: string;
    warehouseId: string;
    items: Array<{ productId: string; quantityDispatched: Decimal }>;
  }) {
    const stocks = await args.tx.warehouseStock.findMany({
      where: {
        companyId: args.companyId,
        warehouseId: args.warehouseId,
        productId: { in: args.items.map((item) => item.productId) },
      },
      select: { productId: true, quantity: true },
    });

    for (const item of args.items) {
      const stock = stocks.find((entry) => entry.productId === item.productId);
      const available = stock ? new Decimal(stock.quantity) : new Decimal(0);
      if (item.quantityDispatched.gt(available)) {
        throw new ConflictException(
          `Insufficient warehouse stock for product ${item.productId}`,
        );
      }
    }
  }

  async listQueue(args: {
    companyId: string;
    q?: string;
    warehouseId?: string;
  }) {
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['confirmed', 'partially_fulfilled'] },
        ...(args.q
          ? {
              OR: [
                { orderNumber: { contains: args.q, mode: 'insensitive' } },
                { customer: { name: { contains: args.q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: [{ expectedDispatchDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
        challans: {
          where: args.warehouseId ? { warehouseId: args.warehouseId } : undefined,
          include: {
            invoice: { select: { id: true } },
            items: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const data = orders
      .map((order) => {
        const pendingQuantity = order.items.reduce((acc, item) => {
          const openCommitted = this.calculateOpenCommittedQuantity({
            salesOrderItemId: item.id,
            challans: order.challans as Array<any>,
          });
          const remaining = new Decimal(item.quantityOrdered)
            .sub(item.quantityFulfilled)
            .sub(openCommitted);
          return acc.add(remaining.gt(0) ? remaining : new Decimal(0));
        }, new Decimal(0));

        return {
          sales_order_id: order.id,
          order_number: order.orderNumber,
          status: order.status,
          expected_dispatch_date: order.expectedDispatchDate?.toISOString().slice(0, 10) ?? null,
          customer: order.customer,
          pending_dispatch_quantity: pendingQuantity.toString(),
          challans_count: order.challans.length,
          latest_challan_status:
            order.challans
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
              ?.status ?? null,
        };
      })
      .filter((row) => new Decimal(row.pending_dispatch_quantity).gt(0));

    return { data };
  }

  async listChallans(args: {
    companyId: string;
    page: number;
    limit: number;
    q?: string;
    status?: string;
    salesOrderId?: string;
  }) {
    const skip = (args.page - 1) * args.limit;
    const where: Prisma.DeliveryChallanWhereInput = {
      companyId: args.companyId,
      ...(args.status ? { status: args.status } : {}),
      ...(args.salesOrderId ? { salesOrderId: args.salesOrderId } : {}),
      ...(args.q
        ? {
            OR: [
              { challanNumber: { contains: args.q, mode: 'insensitive' } },
              { customer: { name: { contains: args.q, mode: 'insensitive' } } },
              { salesOrder: { orderNumber: { contains: args.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.deliveryChallan.findMany({
        where,
        skip,
        take: args.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          salesOrder: { select: { id: true, orderNumber: true, status: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      }),
      this.prisma.deliveryChallan.count({ where }),
    ]);

    return { data, page: args.page, limit: args.limit, total };
  }

  async get(args: { companyId: string; challanId: string }) {
    const data = await this.prisma.deliveryChallan.findFirst({
      where: { companyId: args.companyId, id: args.challanId },
      include: {
        customer: { select: { id: true, name: true, phone: true, gstin: true } },
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            expectedDispatchDate: true,
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            salesOrderItem: {
              select: {
                id: true,
                quantityOrdered: true,
                quantityFulfilled: true,
                lineTotal: true,
              },
            },
          },
        },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!data) throw new NotFoundException('Delivery challan not found');
    return { data };
  }

  async create(args: {
    companyId: string;
    salesOrderId: string;
    dto: CreateDeliveryChallanDto;
  }) {
    await this.assertWarehouse(args.companyId, args.dto.warehouse_id);

    const data = await this.prisma.$transaction(async (tx) => {
      const salesOrder = await this.loadSalesOrderWithDispatchContext({
        tx,
        companyId: args.companyId,
        salesOrderId: args.salesOrderId,
      });
      const challanNumber = await this.nextChallanNumber(tx, args.companyId);
      const itemCreates = await this.buildItemCreates({
        tx,
        companyId: args.companyId,
        salesOrderId: args.salesOrderId,
        dto: args.dto,
      });

      const challan = await tx.deliveryChallan.create({
        data: {
          companyId: args.companyId,
          salesOrderId: salesOrder.id,
          customerId: salesOrder.customerId,
          warehouseId: args.dto.warehouse_id,
          challanNumber,
          challanDate: args.dto.challan_date
            ? new Date(args.dto.challan_date)
            : salesOrder.expectedDispatchDate ?? new Date(),
          transporterName: args.dto.transporter_name?.trim() || null,
          vehicleNumber: args.dto.vehicle_number?.trim() || null,
          dispatchNotes: args.dto.dispatch_notes?.trim() || null,
          deliveryNotes: args.dto.delivery_notes?.trim() || null,
          items: { create: itemCreates },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          salesOrder: { select: { id: true, orderNumber: true, status: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        deliveryChallanId: challan.id,
        eventType: 'challan.created',
        summary: `Delivery challan ${challan.challanNumber} created`,
        payload: {
          sales_order_id: salesOrder.id,
          warehouse_id: args.dto.warehouse_id,
        } as Prisma.InputJsonValue,
      });

      return challan;
    });

    return { data };
  }

  async patch(args: {
    companyId: string;
    challanId: string;
    dto: UpdateDeliveryChallanDto;
  }) {
    const current = await this.prisma.deliveryChallan.findFirst({
      where: { id: args.challanId, companyId: args.companyId },
      include: { invoice: { select: { id: true } } },
    });
    if (!current) throw new NotFoundException('Delivery challan not found');
    if (
      !['draft', 'picked', 'packed', 'dispatched'].includes(
        this.normalizeStatus(current.status),
      )
    ) {
      throw new ConflictException(
        'Only open challans can be updated before invoice lock',
      );
    }
    if (current.invoice?.id) {
      throw new ConflictException('Invoiced challans cannot be updated');
    }
    if (args.dto.warehouse_id) {
      await this.assertWarehouse(args.companyId, args.dto.warehouse_id);
    }

    const data = await this.prisma.$transaction(async (tx) => {
      const itemCreates = args.dto.items
        ? await this.buildItemCreates({
            tx,
            companyId: args.companyId,
            salesOrderId: current.salesOrderId,
            dto: args.dto,
            excludeChallanId: current.id,
          })
        : undefined;

      if (
        itemCreates &&
        ['packed', 'dispatched'].includes(this.normalizeStatus(current.status))
      ) {
        await this.assertWarehouseStock({
          tx,
          companyId: args.companyId,
          warehouseId: args.dto.warehouse_id ?? current.warehouseId,
          items: itemCreates.map((item) => ({
            productId: item.productId,
            quantityDispatched: new Decimal(item.quantityDispatched),
          })),
        });
      }

      if (itemCreates) {
        await tx.deliveryChallanItem.deleteMany({
          where: { companyId: args.companyId, deliveryChallanId: current.id },
        });
      }

      const challan = await tx.deliveryChallan.update({
        where: { id: current.id },
        data: {
          warehouseId:
            args.dto.warehouse_id !== undefined
              ? args.dto.warehouse_id
              : undefined,
          challanDate:
            args.dto.challan_date !== undefined
              ? args.dto.challan_date
                ? new Date(args.dto.challan_date)
                : null
              : undefined,
          transporterName:
            args.dto.transporter_name !== undefined
              ? args.dto.transporter_name?.trim() || null
              : undefined,
          vehicleNumber:
            args.dto.vehicle_number !== undefined
              ? args.dto.vehicle_number?.trim() || null
              : undefined,
          dispatchNotes:
            args.dto.dispatch_notes !== undefined
              ? args.dto.dispatch_notes?.trim() || null
              : undefined,
          deliveryNotes:
            args.dto.delivery_notes !== undefined
              ? args.dto.delivery_notes?.trim() || null
              : undefined,
          items: itemCreates ? { create: itemCreates } : undefined,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          salesOrder: { select: { id: true, orderNumber: true, status: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        deliveryChallanId: challan.id,
        eventType: 'challan.updated',
        summary: `Delivery challan ${challan.challanNumber} updated`,
      });

      return challan;
    });

    return { data };
  }

  async transition(args: {
    companyId: string;
    challanId: string;
    dto: TransitionDeliveryChallanDto;
  }) {
    const nextStatus = this.normalizeStatus(args.dto.status);
    const allowedTransitions: Record<string, string[]> = {
      draft: ['picked', 'packed', 'dispatched', 'cancelled'],
      picked: ['packed', 'dispatched', 'cancelled'],
      packed: ['dispatched', 'cancelled'],
      dispatched: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const data = await this.prisma.$transaction(async (tx) => {
      const challan = await tx.deliveryChallan.findFirst({
        where: { id: args.challanId, companyId: args.companyId },
        include: {
          invoice: { select: { id: true } },
          items: true,
        },
      });
      if (!challan) throw new NotFoundException('Delivery challan not found');

      const currentStatus = this.normalizeStatus(challan.status);
      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
        throw new ConflictException(
          `Cannot move challan from ${challan.status} to ${args.dto.status}`,
        );
      }

      if (challan.invoice?.id && nextStatus === 'cancelled') {
        throw new ConflictException('Invoiced challans cannot be cancelled');
      }

      if (nextStatus === 'dispatched') {
        await this.assertWarehouseStock({
          tx,
          companyId: args.companyId,
          warehouseId: challan.warehouseId,
          items: challan.items.map((item) => ({
            productId: item.productId,
            quantityDispatched: new Decimal(item.quantityDispatched),
          })),
        });
      }

      if (nextStatus === 'delivered') {
        for (const item of challan.items) {
          const delivered = new Decimal(item.quantityDelivered);
          if (delivered.eq(0)) {
            const computed = new Decimal(item.quantityDispatched).sub(
              item.shortSupplyQuantity,
            );
            await tx.deliveryChallanItem.update({
              where: { id: item.id },
              data: {
                quantityDelivered: computed.gt(0) ? computed : new Decimal(0),
              },
            });
          }
        }
      }

      const updated = await tx.deliveryChallan.update({
        where: { id: challan.id },
        data: {
          status: nextStatus,
          dispatchNotes:
            args.dto.dispatch_notes !== undefined
              ? args.dto.dispatch_notes?.trim() || null
              : undefined,
          deliveryNotes:
            args.dto.delivery_notes !== undefined
              ? args.dto.delivery_notes?.trim() || null
              : undefined,
          pickedAt: nextStatus === 'picked' ? new Date() : undefined,
          packedAt: nextStatus === 'packed' ? new Date() : undefined,
          dispatchedAt: nextStatus === 'dispatched' ? new Date() : undefined,
          deliveredAt: nextStatus === 'delivered' ? new Date() : undefined,
          cancelledAt: nextStatus === 'cancelled' ? new Date() : undefined,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        deliveryChallanId: challan.id,
        eventType: `challan.${nextStatus}`,
        summary: `Delivery challan moved to ${nextStatus}`,
      });

      return updated;
    });

    return { data };
  }

  async convertToInvoice(args: {
    companyId: string;
    challanId: string;
    seriesCode?: string;
  }) {
    const data = await this.prisma.$transaction(async (tx) => {
      const challan = await tx.deliveryChallan.findFirst({
        where: { id: args.challanId, companyId: args.companyId },
        include: {
          invoice: { select: { id: true } },
          customer: true,
          salesOrder: true,
          items: {
            include: {
              salesOrderItem: true,
            },
          },
        },
      });
      if (!challan) throw new NotFoundException('Delivery challan not found');
      if (challan.invoice?.id) {
        throw new ConflictException('Delivery challan already converted to invoice');
      }
      if (!['packed', 'dispatched', 'delivered'].includes(this.normalizeStatus(challan.status))) {
        throw new ConflictException(
          'Only packed, dispatched, or delivered challans can be converted',
        );
      }

      let seriesId: string | undefined;
      if (args.seriesCode) {
        const series = await tx.invoiceSeries.findFirst({
          where: {
            companyId: args.companyId,
            code: args.seriesCode,
            isActive: true,
          },
        });
        if (!series) throw new NotFoundException('Invoice series not found');
        seriesId = series.id;
      }

      const convertibleItems = challan.items
        .map((item) => {
          const quantity =
            this.normalizeStatus(challan.status) === 'delivered'
              ? new Decimal(item.quantityDelivered)
              : new Decimal(item.quantityDispatched);
          return { item, quantity };
        })
        .filter((entry) => entry.quantity.gt(0));

      if (convertibleItems.length === 0) {
        throw new BadRequestException(
          'No challan quantity is available to convert into an invoice',
        );
      }

      const gstContext = await this.gst.resolveSalesContext(
        args.companyId,
        challan.customerId,
      );

      const subTotal = convertibleItems.reduce((acc, entry) => {
        const ratio = entry.quantity.div(entry.item.salesOrderItem.quantityOrdered);
        return acc.add(entry.item.salesOrderItem.lineSubTotal.mul(ratio));
      }, new Decimal(0));
      const taxTotal = convertibleItems.reduce((acc, entry) => {
        const ratio = entry.quantity.div(entry.item.salesOrderItem.quantityOrdered);
        return acc.add(entry.item.salesOrderItem.lineTaxTotal.mul(ratio));
      }, new Decimal(0));
      const total = convertibleItems.reduce((acc, entry) => {
        const ratio = entry.quantity.div(entry.item.salesOrderItem.quantityOrdered);
        return acc.add(entry.item.salesOrderItem.lineTotal.mul(ratio));
      }, new Decimal(0));

      const invoice = await tx.invoice.create({
        data: {
          companyId: args.companyId,
          customerId: challan.customerId,
          salespersonUserId: challan.salesOrder.salespersonUserId,
          quotationId: challan.salesOrder.quotationId,
          salesOrderId: challan.salesOrderId,
          challanId: challan.id,
          warehouseId: challan.warehouseId,
          seriesId,
          status: 'draft',
          customerGstin: gstContext.customerGstin,
          placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
          issueDate: challan.challanDate ?? new Date(),
          notes: challan.dispatchNotes ?? challan.salesOrder.notes,
          subTotal,
          taxTotal,
          total,
          amountPaid: new Decimal(0),
          balanceDue: total,
          items: {
            create: convertibleItems.map(({ item, quantity }) => {
              const ratio = quantity.div(item.salesOrderItem.quantityOrdered);
              const freeQuantity = new Decimal(item.salesOrderItem.freeQuantity ?? 0).mul(ratio);
              const totalQuantity = quantity.add(freeQuantity);
              return {
                companyId: args.companyId,
                productId: item.productId,
                salesOrderItemId: item.salesOrderItemId,
                hsnCode: item.salesOrderItem.hsnCode,
                quantity,
                freeQuantity,
                totalQuantity,
                unitPrice: item.salesOrderItem.unitPrice,
                discount: item.salesOrderItem.discount.mul(ratio),
                pricingSource: item.salesOrderItem.pricingSource,
                pricingSnapshot:
                  item.salesOrderItem.pricingSnapshot as Prisma.InputJsonValue,
                taxRate: item.salesOrderItem.taxRate,
                taxableValue: item.salesOrderItem.taxableValue.mul(ratio),
                cgstAmount: item.salesOrderItem.cgstAmount.mul(ratio),
                sgstAmount: item.salesOrderItem.sgstAmount.mul(ratio),
                igstAmount: item.salesOrderItem.igstAmount.mul(ratio),
                cessAmount: item.salesOrderItem.cessAmount.mul(ratio),
                lineSubTotal: item.salesOrderItem.lineSubTotal.mul(ratio),
                lineTaxTotal: item.salesOrderItem.lineTaxTotal.mul(ratio),
                lineTotal: item.salesOrderItem.lineTotal.mul(ratio),
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

      for (const { item, quantity } of convertibleItems) {
        await tx.salesOrderItem.update({
          where: { id: item.salesOrderItemId },
          data: {
            quantityFulfilled: new Decimal(item.salesOrderItem.quantityFulfilled).add(
              quantity,
            ),
          },
        });
      }

      const refreshedItems = await tx.salesOrderItem.findMany({
        where: { companyId: args.companyId, salesOrderId: challan.salesOrderId },
      });
      const isFulfilled = refreshedItems.every((item) =>
        new Decimal(item.quantityFulfilled).gte(item.quantityOrdered),
      );

      await tx.salesOrder.update({
        where: { id: challan.salesOrderId },
        data: {
          status: isFulfilled ? 'fulfilled' : 'partially_fulfilled',
        },
      });

      await tx.documentLifecycleEvent.create({
        data: {
          companyId: args.companyId,
          invoiceId: invoice.id,
          eventType: 'invoice.created_from_delivery_challan',
          summary: `Draft invoice created from delivery challan ${challan.challanNumber}`,
          payload: {
            challan_id: challan.id,
            challan_number: challan.challanNumber,
            sales_order_id: challan.salesOrderId,
          },
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        deliveryChallanId: challan.id,
        eventType: 'challan.converted_to_invoice',
        summary: `Draft invoice created from delivery challan ${challan.challanNumber}`,
        payload: {
          invoice_id: invoice.id,
        } as Prisma.InputJsonValue,
      });

      return invoice;
    });

    return { data };
  }
}
