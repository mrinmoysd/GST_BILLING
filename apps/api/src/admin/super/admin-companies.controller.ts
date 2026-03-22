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
import { SuperAdminGuard } from './super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';
import { CreateAdminCompanyDto } from './dto/create-admin-company.dto';
import { UpdateAdminCompanyLifecycleDto } from './dto/update-admin-company-lifecycle.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/companies')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminCompaniesController {
  constructor(
    private readonly admin: PlatformAdminService,
    private readonly governance: AdminGovernanceService,
  ) {}

  @Post()
  async create(@Body() body: CreateAdminCompanyDto, @Req() req: any) {
    const created = await this.admin.createCompany(body);
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.company.created',
      targetType: 'company',
      targetId: created.id,
      companyId: created.id,
      summary: `Created company ${created.name}`,
      metadata: {
        gstin: created.gstin,
        owner_email: created.owner?.email ?? null,
      },
    });
    return { data: created };
  }

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

  @Get(':companyId')
  async detail(@Param('companyId') companyId: string) {
    return { data: await this.admin.getCompanyDetail(companyId) };
  }

  @Patch(':companyId/lifecycle')
  async updateLifecycle(
    @Param('companyId') companyId: string,
    @Body() body: UpdateAdminCompanyLifecycleDto,
    @Req() req: any,
  ) {
    const updated = await this.admin.updateCompanyLifecycle(companyId, body);
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.company.lifecycle_updated',
      targetType: 'company',
      targetId: companyId,
      companyId,
      summary: `Marked company ${updated.name} as ${updated.lifecycle?.status ?? body.action}`,
      metadata: {
        action: body.action,
        note: body.note ?? null,
      },
    });
    return { data: updated };
  }
}
