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
import { NotificationsService } from './notifications.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { TestNotificationDto } from './dto/test-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('/notification-templates')
  async list(@Param('companyId') companyId: string) {
    const data = await this.notifications.listTemplates(companyId);
    return { ok: true, data };
  }

  @Post('/notification-templates')
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateNotificationTemplateDto,
  ) {
    const data = await this.notifications.createTemplate(companyId, dto);
    return { ok: true, data };
  }

  @Patch('/notification-templates/:templateId')
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
  async test(
    @Param('companyId') companyId: string,
    @Body() dto: TestNotificationDto,
  ) {
    const data = await this.notifications.enqueueTest(companyId, dto);
    return { ok: true, data };
  }
}
