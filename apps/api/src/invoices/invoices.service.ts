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
import { InvoiceNumberService } from './invoice-number.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { IdempotencyService } from '../idempotency/idempotency.service';

function toDecimal(value: string | undefined, fallback = '0'): Decimal {
  const v = (value ?? fallback).trim();
  return new Decimal(v);
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceNumber: InvoiceNumberService,
    private readonly inventory: InventoryService,
    private readonly idempotency: IdempotencyService,
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
        include: { customer: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, page: args.page, limit: args.limit, total };
  }

  async get(args: { companyId: string; invoiceId: string }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: args.invoiceId, companyId: args.companyId },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return { data: invoice };
  }

  async createDraft(args: {
    companyId: string;
    createdByUserId: string;
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

            const itemsComputed = args.dto.items.map((item) => {
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
              const taxRate = product.taxRate;
              const lineTaxTotal = taxRate
                ? lineSubTotal.mul(taxRate).div(100)
                : new Decimal(0);
              const lineTotal = lineSubTotal.add(lineTaxTotal);

              return {
                productId: item.product_id,
                quantity,
                unitPrice,
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

            const invoice = await tx.invoice.create({
              data: {
                companyId: args.companyId,
                customerId: customer.id,
                status: 'draft',
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
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
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
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: args.invoiceId, companyId: args.companyId },
        include: { items: true },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status !== 'draft') {
        throw new ConflictException('Only draft invoices can be issued');
      }

      const { seriesId, invoiceNumber } =
        await this.invoiceNumber.reserveNextInvoiceNumber({
          tx,
          companyId: args.companyId,
          seriesCode: args.seriesCode,
        });

      // Decrement stock per invoice item.
      for (const item of invoice.items) {
        await this.inventory.adjustStock({
          companyId: args.companyId,
          productId: item.productId,
          delta: new Decimal(item.quantity).mul(-1),
          note: `Invoice ${invoiceNumber}`,
          sourceType: 'invoice',
          sourceId: invoice.id,
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

      return { data: updated };
    });
  }

  async cancel(args: { companyId: string; invoiceId: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: args.invoiceId, companyId: args.companyId },
        include: { items: true },
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

      // Reverse stock.
      for (const item of invoice.items) {
        await this.inventory.adjustStock({
          companyId: args.companyId,
          productId: item.productId,
          delta: new Decimal(item.quantity),
          note: `Invoice cancel ${invoice.invoiceNumber ?? invoice.id}`,
          sourceType: 'invoice_cancel',
          sourceId: invoice.id,
        });
      }

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      return { data: updated };
    });
  }
}
