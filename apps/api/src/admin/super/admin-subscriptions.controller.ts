import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { AdminGovernanceService } from './admin-governance.service';
import { AdminPermissionGuard } from './admin-permission.guard';
import { RequireAdminPermissions } from './require-admin-permissions.decorator';
import { SuperAdminGuard } from './super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';
import { CreateAdminSubscriptionPlanDto } from './dto/create-admin-subscription-plan.dto';
import { UpdateAdminSubscriptionDto } from './dto/update-admin-subscription.dto';
import { UpdateAdminSubscriptionOverridesDto } from './dto/update-admin-subscription-overrides.dto';
import { UpdateAdminSubscriptionPlanDto } from './dto/update-admin-subscription-plan.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/subscriptions')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard, AdminPermissionGuard)
@RequireAdminPermissions('admin.subscriptions.manage')
export class AdminSubscriptionsController {
  constructor(
    private readonly admin: PlatformAdminService,
    private readonly governance: AdminGovernanceService,
  ) {}

  @Get('plans')
  async plans() {
    return { data: await this.admin.listSubscriptionPlans() };
  }

  @Post('plans')
  async createPlan(@Body() body: CreateAdminSubscriptionPlanDto, @Req() req: any) {
    const created = await this.admin.createSubscriptionPlan(body);
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.subscription_plan.created',
      targetType: 'subscription_plan',
      targetId: created.id,
      companyId: null,
      summary: `Created subscription plan ${created.code}`,
      metadata: {
        code: created.code,
        name: created.name,
      },
    });
    return { data: created };
  }

  @Patch('plans/:planId')
  async patchPlan(
    @Param('planId') planId: string,
    @Body() body: UpdateAdminSubscriptionPlanDto,
    @Req() req: any,
  ) {
    const updated = await this.admin.updateSubscriptionPlan(planId, body);
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.subscription_plan.updated',
      targetType: 'subscription_plan',
      targetId: updated.id,
      companyId: null,
      summary: `Updated subscription plan ${updated.code}`,
      metadata: {
        code: updated.code,
        name: updated.name,
      },
    });
    return { data: updated };
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

  @Post(':subscriptionId/overrides')
  async overrides(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: UpdateAdminSubscriptionOverridesDto,
    @Req() req: any,
  ) {
    const updated = await this.admin.updateSubscriptionOverrides(
      subscriptionId,
      body,
    );
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.subscription_overrides.updated',
      targetType: 'subscription',
      targetId: subscriptionId,
      companyId: updated.company?.id ?? null,
      summary: `Updated entitlement overrides for subscription ${updated.id}`,
      metadata: {
        overrides: body,
      },
    });
    return { data: updated };
  }
}
