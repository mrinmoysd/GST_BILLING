import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { TestNotificationDto } from './dto/test-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('/notification-templates')
  @RequirePermissions('settings.notifications.manage')
  async list(@Param('companyId') companyId: string) {
    const data = await this.notifications.listTemplates(companyId);
    return { ok: true, data };
  }

  @Post('/notification-templates')
  @RequirePermissions('settings.notifications.manage')
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateNotificationTemplateDto,
  ) {
    const data = await this.notifications.createTemplate(companyId, dto);
    return { ok: true, data };
  }

  @Patch('/notification-templates/:templateId')
  @RequirePermissions('settings.notifications.manage')
  async patch(
    @Param('companyId') companyId: string,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    const data = await this.notifications.updateTemplate(
      companyId,
      templateId,
      dto,
    );
    return { ok: true, data };
  }

  @Post('/notifications/test')
  @RequirePermissions('settings.notifications.manage')
  async test(
    @Param('companyId') companyId: string,
    @Body() dto: TestNotificationDto,
  ) {
    const data = await this.notifications.enqueueTest(companyId, dto);
    return { ok: true, data };
  }

  @Get('/notifications/outbox')
  @RequirePermissions('settings.notifications.manage')
  async outbox(@Param('companyId') companyId: string) {
    const data = await this.notifications.listOutbox(companyId);
    return { ok: true, data };
  }

  @Post('/notifications/process')
  @RequirePermissions('settings.notifications.manage')
  async process(@Param('companyId') companyId: string) {
    const data = await this.notifications.processPending(companyId);
    return { ok: true, data };
  }

  @Post('/notifications/outbox/:outboxId/retry')
  @RequirePermissions('settings.notifications.manage')
  async retry(
    @Param('companyId') companyId: string,
    @Param('outboxId') outboxId: string,
  ) {
    const data = await this.notifications.retryOutbox(companyId, outboxId);
    return { ok: true, data };
  }
}
