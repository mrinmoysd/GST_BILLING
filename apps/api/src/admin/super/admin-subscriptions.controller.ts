import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { AdminGovernanceService } from './admin-governance.service';
import { SuperAdminGuard } from './super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';
import { UpdateAdminSubscriptionDto } from './dto/update-admin-subscription.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/subscriptions')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminSubscriptionsController {
  constructor(
    private readonly admin: PlatformAdminService,
    private readonly governance: AdminGovernanceService,
  ) {}

  @Get('plans')
  async plans() {
    return { data: await this.admin.listSubscriptionPlans() };
  }

  @Get()
  async list(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('status') status?: string,
  ) {
    const page = Math.max(1, Number(pageRaw ?? 1));
    const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 20)));
    const { total, rows, summary } = await this.admin.listSubscriptions({
      page,
      limit,
      status,
    });

    return { data: rows, meta: { total, page, limit }, summary };
  }

  @Get(':subscriptionId')
  async detail(@Param('subscriptionId') subscriptionId: string) {
    return { data: await this.admin.getSubscriptionDetail(subscriptionId) };
  }

  @Patch(':subscriptionId')
  async update(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: UpdateAdminSubscriptionDto,
    @Req() req: any,
  ) {
    const updated = await this.admin.updateSubscription(subscriptionId, body);
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.subscription.updated',
      targetType: 'subscription',
      targetId: subscriptionId,
      companyId: updated.company?.id ?? null,
      summary: `Applied ${body.action} to subscription ${updated.id}`,
      metadata: {
        action: body.action,
        plan_code: body.plan_code ?? null,
        note: body.note ?? null,
        status: updated.current?.status ?? null,
      },
    });
    return { data: updated };
  }
}
