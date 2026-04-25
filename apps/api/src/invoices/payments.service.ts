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
import { UpdatePaymentInstrumentDto } from './dto/update-payment-instrument.dto';
import { MigrationOpsService } from '../migration-ops/migration-ops.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly accounting: AccountingService,
    private readonly migrationOps: MigrationOpsService,
  ) {}

  private normalizeInstrumentStatus(args: {
    method: string;
    instrumentType?: string | null;
  }) {
    const method = args.method.trim().toLowerCase();
    const instrumentType = args.instrumentType?.trim().toLowerCase() ?? '';
    if (
      ['cheque', 'pdc'].includes(method) ||
      ['cheque', 'pdc'].includes(instrumentType)
    ) {
      return 'received';
    }
    return 'cleared';
  }

  async list(args: {
    companyId: string;
    from?: string;
    to?: string;
    method?: string;
    instrumentStatus?: string;
    bankAccountId?: string;
    page: number;
    limit: number;
  }) {
    const skip = (args.page - 1) * args.limit;
    const where: any = {
      companyId: args.companyId,
      ...(args.method ? { method: args.method } : {}),
      ...(args.instrumentStatus
        ? { instrumentStatus: args.instrumentStatus }
        : {}),
      ...(args.bankAccountId ? { bankAccountId: args.bankAccountId } : {}),
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
        include: {
          invoice: true,
          purchase: true,
          bankAccount: {
            select: {
              id: true,
              nickname: true,
              bankName: true,
              accountNumberLast4: true,
            },
          },
          bankStatementLine: {
            select: {
              id: true,
              txnDate: true,
              description: true,
              matchedAt: true,
            },
          },
          salesperson: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
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
              const remainingDue = new Decimal(invoice.balanceDue);
              if (remainingDue.lte(0)) {
                throw new BadRequestException('Invoice has no remaining due');
              }
              if (amount.gt(remainingDue)) {
                throw new BadRequestException(
                  `Payment amount cannot exceed remaining due ${remainingDue.toFixed(2)}`,
                );
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

            if (args.dto.bank_account_id) {
              const bankAccount = await tx.companyBankAccount.findFirst({
                where: {
                  id: args.dto.bank_account_id,
                  companyId: args.companyId,
                  isActive: true,
                },
                select: { id: true },
              });
              if (!bankAccount) {
                throw new NotFoundException('Bank account not found');
              }
            }

            const instrumentType = args.dto.instrument_type?.trim() || null;
            const instrumentStatus = this.normalizeInstrumentStatus({
              method: args.dto.method,
              instrumentType,
            });

            const payment = await tx.payment.create({
              data: {
                companyId: args.companyId,
                invoiceId: invoice?.id ?? null,
                purchaseId: purchase?.id ?? null,
                salespersonUserId: invoice?.salespersonUserId ?? null,
                bankAccountId: args.dto.bank_account_id ?? null,
                amount,
                method: args.dto.method,
                instrumentType,
                instrumentStatus,
                instrumentNumber: args.dto.instrument_number?.trim() || null,
                instrumentDate: args.dto.instrument_date
                  ? new Date(args.dto.instrument_date)
                  : null,
                depositDate: args.dto.deposit_date
                  ? new Date(args.dto.deposit_date)
                  : null,
                clearanceDate:
                  instrumentStatus === 'cleared'
                    ? args.dto.clearance_date
                      ? new Date(args.dto.clearance_date)
                      : args.dto.payment_date
                        ? new Date(args.dto.payment_date)
                        : new Date()
                    : args.dto.clearance_date
                      ? new Date(args.dto.clearance_date)
                      : null,
                bounceDate: args.dto.bounce_date
                  ? new Date(args.dto.bounce_date)
                  : null,
                reference: args.dto.reference ?? null,
                notes: args.dto.notes?.trim() || null,
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
                    instrument_status: payment.instrumentStatus,
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
                    instrument_status: payment.instrumentStatus,
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

    if (!out.replayed) {
      const payment = out.data as {
        id: string;
        invoiceId?: string | null;
        purchaseId?: string | null;
        amount: Prisma.Decimal;
        method: string;
        instrumentStatus?: string | null;
      };
      const eventType = payment.invoiceId
        ? 'invoice.payment_recorded'
        : 'purchase.payment_recorded';
      await this.migrationOps.publishWebhookEvent(
        args.companyId,
        eventType,
        `payment:${payment.id}:recorded`,
        {
          payment_id: payment.id,
          invoice_id: payment.invoiceId ?? null,
          purchase_id: payment.purchaseId ?? null,
          amount: payment.amount.toString(),
          method: payment.method,
          instrument_status: payment.instrumentStatus ?? null,
        },
      );
    }

    return out.body;
  }

  async updateInstrument(args: {
    companyId: string;
    paymentId: string;
    dto: UpdatePaymentInstrumentDto;
  }) {
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payment = await tx.payment.findFirst({
        where: { id: args.paymentId, companyId: args.companyId },
      });
      if (!payment) throw new NotFoundException('Payment not found');

      if (args.dto.bank_account_id) {
        const bankAccount = await tx.companyBankAccount.findFirst({
          where: {
            id: args.dto.bank_account_id,
            companyId: args.companyId,
            isActive: true,
          },
          select: { id: true },
        });
        if (!bankAccount) {
          throw new NotFoundException('Bank account not found');
        }
      }

      const nextStatus = args.dto.instrument_status?.trim() || undefined;
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          bankAccountId:
            args.dto.bank_account_id !== undefined
              ? args.dto.bank_account_id || null
              : undefined,
          instrumentStatus: nextStatus,
          instrumentNumber:
            args.dto.instrument_number !== undefined
              ? args.dto.instrument_number?.trim() || null
              : undefined,
          instrumentDate:
            args.dto.instrument_date !== undefined
              ? args.dto.instrument_date
                ? new Date(args.dto.instrument_date)
                : null
              : undefined,
          depositDate:
            args.dto.deposit_date !== undefined
              ? args.dto.deposit_date
                ? new Date(args.dto.deposit_date)
                : null
              : undefined,
          clearanceDate:
            args.dto.clearance_date !== undefined
              ? args.dto.clearance_date
                ? new Date(args.dto.clearance_date)
                : null
              : undefined,
          bounceDate:
            args.dto.bounce_date !== undefined
              ? args.dto.bounce_date
                ? new Date(args.dto.bounce_date)
                : null
              : undefined,
          notes:
            args.dto.notes !== undefined ? args.dto.notes?.trim() || null : undefined,
        },
      });

      if (
        nextStatus === 'bounced' &&
        payment.invoiceId
      ) {
        const invoice = await tx.invoice.findFirst({
          where: { id: payment.invoiceId, companyId: args.companyId },
          select: {
            id: true,
            customerId: true,
            salespersonUserId: true,
            invoiceNumber: true,
            dueDate: true,
            balanceDue: true,
          },
        });
        if (invoice) {
          await tx.collectionTask.create({
            data: {
              companyId: args.companyId,
              customerId: invoice.customerId,
              invoiceId: invoice.id,
              salespersonUserId: invoice.salespersonUserId ?? null,
              status: 'open',
              priority: 'high',
              channel: 'bounce_followup',
              dueDate: invoice.dueDate ?? new Date(),
              nextActionDate: new Date(),
              notes: `Auto-created after bounced instrument on invoice ${invoice.invoiceNumber ?? invoice.id}`,
            },
          });
        }
      }

      return {
        data: updated,
        eventPayload: {
          payment_id: updated.id,
          invoice_id: updated.invoiceId ?? null,
          purchase_id: updated.purchaseId ?? null,
          instrument_status: updated.instrumentStatus ?? null,
          instrument_number: updated.instrumentNumber ?? null,
          bank_account_id: updated.bankAccountId ?? null,
          deposit_date: updated.depositDate ?? null,
          clearance_date: updated.clearanceDate ?? null,
          bounce_date: updated.bounceDate ?? null,
        },
      };
    });
    await this.migrationOps.publishWebhookEvent(
      args.companyId,
      'payment.instrument_updated',
      `payment:${result.data.id}:instrument_updated:${new Date().toISOString()}`,
      result.eventPayload,
    );
    return { data: result.data };
  }
}
