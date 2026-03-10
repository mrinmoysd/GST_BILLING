import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/usage')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminUsageController {
  constructor(private readonly admin: PlatformAdminService) {}

  @Get()
  async summary(@Query('from') from?: string, @Query('to') to?: string) {
    const fromDt = from ? new Date(from) : undefined;
    const toDt = to ? new Date(to) : undefined;

    const data = await this.admin.usageSummary({ from: fromDt, to: toDt });
    return { data };
  }
}
