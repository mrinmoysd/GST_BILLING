import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { AuthUser } from '../common/auth/auth-user.decorator';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { RbacService } from '../rbac/rbac.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/users')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
export class CompaniesUsersController {
  constructor(private readonly rbac: RbacService) {}

  @Get()
  @RequirePermissions('settings.users.manage')
  async list(@Param('companyId') companyId: string) {
    const rows = await this.rbac.listUsers(companyId);
    return { ok: true, data: rows };
  }

  @Get('/salespeople')
  @RequirePermissions('masters.view')
  async listSalespeople(@Param('companyId') companyId: string) {
    const rows = await this.rbac.listAssignableSalespeople(companyId);
    return { ok: true, data: rows };
  }

  @Post()
  @RequirePermissions('settings.users.manage')
  async invite(
    @Param('companyId') companyId: string,
    @Body() dto: InviteUserDto,
    @AuthUser() user: { sub: string },
  ) {
    const data = await this.rbac.inviteUser(companyId, dto, user.sub);
    return { ok: true, data };
  }

  @Patch('/:userId')
  @RequirePermissions('settings.users.manage')
  async patch(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: PatchUserDto,
    @AuthUser() user: { sub: string },
  ) {
    const updated = await this.rbac.patchUser(companyId, userId, dto, user.sub);
    return { ok: true, data: updated };
  }
}
