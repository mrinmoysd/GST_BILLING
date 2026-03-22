import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CheckoutDto } from './dto/checkout.dto';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('/subscription')
  @RequirePermissions('settings.view')
  async getSubscription(@Param('companyId') companyId: string) {
    const sub = await this.billing.getSubscription(companyId);
    return { ok: true, data: sub };
  }

  @Post('/subscription/checkout')
  @RequirePermissions('settings.subscription.manage')
  async checkout(
    @Param('companyId') companyId: string,
    @Body() dto: CheckoutDto,
  ) {
    const data = await this.billing.createCheckoutSession({
      companyId,
      provider: dto.provider,
      planCode: dto.plan_code ?? null,
      successUrl: dto.success_url ?? null,
      cancelUrl: dto.cancel_url ?? null,
    });
    return { ok: true, data };
  }
}
