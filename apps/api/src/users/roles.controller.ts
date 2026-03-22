import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { AuthUser } from '../common/auth/auth-user.decorator';
import { RbacService } from '../rbac/rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/roles')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rbac: RbacService) {}

  @Get()
  @RequirePermissions('settings.roles.manage')
  async list(@Param('companyId') companyId: string) {
    const data = await this.rbac.listRoles(companyId);
    return { ok: true, data };
  }

  @Get('/permissions')
  @RequirePermissions('settings.roles.manage')
  async permissions(@Param('companyId') companyId: string) {
    const data = await this.rbac.listPermissions(companyId);
    return { ok: true, data };
  }

  @Get('/audit')
  @RequirePermissions('settings.roles.manage')
  async audit(@Param('companyId') companyId: string) {
    const data = await this.rbac.listAuditEntries(companyId);
    return { ok: true, data };
  }

  @Post()
  @RequirePermissions('settings.roles.manage')
  async create(
    @Param('companyId') companyId: string,
    @AuthUser() user: { sub: string },
    @Body() dto: CreateRoleDto,
  ) {
    const data = await this.rbac.createRole(
      companyId,
      {
        name: dto.name,
        permission_codes: dto.permission_codes ?? [],
      },
      user.sub,
    );
    return { ok: true, data };
  }

  @Patch('/:roleId')
  @RequirePermissions('settings.roles.manage')
  async patch(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @AuthUser() user: { sub: string },
    @Body() dto: UpdateRoleDto,
  ) {
    const data = await this.rbac.updateRole(
      companyId,
      roleId,
      {
        name: dto.name,
        permission_codes: dto.permission_codes,
      },
      user.sub,
    );
    return { ok: true, data };
  }

  @Delete('/:roleId')
  @RequirePermissions('settings.roles.manage')
  async remove(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @AuthUser() user: { sub: string },
  ) {
    const data = await this.rbac.deleteRole(companyId, roleId, user.sub);
    return { ok: true, data };
  }
}
