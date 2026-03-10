import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PDF_QUEUE_NAME } from '../jobs/jobs.constants';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/queues')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class QueuesAdminController {
  constructor(@InjectQueue(PDF_QUEUE_NAME) private readonly pdfQueue: Queue) {}

  @Get('metrics')
  async metrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.pdfQueue.getWaitingCount(),
      this.pdfQueue.getActiveCount(),
      this.pdfQueue.getCompletedCount(),
      this.pdfQueue.getFailedCount(),
      this.pdfQueue.getDelayedCount(),
    ]);

    return {
      data: {
        queues: {
          pdf: {
            name: PDF_QUEUE_NAME,
            counts: { waiting, active, completed, failed, delayed },
          },
        },
      },
    };
  }
}
