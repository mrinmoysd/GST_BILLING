import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { TestNotificationDto } from './dto/test-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
