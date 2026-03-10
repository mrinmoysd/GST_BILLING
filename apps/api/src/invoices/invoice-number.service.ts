import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async reserveNextInvoiceNumber(args: {
    tx: Prisma.TransactionClient;
    companyId: string;
    seriesCode?: string;
  }): Promise<{ seriesId: string; invoiceNumber: string }> {
    const code = args.seriesCode?.trim() || 'DEFAULT';

    const series = await args.tx.invoiceSeries.findFirst({
      where: { companyId: args.companyId, code, isActive: true },
    });

    if (!series) {
      throw new NotFoundException(
        `Invoice series '${code}' not found (create one or enable DEFAULT)`,
      );
    }

    // Increment inside the existing transaction.
    // (We avoid Prisma's experimental 'lock' API for compatibility.)
    const locked = await args.tx.invoiceSeries.findUnique({
      where: { id: series.id },
    });
    if (!locked) throw new NotFoundException('Invoice series not found');

    const nextNumber = locked.nextNumber;
    const updatedCount = await args.tx.invoiceSeries.updateMany({
      where: { id: locked.id, nextNumber },
      data: { nextNumber: nextNumber + 1 },
    });

    if (updatedCount.count !== 1) {
      throw new NotFoundException('Invoice series update conflict, retry');
    }

    const updated = { ...locked, nextNumber: nextNumber + 1 };

    const prefix = updated.prefix ?? '';
    const invoiceNumber = `${prefix}${nextNumber}`;

    return { seriesId: updated.id, invoiceNumber };
  }
}
