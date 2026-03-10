import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import * as fs from 'fs';
import * as path from 'path';

import { toCsv } from './csv.util';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGstr1Export(args: {
    companyId: string;
    from?: string;
    to?: string;
  }) {
    const job = await this.prisma.exportJob.create({
      data: {
        companyId: args.companyId,
        type: 'gstr1_csv',
        status: 'running',
        params: { from: args.from ?? null, to: args.to ?? null },
        startedAt: new Date(),
      },
    });

    try {
      // MVP: GSTR-1 like export from invoices.
      // Limitations: no CGST/SGST/IGST split, POS rules, etc.
      const where: any = {
        companyId: args.companyId,
        status: { in: ['issued', 'paid'] },
      };

      if (args.from || args.to) {
        where.issueDate = {
          ...(args.from ? { gte: new Date(args.from) } : {}),
          ...(args.to ? { lte: new Date(args.to) } : {}),
        };
      }

      const invoices = await this.prisma.invoice.findMany({
        where,
        include: { customer: true },
        orderBy: { issueDate: 'asc' },
      });

      const rows = invoices.map((inv: (typeof invoices)[number]) => ({
        invoice_number: inv.invoiceNumber ?? '',
        invoice_date: inv.issueDate
          ? inv.issueDate.toISOString().slice(0, 10)
          : '',
        customer_name: inv.customer.name,
        customer_gstin: '',
        taxable_value: inv.subTotal.toString(),
        tax_value: inv.taxTotal.toString(),
        invoice_value: inv.total.toString(),
        status: inv.status,
      }));

      const csv = toCsv(rows);

      const storageDir = path.join(process.cwd(), 'storage', 'exports');
      fs.mkdirSync(storageDir, { recursive: true });
      const filename = `gstr1_${job.id}.csv`;
      const filepath = path.join(storageDir, filename);
      fs.writeFileSync(filepath, csv);

      const resultFileUrl = `/api/companies/${args.companyId}/exports/${job.id}/download`;

      const updated = await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: 'succeeded',
          finishedAt: new Date(),
          resultFileUrl,
          resultFileName: filename,
          error: null,
        },
      });

      return { data: updated };
    } catch (e: any) {
      const updated = await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          error: String(e?.message ?? e),
        },
      });

      return { data: updated };
    }
  }

  async getJob(args: { companyId: string; jobId: string }) {
    const job = await this.prisma.exportJob.findFirst({
      where: { companyId: args.companyId, id: args.jobId },
    });
    if (!job) throw new NotFoundException('Export job not found');
    return { data: job };
  }

  getDownloadPath(jobId: string) {
    const storageDir = path.join(process.cwd(), 'storage', 'exports');
    return path.join(storageDir, `gstr1_${jobId}.csv`);
  }
}
