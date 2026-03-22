import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { AdminGovernanceService } from './admin-governance.service';
import { SuperAdminGuard } from './super-admin.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/audit-logs')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminAuditController {
  constructor(private readonly governance: AdminGovernanceService) {}

  @Get()
  async list(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('q') q?: string,
    @Query('action') action?: string,
    @Query('actor_user_id') actorUserId?: string,
    @Query('company_id') companyId?: string,
  ) {
    const page = Math.max(1, Number(pageRaw ?? 1));
    const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 20)));
    const { rows, total } = await this.governance.listAuditLogs({
      page,
      limit,
      q,
      action,
      actorUserId,
      companyId,
    });

    return { data: rows, meta: { total, page, limit } };
  }
}

