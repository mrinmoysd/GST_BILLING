import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountingService } from '../accounting/accounting.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly accounting: AccountingService,
  ) {}

  async list(args: {
    companyId: string;
    from?: string;
    to?: string;
    method?: string;
    page: number;
    limit: number;
  }) {
    const skip = (args.page - 1) * args.limit;
    const where: any = {
      companyId: args.companyId,
      ...(args.method ? { method: args.method } : {}),
      ...(args.from || args.to
        ? {
            paymentDate: {
              ...(args.from ? { gte: new Date(args.from) } : {}),
              ...(args.to ? { lte: new Date(args.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: args.limit,
        include: { invoice: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, page: args.page, limit: args.limit, total };
  }

  async record(args: {
    companyId: string;
    dto: RecordPaymentDto;
    idempotencyKey?: string;
  }) {
    const targetInvoiceId = args.dto.invoice_id;
    const targetPurchaseId = args.dto.purchase_id;

    if (!targetInvoiceId && !targetPurchaseId) {
      throw new BadRequestException('invoice_id or purchase_id is required');
    }

    if (targetInvoiceId && targetPurchaseId) {
      throw new BadRequestException(
        'Provide only one of invoice_id or purchase_id',
      );
    }

    const amount = new Decimal(args.dto.amount);
    if (amount.lte(0)) throw new BadRequestException('amount must be > 0');

    const route = 'POST:/api/companies/:companyId/payments';

    const out = await this.idempotency.run({
      companyId: args.companyId,
      route,
      key: args.idempotencyKey,
      requestBody: args.dto,
      action: async () => {
        const body = await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const invoice = targetInvoiceId
              ? await tx.invoice.findFirst({
                  where: { id: targetInvoiceId, companyId: args.companyId },
                })
              : null;

            const purchase = targetPurchaseId
              ? await tx.purchase.findFirst({
                  where: { id: targetPurchaseId, companyId: args.companyId },
                })
              : null;

            if (targetInvoiceId) {
              if (!invoice) throw new NotFoundException('Invoice not found');
              if (invoice.status !== 'issued') {
                throw new BadRequestException('Can only pay an issued invoice');
              }
            }

            if (targetPurchaseId) {
              if (!purchase) throw new NotFoundException('Purchase not found');
              if (purchase.status === 'cancelled') {
                throw new BadRequestException(
                  'Cannot pay a cancelled purchase',
                );
              }
            }

            const payment = await tx.payment.create({
              data: {
                companyId: args.companyId,
                invoiceId: invoice?.id ?? null,
                purchaseId: purchase?.id ?? null,
                amount,
                method: args.dto.method,
                reference: args.dto.reference ?? null,
                paymentDate: args.dto.payment_date
                  ? new Date(args.dto.payment_date)
                  : new Date(),
              },
            });

            if (invoice) {
              const nextPaid = new Decimal(invoice.amountPaid).add(amount);
              const nextDue = new Decimal(invoice.total).sub(nextPaid);

              await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                  amountPaid: nextPaid,
                  balanceDue: nextDue,
                  status: nextDue.lte(0) ? 'paid' : 'issued',
                },
              });

              await this.accounting.postInvoicePayment(tx, {
                companyId: args.companyId,
                payment,
                invoice: {
                  id: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                },
              });

              await tx.documentLifecycleEvent.create({
                data: {
                  companyId: args.companyId,
                  invoiceId: invoice.id,
                  eventType: 'invoice.payment_recorded',
                  summary: `Payment of ${amount.toString()} recorded for invoice`,
                  payload: {
                    payment_id: payment.id,
                    amount: amount.toString(),
                    method: payment.method,
                  },
                },
              });
            }

            if (purchase) {
              await this.accounting.postPurchasePayment(tx, {
                companyId: args.companyId,
                payment,
                purchase: {
                  id: purchase.id,
                },
              });

              await tx.documentLifecycleEvent.create({
                data: {
                  companyId: args.companyId,
                  purchaseId: purchase.id,
                  eventType: 'purchase.payment_recorded',
                  summary: `Payment of ${amount.toString()} recorded for purchase`,
                  payload: {
                    payment_id: payment.id,
                    amount: amount.toString(),
                    method: payment.method,
                  },
                },
              });
            }

            return { data: payment };
          },
        );

        return { status: 201, body, data: body.data };
      },
    });

    return out.body;
  }
}
