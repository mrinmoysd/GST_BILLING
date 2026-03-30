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
import { INTERNAL_ADMIN_ROLE_DEFINITIONS } from './admin-roles.constants';
import { AdminPermissionGuard } from './admin-permission.guard';
import { RequireAdminPermissions } from './require-admin-permissions.decorator';
import { SuperAdminGuard } from './super-admin.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/internal-users')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard, AdminPermissionGuard)
@RequireAdminPermissions('admin.internal_users.manage')
export class AdminInternalUsersController {
  constructor(private readonly governance: AdminGovernanceService) {}

  @Get('roles')
  async roles() {
    return {
      data: INTERNAL_ADMIN_ROLE_DEFINITIONS.map((role) => ({
        code: role.code,
        label: role.label,
        permissions: role.permissions,
      })),
    };
  }

  @Get()
  async list(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('q') q?: string,
  ) {
    const page = Math.max(1, Number(pageRaw ?? 1));
    const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 20)));
    const { rows, total } = await this.governance.listInternalUsers({
      page,
      limit,
      q,
    });
    return { data: rows, meta: { total, page, limit } };
  }

  @Post()
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      role: string;
      name?: string;
    },
    @Req() req: any,
  ) {
    const created = await this.governance.createInternalUser(body);
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.internal_user.created',
      targetType: 'user',
      targetId: created.id,
      summary: `Created internal admin user ${created.email} with role ${created.role}`,
      metadata: { role: created.role },
    });
    return { data: created };
  }

  @Patch(':userId')
  async update(
    @Param('userId') userId: string,
    @Body()
    body: {
      name?: string;
      role?: string;
      is_active?: boolean;
      password?: string;
    },
    @Req() req: any,
  ) {
    const updated = await this.governance.updateInternalUser(
      userId,
      body,
      req.user?.sub,
    );
    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.internal_user.updated',
      targetType: 'user',
      targetId: updated.id,
      summary: `Updated internal admin user ${updated.email}`,
      metadata: {
        role: updated.role,
        is_active: updated.is_active,
        password_reset: Boolean(body.password),
      },
    });
    return { data: updated };
  }
}
