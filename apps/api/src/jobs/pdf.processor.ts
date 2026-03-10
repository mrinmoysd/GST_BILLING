import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import {
  PDF_JOB_NAME_REGENERATE_INVOICE,
  PDF_QUEUE_NAME,
} from './jobs.constants';
import { InvoicePdfService } from '../invoices/pdf/invoice-pdf.service';

@Processor(PDF_QUEUE_NAME)
export class PdfProcessor extends WorkerHost {
  constructor(private readonly pdf: InvoicePdfService) {
    super();
  }

  async process(job: Job<{ companyId: string; invoiceId: string }>) {
    if (job.name === PDF_JOB_NAME_REGENERATE_INVOICE) {
      await this.pdf.regenerate({
        companyId: job.data.companyId,
        invoiceId: job.data.invoiceId,
      });
      return { ok: true };
    }

    return { ok: false };
  }
}
