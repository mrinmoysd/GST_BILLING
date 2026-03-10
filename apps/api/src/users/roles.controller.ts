import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyAdminGuard } from '../common/auth/company-admin.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/roles')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, CompanyAdminGuard)
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Param('companyId') companyId: string) {
    // MVP: users use `User.role` string. We still expose DB Roles for future RBAC.
    const roles = await this.prisma.role.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'asc' }],
    });

    const builtIn = [
      { id: 'builtin-owner', name: 'owner', builtin: true },
      { id: 'builtin-admin', name: 'admin', builtin: true },
      { id: 'builtin-staff', name: 'staff', builtin: true },
    ];

    return { ok: true, data: { built_in: builtIn, roles } };
  }
}
