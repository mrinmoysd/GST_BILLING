import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/companies')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminCompaniesController {
  constructor(private readonly admin: PlatformAdminService) {}

  @Get()
  async list(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('q') q?: string,
  ) {
    const page = Math.max(1, Number(pageRaw ?? 1));
    const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 20)));
    const { total, rows } = await this.admin.listCompanies({ page, limit, q });

    return { data: rows, meta: { total, page, limit } };
  }
}
