import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { CreateCollectionTaskDto } from './dto/create-collection-task.dto';
import { UpdateCollectionTaskDto } from './dto/update-collection-task.dto';
import { ImportBankStatementDto } from './dto/import-bank-statement.dto';
import { MatchBankStatementLineDto } from './dto/match-bank-statement-line.dto';
import { UnmatchBankStatementLineDto } from './dto/unmatch-bank-statement-line.dto';

type ParsedStatementRow = {
  txnDate: Date;
  description: string;
  reference?: string | null;
  debit: Decimal;
  credit: Decimal;
  amount: Decimal;
  direction: 'debit' | 'credit';
  closingBalance?: Decimal | null;
};

@Injectable()
export class FinanceOpsService {
  constructor(private readonly prisma: PrismaService) {}

  private decimalToNumber(value: unknown) {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    const maybe = (value as any)?.toString?.();
    return typeof maybe === 'string' ? Number(maybe) : Number(value);
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return date;
  }

  private parseOptionalDate(value?: string | null) {
    if (!value) return null;
    return this.parseDate(value, 'date');
  }

  private maskAccountNumber(accountNumber?: string) {
    if (!accountNumber) {
      return { accountNumberMasked: null, accountNumberLast4: null };
    }
    const digits = accountNumber.replace(/\s+/g, '');
    const last4 = digits.slice(-4);
    const masked = last4 ? `${'*'.repeat(Math.max(digits.length - 4, 0))}${last4}` : digits;
    return { accountNumberMasked: masked, accountNumberLast4: last4 || null };
  }

  private normalizeInstrumentStatus(args: {
    method: string;
    instrumentType?: string | null;
    explicitStatus?: string | null;
  }) {
    if (args.explicitStatus?.trim()) return args.explicitStatus.trim().toLowerCase();
    const method = args.method.trim().toLowerCase();
    const instrumentType = args.instrumentType?.trim().toLowerCase() ?? '';
    if (instrumentType === 'cheque' || instrumentType === 'pdc' || method === 'cheque' || method === 'pdc') {
      return 'received';
    }
    return 'cleared';
  }

  private async assertLedger(companyId: string, ledgerId?: string | null) {
    if (!ledgerId) return null;
    const ledger = await this.prisma.ledger.findFirst({
      where: { id: ledgerId, companyId },
      select: { id: true, accountName: true },
    });
    if (!ledger) throw new NotFoundException('Ledger not found');
    return ledger;
  }

  private async assertUser(companyId: string, userId?: string | null) {
    if (!userId) return null;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, isActive: true },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private parseCsvLine(line: string) {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (char === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    out.push(current.trim());
    return out;
  }

  private parseMoney(value?: string | null) {
    const normalized = String(value ?? '')
      .trim()
      .replace(/,/g, '');
    if (!normalized) return new Decimal(0);
    if (!/^[-+]?\d+(\.\d+)?$/.test(normalized)) {
      throw new BadRequestException(`Invalid amount "${value}" in statement import`);
    }
    return new Decimal(normalized);
  }

  private parseStatementRows(csvContent: string): ParsedStatementRow[] {
    const lines = csvContent
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException('Statement import needs a header row and at least one data row');
    }

    const header = this.parseCsvLine(lines[0]).map((col) =>
      col.trim().toLowerCase().replace(/[\s_-]+/g, ''),
    );
    const headerMap = new Map(header.map((col, index) => [col, index]));
    const required = ['date', 'description'];
    for (const key of required) {
      if (!headerMap.has(key)) {
        throw new BadRequestException(
          'Statement header must include at least date and description columns',
        );
      }
    }

    const read = (columns: string[], row: string[]) => {
      for (const column of columns) {
        const idx = headerMap.get(column);
        if (idx !== undefined) return row[idx] ?? '';
      }
      return '';
    };

    return lines.slice(1).map((line, lineIndex) => {
      const row = this.parseCsvLine(line);
      const txnDate = this.parseDate(read(['date', 'txndate', 'valuedate'], row), `date at row ${lineIndex + 2}`);
      const description = read(['description', 'narration', 'remarks'], row).trim();
      if (!description) {
        throw new BadRequestException(`description is required at row ${lineIndex + 2}`);
      }
      const reference = read(['reference', 'ref', 'cheque', 'utr'], row).trim() || null;
      const debit = this.parseMoney(read(['debit', 'withdrawal'], row));
      const credit = this.parseMoney(read(['credit', 'deposit'], row));
      const closingBalanceRaw = read(['balance', 'closingbalance'], row);
      const closingBalance = closingBalanceRaw ? this.parseMoney(closingBalanceRaw) : null;
      const amount = credit.gt(0) ? credit : debit;
      const direction = credit.gt(0) ? 'credit' : 'debit';
      if (amount.lte(0)) {
        throw new BadRequestException(`debit or credit amount is required at row ${lineIndex + 2}`);
      }

      return {
        txnDate,
        description,
        reference,
        debit,
        credit,
        amount,
        direction,
        closingBalance,
      };
    });
  }

  async listBankAccounts(companyId: string) {
    const data = await this.prisma.companyBankAccount.findMany({
      where: { companyId },
      orderBy: [{ isActive: 'desc' }, { nickname: 'asc' }],
      include: {
        ledger: {
          select: { id: true, accountCode: true, accountName: true, type: true },
        },
      },
    });
    return { data };
  }

  async createBankAccount(companyId: string, dto: CreateBankAccountDto) {
    await this.assertLedger(companyId, dto.ledger_id);
    const masked = this.maskAccountNumber(dto.account_number);
    const data = await this.prisma.companyBankAccount.create({
      data: {
        companyId,
        ledgerId: dto.ledger_id ?? null,
        nickname: dto.nickname.trim(),
        bankName: dto.bank_name.trim(),
        branchName: dto.branch_name?.trim() || null,
        accountHolderName: dto.account_holder_name?.trim() || null,
        accountNumberMasked: masked.accountNumberMasked,
        accountNumberLast4: masked.accountNumberLast4,
        ifscCode: dto.ifsc_code?.trim() || null,
        upiHandle: dto.upi_handle?.trim() || null,
        isActive: dto.is_active ?? true,
      },
      include: {
        ledger: {
          select: { id: true, accountCode: true, accountName: true, type: true },
        },
      },
    });
    return { data };
  }

  async updateBankAccount(
    companyId: string,
    bankAccountId: string,
    dto: UpdateBankAccountDto,
  ) {
    const current = await this.prisma.companyBankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });
    if (!current) throw new NotFoundException('Bank account not found');
    if (dto.ledger_id !== undefined) {
      await this.assertLedger(companyId, dto.ledger_id);
    }
    const masked =
      dto.account_number !== undefined
        ? this.maskAccountNumber(dto.account_number)
        : null;
    const data = await this.prisma.companyBankAccount.update({
      where: { id: bankAccountId },
      data: {
        ledgerId: dto.ledger_id !== undefined ? dto.ledger_id || null : undefined,
        nickname: dto.nickname?.trim(),
        bankName: dto.bank_name?.trim(),
        branchName: dto.branch_name !== undefined ? dto.branch_name?.trim() || null : undefined,
        accountHolderName:
          dto.account_holder_name !== undefined
            ? dto.account_holder_name?.trim() || null
            : undefined,
        accountNumberMasked: masked ? masked.accountNumberMasked : undefined,
        accountNumberLast4: masked ? masked.accountNumberLast4 : undefined,
        ifscCode: dto.ifsc_code !== undefined ? dto.ifsc_code?.trim() || null : undefined,
        upiHandle: dto.upi_handle !== undefined ? dto.upi_handle?.trim() || null : undefined,
        isActive: dto.is_active,
      },
      include: {
        ledger: {
          select: { id: true, accountCode: true, accountName: true, type: true },
        },
      },
    });
    return { data };
  }

  async listCollectionTasks(args: {
    companyId: string;
    status?: string;
    assignedToUserId?: string;
    customerId?: string;
  }) {
    const data = await this.prisma.collectionTask.findMany({
      where: {
        companyId: args.companyId,
        ...(args.status ? { status: args.status } : {}),
        ...(args.assignedToUserId ? { assignedToUserId: args.assignedToUserId } : {}),
        ...(args.customerId ? { customerId: args.customerId } : {}),
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            dueDate: true,
            total: true,
            balanceDue: true,
            status: true,
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        salesperson: { select: { id: true, name: true, email: true } },
      },
    });
    return { data };
  }

  async createCollectionTask(companyId: string, dto: CreateCollectionTaskDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customer_id, companyId, deletedAt: null },
      select: { id: true, salespersonUserId: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.invoice_id) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoice_id, companyId, customerId: dto.customer_id },
        select: { id: true },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
    }

    await this.assertUser(companyId, dto.assigned_to_user_id);
    await this.assertUser(companyId, dto.salesperson_user_id);

    const data = await this.prisma.collectionTask.create({
      data: {
        companyId,
        customerId: dto.customer_id,
        invoiceId: dto.invoice_id ?? null,
        assignedToUserId: dto.assigned_to_user_id ?? null,
        salespersonUserId:
          dto.salesperson_user_id ?? customer.salespersonUserId ?? null,
        status: dto.status?.trim() || 'open',
        priority: dto.priority?.trim() || 'normal',
        channel: dto.channel?.trim() || null,
        dueDate: this.parseOptionalDate(dto.due_date),
        nextActionDate: this.parseOptionalDate(dto.next_action_date),
        promiseToPayDate: this.parseOptionalDate(dto.promise_to_pay_date),
        promiseToPayAmount: dto.promise_to_pay_amount
          ? new Decimal(dto.promise_to_pay_amount)
          : null,
        outcome: dto.outcome?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            dueDate: true,
            total: true,
            balanceDue: true,
            status: true,
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        salesperson: { select: { id: true, name: true, email: true } },
      },
    });
    return { data };
  }

  async updateCollectionTask(
    companyId: string,
    taskId: string,
    dto: UpdateCollectionTaskDto,
  ) {
    const current = await this.prisma.collectionTask.findFirst({
      where: { id: taskId, companyId },
    });
    if (!current) throw new NotFoundException('Collection task not found');
    if (dto.customer_id) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customer_id, companyId, deletedAt: null },
        select: { id: true },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    }
    if (dto.invoice_id) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoice_id, companyId },
        select: { id: true },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
    }
    await this.assertUser(companyId, dto.assigned_to_user_id);
    await this.assertUser(companyId, dto.salesperson_user_id);

    const data = await this.prisma.collectionTask.update({
      where: { id: taskId },
      data: {
        customerId: dto.customer_id ?? undefined,
        invoiceId: dto.invoice_id !== undefined ? dto.invoice_id || null : undefined,
        assignedToUserId:
          dto.assigned_to_user_id !== undefined
            ? dto.assigned_to_user_id || null
            : undefined,
        salespersonUserId:
          dto.salesperson_user_id !== undefined
            ? dto.salesperson_user_id || null
            : undefined,
        status: dto.status?.trim(),
        priority: dto.priority?.trim(),
        channel: dto.channel !== undefined ? dto.channel?.trim() || null : undefined,
        dueDate:
          dto.due_date !== undefined ? this.parseOptionalDate(dto.due_date) : undefined,
        nextActionDate:
          dto.next_action_date !== undefined
            ? this.parseOptionalDate(dto.next_action_date)
            : undefined,
        promiseToPayDate:
          dto.promise_to_pay_date !== undefined
            ? this.parseOptionalDate(dto.promise_to_pay_date)
            : undefined,
        promiseToPayAmount:
          dto.promise_to_pay_amount !== undefined
            ? dto.promise_to_pay_amount
              ? new Decimal(dto.promise_to_pay_amount)
              : null
            : undefined,
        outcome: dto.outcome !== undefined ? dto.outcome?.trim() || null : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            dueDate: true,
            total: true,
            balanceDue: true,
            status: true,
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        salesperson: { select: { id: true, name: true, email: true } },
      },
    });
    return { data };
  }

  async listBankStatementImports(args: {
    companyId: string;
    bankAccountId?: string;
  }) {
    const data = await this.prisma.bankStatementImport.findMany({
      where: {
        companyId: args.companyId,
        ...(args.bankAccountId ? { bankAccountId: args.bankAccountId } : {}),
      },
      orderBy: { importedAt: 'desc' },
      include: {
        bankAccount: {
          select: { id: true, nickname: true, bankName: true, accountNumberLast4: true },
        },
      },
    });
    return { data };
  }

  async importBankStatement(companyId: string, dto: ImportBankStatementDto) {
    const bankAccount = await this.prisma.companyBankAccount.findFirst({
      where: { id: dto.bank_account_id, companyId, isActive: true },
      select: { id: true },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');
    const rows = this.parseStatementRows(dto.csv_content);

    const data = await this.prisma.$transaction(async (tx) => {
      const statementImport = await tx.bankStatementImport.create({
        data: {
          companyId,
          bankAccountId: dto.bank_account_id,
          sourceFilename: dto.source_filename?.trim() || null,
          lineCount: rows.length,
        },
      });

      await tx.bankStatementLine.createMany({
        data: rows.map((row) => ({
          companyId,
          importId: statementImport.id,
          bankAccountId: dto.bank_account_id,
          txnDate: row.txnDate,
          description: row.description,
          reference: row.reference ?? null,
          debit: row.debit,
          credit: row.credit,
          amount: row.amount,
          direction: row.direction,
          closingBalance: row.closingBalance ?? null,
        })),
      });

      return tx.bankStatementImport.findFirstOrThrow({
        where: { id: statementImport.id },
        include: {
          bankAccount: {
            select: {
              id: true,
              nickname: true,
              bankName: true,
              accountNumberLast4: true,
            },
          },
        },
      });
    });

    return { data };
  }

  async listBankStatementLines(args: {
    companyId: string;
    status?: string;
    bankAccountId?: string;
  }) {
    const lines = await this.prisma.bankStatementLine.findMany({
      where: {
        companyId: args.companyId,
        ...(args.status ? { status: args.status } : {}),
        ...(args.bankAccountId ? { bankAccountId: args.bankAccountId } : {}),
      },
      orderBy: [{ txnDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        bankAccount: {
          select: {
            id: true,
            nickname: true,
            bankName: true,
            accountNumberLast4: true,
          },
        },
        import: {
          select: { id: true, sourceFilename: true, importedAt: true },
        },
        matchedPayment: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                customer: { select: { id: true, name: true } },
              },
            },
            purchase: {
              select: { id: true },
            },
          },
        },
      },
    });

    const unmatchedLines = lines.filter((line) => line.status !== 'matched');
    const candidatesByLine = new Map<string, unknown[]>();

    await Promise.all(
      unmatchedLines.map(async (line) => {
        const payments = await this.prisma.payment.findMany({
          where: {
            companyId: args.companyId,
            reconciledAt: null,
            amount: line.amount,
            ...(line.bankAccountId ? { OR: [{ bankAccountId: null }, { bankAccountId: line.bankAccountId }] } : {}),
          },
          orderBy: { paymentDate: 'desc' },
          take: 5,
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                customer: { select: { id: true, name: true } },
              },
            },
            purchase: { select: { id: true } },
          },
        });
        candidatesByLine.set(
          line.id,
          payments.map((payment) => ({
            id: payment.id,
            amount: this.decimalToNumber(payment.amount),
            method: payment.method,
            instrument_status: payment.instrumentStatus,
            payment_date: payment.paymentDate,
            invoice: payment.invoice,
            purchase: payment.purchase,
          })),
        );
      }),
    );

    return {
      data: lines.map((line) => ({
        ...line,
        candidates: candidatesByLine.get(line.id) ?? [],
      })),
    };
  }

  async matchStatementLine(companyId: string, dto: MatchBankStatementLineDto) {
    const data = await this.prisma.$transaction(async (tx) => {
      const line = await tx.bankStatementLine.findFirst({
        where: { id: dto.statement_line_id, companyId },
      });
      if (!line) throw new NotFoundException('Statement line not found');
      if (line.matchedPaymentId) {
        throw new BadRequestException('Statement line is already matched');
      }

      const payment = await tx.payment.findFirst({
        where: { id: dto.payment_id, companyId },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.reconciledAt) {
        throw new BadRequestException('Payment is already reconciled');
      }

      const amountDifference = new Decimal(payment.amount).sub(line.amount).abs();
      if (amountDifference.gt(0)) {
        throw new BadRequestException('Payment amount and statement amount must match exactly');
      }

      const updatedLine = await tx.bankStatementLine.update({
        where: { id: line.id },
        data: {
          matchedPaymentId: payment.id,
          matchedAt: new Date(),
          status: 'matched',
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          reconciledAt: new Date(),
          bankAccountId: payment.bankAccountId ?? line.bankAccountId,
        },
      });

      await tx.bankReconciliationEvent.create({
        data: {
          companyId,
          paymentId: payment.id,
          statementLineId: line.id,
          action: 'matched',
          summary: 'Statement line matched to payment',
          metadata: {
            amount: line.amount.toString(),
            txn_date: line.txnDate.toISOString().slice(0, 10),
          },
        },
      });

      return updatedLine;
    });

    return { data };
  }

  async unmatchStatementLine(
    companyId: string,
    dto: UnmatchBankStatementLineDto,
  ) {
    const data = await this.prisma.$transaction(async (tx) => {
      const line = await tx.bankStatementLine.findFirst({
        where: { id: dto.statement_line_id, companyId },
      });
      if (!line) throw new NotFoundException('Statement line not found');
      if (!line.matchedPaymentId) {
        throw new BadRequestException('Statement line is not matched');
      }

      await tx.bankStatementLine.update({
        where: { id: line.id },
        data: {
          matchedPaymentId: null,
          matchedAt: null,
          status: 'unmatched',
        },
      });

      await tx.payment.update({
        where: { id: line.matchedPaymentId },
        data: { reconciledAt: null },
      });

      await tx.bankReconciliationEvent.create({
        data: {
          companyId,
          paymentId: line.matchedPaymentId,
          statementLineId: line.id,
          action: 'unmatched',
          summary: 'Statement line unmatched from payment',
        },
      });

      return { id: line.id };
    });

    return { data };
  }
}
