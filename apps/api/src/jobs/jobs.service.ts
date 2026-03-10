import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import {
  PDF_JOB_NAME_REGENERATE_INVOICE,
  PDF_QUEUE_NAME,
} from './jobs.constants';

@Injectable()
export class JobsService {
  constructor(@InjectQueue(PDF_QUEUE_NAME) private readonly pdfQueue: Queue) {}

  async enqueueInvoicePdfRegenerate(args: {
    companyId: string;
    invoiceId: string;
  }) {
    const job = await this.pdfQueue.add(
      PDF_JOB_NAME_REGENERATE_INVOICE,
      { companyId: args.companyId, invoiceId: args.invoiceId },
      {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 },
      },
    );

    return { data: { jobId: job.id, status: 'queued' as const } };
  }

  private toJobResponse(job: Job) {
    const state = job.finishedOn
      ? job.failedReason
        ? 'failed'
        : 'succeeded'
      : job.processedOn
        ? 'running'
        : 'queued';

    return {
      data: {
        id: String(job.id),
        name: job.name,
        state,
        created_at: job.timestamp
          ? new Date(job.timestamp).toISOString()
          : null,
        started_at: job.processedOn
          ? new Date(job.processedOn).toISOString()
          : null,
        finished_at: job.finishedOn
          ? new Date(job.finishedOn).toISOString()
          : null,
        failed_reason: job.failedReason ?? null,
      },
    };
  }

  async getJob(args: { jobId: string }) {
    const job = await this.pdfQueue.getJob(args.jobId);
    if (!job) throw new NotFoundException('Job not found');
    return this.toJobResponse(job);
  }
}
