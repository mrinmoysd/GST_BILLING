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
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

function toDecimal(value: string | undefined, fallback = '0'): Decimal {
  const v = (value ?? fallback).trim();
  return new Decimal(v);
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gst: GstService,
    private readonly pricing: PricingService,
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
    const where: Prisma.QuotationWhereInput = {
      companyId: args.companyId,
      ...(args.status ? { status: args.status } : {}),
      ...(args.q
        ? {
            OR: [
              { quoteNumber: { contains: args.q, mode: 'insensitive' } },
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
      this.prisma.quotation.findMany({
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
      this.prisma.quotation.count({ where }),
    ]);

    return { data, page: args.page, limit: args.limit, total };
  }

  async get(args: { companyId: string; quotationId: string }) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { companyId: args.companyId, id: args.quotationId },
      include: {
        customer: true,
        salesperson: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: { include: { product: true } },
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
    if (!quotation) throw new NotFoundException('Quotation not found');
    return { data: quotation };
  }

  async create(args: {
    companyId: string;
    dto: CreateQuotationDto;
    actorUserId?: string | null;
  }) {
    if (!args.dto.items?.length) {
      throw new BadRequestException('Quotation must have at least one item');
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

      const computed = await this.computeItems({
        tx,
        companyId: args.companyId,
        customerId: customer.id,
        documentDate: args.dto.issue_date,
        items: args.dto.items,
      });

      const quoteNumber = await this.nextQuoteNumber(tx, args.companyId);

      const quotation = await tx.quotation.create({
        data: {
          companyId: args.companyId,
          customerId: customer.id,
          salespersonUserId,
          quoteNumber,
          issueDate: args.dto.issue_date ? new Date(args.dto.issue_date) : null,
          expiryDate: args.dto.expiry_date
            ? new Date(args.dto.expiry_date)
            : null,
          notes: args.dto.notes,
          subTotal: computed.subTotal,
          taxTotal: computed.taxTotal,
          total: computed.total,
          items: {
            create: computed.items.map((item) => ({
              companyId: args.companyId,
              productId: item.productId,
              quantity: item.quantity,
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
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      await this.pricing.createCommercialAuditLogs({
        tx,
        companyId: args.companyId,
        actorUserId: args.actorUserId,
        documentType: 'quotation',
        documentId: quotation.id,
        rows: quotation.items.map((item) => ({
          documentLineId: item.id,
          customerId: quotation.customerId,
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

      return quotation;
    });

    return { data: created };
  }

  async patch(args: {
    companyId: string;
    quotationId: string;
    dto: UpdateQuotationDto;
    actorUserId?: string | null;
  }) {
    const existing = await this.prisma.quotation.findFirst({
      where: { id: args.quotationId, companyId: args.companyId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Quotation not found');
    this.ensureEditable(existing.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const customerId = args.dto.customer_id ?? existing.customerId;
      let customerSalespersonUserId: string | null | undefined;

      if (args.dto.customer_id) {
        const customer = await tx.customer.findFirst({
          where: {
            id: args.dto.customer_id,
            companyId: args.companyId,
            deletedAt: null,
          },
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

      let totals:
        | {
            items: Awaited<ReturnType<QuotationsService['computeItems']>>['items'];
            subTotal: Decimal;
            taxTotal: Decimal;
            total: Decimal;
          }
        | undefined;

      if (args.dto.items) {
        if (!args.dto.items.length) {
          throw new BadRequestException('Quotation must have at least one item');
        }
        totals = await this.computeItems({
          tx,
          companyId: args.companyId,
          customerId,
          documentDate: args.dto.issue_date ?? undefined,
          items: args.dto.items,
        });

        await tx.quotationItem.deleteMany({
          where: { quotationId: args.quotationId, companyId: args.companyId },
        });
      }

      const quotation = await tx.quotation.update({
        where: { id: args.quotationId },
        data: {
          customerId,
          salespersonUserId,
          issueDate:
            args.dto.issue_date !== undefined
              ? args.dto.issue_date
                ? new Date(args.dto.issue_date)
                : null
              : undefined,
          expiryDate:
            args.dto.expiry_date !== undefined
              ? args.dto.expiry_date
                ? new Date(args.dto.expiry_date)
                : null
              : undefined,
          notes: args.dto.notes,
          subTotal: totals?.subTotal,
          taxTotal: totals?.taxTotal,
          total: totals?.total,
          items: totals
            ? {
                create: totals.items.map((item) => ({
                  companyId: args.companyId,
                  productId: item.productId,
                  quantity: item.quantity,
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
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      if (totals) {
        await this.pricing.createCommercialAuditLogs({
          tx,
          companyId: args.companyId,
          actorUserId: args.actorUserId,
          documentType: 'quotation',
          documentId: quotation.id,
          rows: quotation.items.map((item) => ({
            documentLineId: item.id,
            customerId: quotation.customerId,
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

      return quotation;
    });

    return { data: updated };
  }

  async transition(args: {
    companyId: string;
    quotationId: string;
    status: 'sent' | 'approved' | 'expired' | 'cancelled';
  }) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { companyId: args.companyId, id: args.quotationId },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    if (quotation.status === 'converted') {
      throw new ConflictException('Converted quotations cannot be changed');
    }

    const updated = await this.prisma.quotation.update({
      where: { id: args.quotationId },
      data: { status: args.status },
      include: {
        customer: true,
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
    quotationId: string;
    seriesCode?: string;
  }) {
    const out = await this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findFirst({
        where: { companyId: args.companyId, id: args.quotationId },
        include: { items: true, customer: true, invoices: { select: { id: true } } },
      });
      if (!quotation) throw new NotFoundException('Quotation not found');
      if (quotation.status === 'converted' || quotation.invoices.length > 0) {
        throw new ConflictException('Quotation already converted');
      }
      if (quotation.status === 'cancelled' || quotation.status === 'expired') {
        throw new ConflictException('Quotation cannot be converted in current status');
      }

      const gstContext = await this.gst.resolveSalesContext(
        args.companyId,
        quotation.customerId,
      );

      let seriesId: string | undefined;
      if (args.seriesCode) {
        const series = await tx.invoiceSeries.findFirst({
          where: {
            companyId: args.companyId,
            code: args.seriesCode,
            isActive: true,
          },
        });
        if (!series) {
          throw new NotFoundException('Invoice series not found');
        }
        seriesId = series.id;
      }

      const invoice = await tx.invoice.create({
        data: {
          companyId: args.companyId,
          customerId: quotation.customerId,
          salespersonUserId: quotation.salespersonUserId,
          quotationId: quotation.id,
          seriesId,
          status: 'draft',
          customerGstin: gstContext.customerGstin,
          placeOfSupplyStateCode: gstContext.placeOfSupplyStateCode,
          issueDate: quotation.issueDate,
          dueDate: quotation.expiryDate,
          notes: quotation.notes,
          subTotal: quotation.subTotal,
          taxTotal: quotation.taxTotal,
          total: quotation.total,
          amountPaid: new Decimal(0),
          balanceDue: quotation.total,
          items: {
            create: quotation.items.map((item) => ({
              companyId: args.companyId,
              productId: item.productId,
              hsnCode: item.hsnCode,
              quantity: item.quantity,
              freeQuantity: item.freeQuantity,
              totalQuantity: item.totalQuantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              pricingSource: item.pricingSource,
              pricingSnapshot: item.pricingSnapshot as Prisma.InputJsonValue,
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
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: { include: { product: true } },
        },
      });

      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: 'converted',
          convertedAt: new Date(),
        },
      });

      await tx.documentLifecycleEvent.create({
        data: {
          companyId: args.companyId,
          invoiceId: invoice.id,
          eventType: 'invoice.created_from_quotation',
          summary: `Draft invoice created from quotation ${quotation.quoteNumber ?? quotation.id}`,
          payload: {
            quotation_id: quotation.id,
            quote_number: quotation.quoteNumber,
          },
        },
      });

      return invoice;
    });

    return { data: out };
  }

  async convertToSalesOrder(args: {
    companyId: string;
    quotationId: string;
  }) {
    return this.salesOrders.createFromQuotation(args);
  }

  private ensureEditable(status: string) {
    if (!['draft', 'sent'].includes(status)) {
      throw new ConflictException('Only draft or sent quotations can be edited');
    }
  }

  private async nextQuoteNumber(tx: Prisma.TransactionClient, companyId: string) {
    const count = await tx.quotation.count({ where: { companyId } });
    return `QTN-${count + 1}`;
  }

  private async computeItems(args: {
    tx: Prisma.TransactionClient;
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
    const gstContext = await this.gst.resolveSalesContext(
      args.companyId,
      args.customerId,
    );
    const productIds = args.items.map((item) => item.product_id);
    const products = await args.tx.product.findMany({
      where: {
        companyId: args.companyId,
        id: { in: productIds },
        deletedAt: null,
      },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const items = await Promise.all(args.items.map(async (item) => {
      const quantity = toDecimal(item.quantity);
      const unitPrice = toDecimal(item.unit_price);
      const discount = toDecimal(item.discount, '0');
      if (quantity.lte(0)) {
        throw new BadRequestException('quantity must be > 0');
      }
      if (unitPrice.lt(0)) {
        throw new BadRequestException('unit_price must be >= 0');
      }
      if (discount.lt(0)) {
        throw new BadRequestException('discount must be >= 0');
      }

      const product = products.find((entry) => entry.id === item.product_id);
      if (!product) throw new BadRequestException('Product not found');
      const resolvedPricing = await this.pricing.resolveLine({
        tx: args.tx,
        companyId: args.companyId,
        customerId: args.customerId,
        productId: item.product_id,
        quantity,
        documentDate: args.documentDate ? new Date(args.documentDate) : undefined,
        documentType: 'quotation',
      });
      const resolvedCommercial = await this.pricing.resolveCommercialLine({
        tx: args.tx,
        companyId: args.companyId,
        customerId: args.customerId,
        productId: item.product_id,
        quantity,
        documentDate: args.documentDate ? new Date(args.documentDate) : undefined,
        documentType: 'quotation',
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
      const lineTaxTotal = split.taxTotal;
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
        lineTaxTotal,
        lineTotal: lineSubTotal.add(lineTaxTotal),
      };
    }));

    const subTotal = items.reduce((acc, item) => acc.add(item.lineSubTotal), new Decimal(0));
    const taxTotal = items.reduce((acc, item) => acc.add(item.lineTaxTotal), new Decimal(0));
    const total = items.reduce((acc, item) => acc.add(item.lineTotal), new Decimal(0));

    return { items, subTotal, taxTotal, total };
  }
}
