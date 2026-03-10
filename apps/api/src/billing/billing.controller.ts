import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/subscription')
  async getSubscription(@Param('companyId') companyId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });
    return { ok: true, data: sub };
  }

  @Post('/subscription/checkout')
  async checkout(
    @Param('companyId') companyId: string,
    @Body() dto: CheckoutDto,
  ) {
    // MVP: create a pending subscription record; provider checkout session creation can be plugged in later.
    const created = await this.prisma.subscription.create({
      data: {
        companyId,
        plan: dto.plan_code ?? null,
        provider: dto.provider,
        status: 'pending',
        metadata: {
          success_url: dto.success_url ?? null,
          cancel_url: dto.cancel_url ?? null,
        } as object,
      },
      select: { id: true },
    });

    return {
      ok: true,
      data: {
        status: 'pending',
        checkout_url: null,
        subscription_id: created.id,
      },
    };
  }
}
