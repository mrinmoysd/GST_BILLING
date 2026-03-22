import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/dashboard')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminDashboardController {
  constructor(private readonly admin: PlatformAdminService) {}

  @Get()
  async summary() {
    return { data: await this.admin.dashboardSummary() };
  }
}
