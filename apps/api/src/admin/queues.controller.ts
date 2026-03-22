import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PDF_QUEUE_NAME } from '../jobs/jobs.constants';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminGuard } from './super/super-admin.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/queues')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class QueuesAdminController {
  constructor(
    @InjectQueue(PDF_QUEUE_NAME) private readonly pdfQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Get('metrics')
  async metrics() {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      exportJobs,
      notifications,
      webhooks,
      files,
      recentFailedExports,
      recentFailedNotifications,
      recentFailedWebhooks,
    ] =
      await Promise.all([
      this.pdfQueue.getWaitingCount(),
      this.pdfQueue.getActiveCount(),
      this.pdfQueue.getCompletedCount(),
      this.pdfQueue.getFailedCount(),
      this.pdfQueue.getDelayedCount(),
      this.prisma.exportJob.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.notificationOutbox.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.webhookEvent.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.file.groupBy({
        by: ['storage'],
        _count: { _all: true },
      }),
      this.prisma.exportJob.findMany({
        where: { status: 'failed' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          error: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),
      this.prisma.notificationOutbox.findMany({
        where: { status: 'failed' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          channel: true,
          lastError: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),
      this.prisma.webhookEvent.findMany({
        where: { status: 'failed' },
        orderBy: { receivedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          provider: true,
          eventType: true,
          error: true,
          receivedAt: true,
        },
      }),
    ]);

    return {
      data: {
        queues: {
          pdf: {
            name: PDF_QUEUE_NAME,
            counts: { waiting, active, completed, failed, delayed },
          },
        },
        export_jobs: exportJobs.reduce<Record<string, number>>((acc, row) => {
          acc[row.status] = row._count._all;
          return acc;
        }, {}),
        notification_outbox: notifications.reduce<Record<string, number>>(
          (acc, row) => {
            acc[row.status] = row._count._all;
            return acc;
          },
          {},
        ),
        webhook_events: webhooks.reduce<Record<string, number>>((acc, row) => {
          acc[row.status] = row._count._all;
          return acc;
        }, {}),
        file_storage: files.reduce<Record<string, number>>((acc, row) => {
          acc[row.storage] = row._count._all;
          return acc;
        }, {}),
        recent_failures: {
          export_jobs: recentFailedExports.map((job) => ({
            id: job.id,
            type: job.type,
            company_name: job.company.name,
            error: job.error,
            created_at: job.createdAt.toISOString(),
          })),
          notifications: recentFailedNotifications.map((item) => ({
            id: item.id,
            channel: item.channel,
            company_name: item.company.name,
            error: item.lastError,
            created_at: item.createdAt.toISOString(),
          })),
          webhooks: recentFailedWebhooks.map((event) => ({
            id: event.id,
            provider: event.provider,
            event_type: event.eventType,
            error: event.error,
            received_at: event.receivedAt.toISOString(),
          })),
        },
      },
    };
  }
}
