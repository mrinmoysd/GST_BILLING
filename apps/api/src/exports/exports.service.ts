import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GstService } from '../gst/gst.service';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gst: GstService,
  ) {}

  async createGstr1Export(args: {
    companyId: string;
    from?: string;
    to?: string;
  }) {
    return this.gst.createExport({
      companyId: args.companyId,
      report: 'gstr1',
      format: 'csv',
      from: args.from,
      to: args.to,
    });
  }

  async getJob(args: { companyId: string; jobId: string }) {
    const job = await this.prisma.exportJob.findFirst({
      where: { companyId: args.companyId, id: args.jobId },
    });
    if (!job) throw new NotFoundException('Export job not found');
    return { data: job };
  }

  getDownloadPath(jobId: string) {
    const job = fs
      .readdirSync(this.gst.getExportStorageDir(), { withFileTypes: true })
      .find((entry) => entry.isFile() && entry.name.includes(jobId));
    if (!job) {
      throw new NotFoundException('Export file missing on disk');
    }
    return path.join(this.gst.getExportStorageDir(), job.name);
  }
}
