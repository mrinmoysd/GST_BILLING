import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { TestNotificationDto } from './dto/test-notification.dto';

type OutboxRow = {
  id: string;
  channel: string;
  toAddress: string | null;
  status: string;
  attempts: number;
  lastError: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  payload: unknown;
  template: {
    code: string;
    subject: string | null;
    body: string;
  } | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatTemplateVars(
    input: string | null | undefined,
    payload: Record<string, unknown>,
  ) {
    if (!input) return input ?? null;

    return input.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
      const value = payload[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  }

  private getProviderWebhookUrl(channel: string) {
    switch (channel) {
      case 'email':
        return process.env.NOTIFICATIONS_EMAIL_WEBHOOK_URL ?? null;
      case 'sms':
        return process.env.NOTIFICATIONS_SMS_WEBHOOK_URL ?? null;
      case 'whatsapp':
        return process.env.NOTIFICATIONS_WHATSAPP_WEBHOOK_URL ?? null;
      case 'inapp':
        return null;
      default:
        return null;
    }
  }

  private mapOutbox(row: OutboxRow) {
    return {
      id: row.id,
      channel: row.channel,
      to_address: row.toAddress,
      status: row.status,
      attempts: row.attempts,
      last_error: row.lastError,
      scheduled_at: row.scheduledAt?.toISOString() ?? null,
      sent_at: row.sentAt?.toISOString() ?? null,
      created_at: row.createdAt.toISOString(),
      template_code: row.template?.code ?? null,
      payload: row.payload ?? {},
    };
  }

  private async deliverOutbox(row: OutboxRow) {
    const payload =
      row.payload && typeof row.payload === 'object'
        ? (row.payload as Record<string, unknown>)
        : {};

    const body = this.formatTemplateVars(row.template?.body ?? null, payload) ?? '';
    const subject =
      this.formatTemplateVars(row.template?.subject ?? null, payload) ?? null;
    const providerUrl = this.getProviderWebhookUrl(row.channel);

    try {
      if (providerUrl) {
        const response = await fetch(providerUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            channel: row.channel,
            to: row.toAddress,
            subject,
            body,
            payload,
            outbox_id: row.id,
          }),
        });

        if (!response.ok) {
          throw new BadRequestException(
            `Provider webhook failed with status ${response.status}`,
          );
        }
      }

      return this.prisma.notificationOutbox.update({
        where: { id: row.id },
        data: {
          status: 'sent',
          attempts: row.attempts + 1,
          lastError: null,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Notification delivery failed';

      return this.prisma.notificationOutbox.update({
        where: { id: row.id },
        data: {
          status: 'failed',
          attempts: row.attempts + 1,
          lastError: message,
          scheduledAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    }
  }

  async listTemplates(companyId: string) {
    const rows = await this.prisma.notificationTemplate.findMany({
      where: { companyId },
      orderBy: [{ code: 'asc' }, { channel: 'asc' }],
    });

    return rows.map(
      (r: {
        id: string;
        code: string;
        channel: string;
        subject: string | null;
        body: string;
        isActive: boolean;
      }) => ({
        id: r.id,
        code: r.code,
        name: r.code,
        channel: r.channel,
        subject: r.subject ?? null,
        body: r.body,
        is_active: r.isActive,
      }),
    );
  }

  async createTemplate(companyId: string, dto: CreateNotificationTemplateDto) {
    const created = await this.prisma.notificationTemplate.create({
      data: {
        companyId,
        code: dto.code,
        channel: dto.channel,
        subject: dto.subject ?? null,
        body: dto.body,
        isActive: dto.is_active ?? true,
      },
    });

    return {
      id: created.id,
      code: created.code,
      name: created.code,
      channel: created.channel,
      subject: created.subject ?? null,
      body: created.body,
      is_active: created.isActive,
    };
  }

  async updateTemplate(
    companyId: string,
    templateId: string,
    dto: UpdateNotificationTemplateDto,
  ) {
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { id: templateId, companyId },
    });
    if (!existing) throw new NotFoundException('Template not found');

    const updated = await this.prisma.notificationTemplate.update({
      where: { id: templateId },
      data: {
        subject: dto.subject ?? undefined,
        body: dto.body ?? undefined,
        isActive: dto.is_active ?? undefined,
      },
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.code,
      channel: updated.channel,
      subject: updated.subject ?? null,
      body: updated.body,
      is_active: updated.isActive,
    };
  }

  async enqueueTest(companyId: string, dto: TestNotificationDto) {
    const tpl = await this.prisma.notificationTemplate.findFirst({
      where: {
        companyId,
        code: dto.template_code,
        channel: dto.channel,
      },
    });
    if (!tpl) throw new NotFoundException('Template not found');

    // MVP for Phase 07: persist to outbox (queued). A worker/provider integration can be added later.
    const created = await this.prisma.notificationOutbox.create({
      data: {
        companyId,
        templateId: tpl.id,
        channel: dto.channel,
        toAddress: dto.to_address,
        payload: (dto.sample_payload ?? {}) as object,
        status: 'queued',
        attempts: 0,
      },
      select: { id: true },
    });

    if (!created.id) throw new BadRequestException('Failed to enqueue');

    return { status: 'queued', outbox_id: created.id };
  }

  async listOutbox(companyId: string) {
    const rows = await this.prisma.notificationOutbox.findMany({
      where: { companyId },
      include: {
        template: {
          select: { code: true, subject: true, body: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    });

    return rows.map((row) => this.mapOutbox(row as OutboxRow));
  }

  async processPending(companyId: string, limit = 20) {
    const rows = await this.prisma.notificationOutbox.findMany({
      where: {
        companyId,
        status: { in: ['queued', 'failed'] },
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      include: {
        template: {
          select: { code: true, subject: true, body: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
      take: limit,
    });

    const processed = [];
    for (const row of rows) {
      const result = await this.deliverOutbox(row as OutboxRow);
      processed.push({
        id: result.id,
        status: result.status,
        attempts: result.attempts,
      });
    }

    return {
      processed_count: processed.length,
      rows: processed,
    };
  }

  async retryOutbox(companyId: string, outboxId: string) {
    const row = await this.prisma.notificationOutbox.findFirst({
      where: { id: outboxId, companyId },
      include: {
        template: {
          select: { code: true, subject: true, body: true },
        },
      },
    });
    if (!row) throw new NotFoundException('Outbox row not found');

    const reset = await this.prisma.notificationOutbox.update({
      where: { id: row.id },
      data: {
        status: 'queued',
        lastError: null,
        scheduledAt: null,
      },
      include: {
        template: {
          select: { code: true, subject: true, body: true },
        },
      },
    });

    const delivered = await this.deliverOutbox(reset as OutboxRow);
    return {
      id: delivered.id,
      status: delivered.status,
      attempts: delivered.attempts,
      last_error: delivered.lastError,
    };
  }
}
