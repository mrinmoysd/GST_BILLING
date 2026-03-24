import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type PermissionDefinition = {
  code: string;
  group: string;
  description: string;
};

type AdminAuditEntry = {
  id: string;
  action: string;
  actor_user_id: string;
  actor_email?: string | null;
  target_type: string;
  target_id?: string | null;
  summary: string;
  created_at: string;
};

const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { code: 'dashboard.view', group: 'workspace', description: 'View the company dashboard' },
  { code: 'masters.view', group: 'masters', description: 'View customers, suppliers, products, and categories' },
  { code: 'masters.manage', group: 'masters', description: 'Create and update master records' },
  { code: 'sales.view', group: 'sales', description: 'View invoices and sales flows' },
  { code: 'sales.manage', group: 'sales', description: 'Create and modify invoices' },
  { code: 'purchases.view', group: 'purchases', description: 'View purchases and vendor activity' },
  { code: 'purchases.manage', group: 'purchases', description: 'Create and modify purchases' },
  { code: 'payments.view', group: 'payments', description: 'View payment activity' },
  { code: 'payments.manage', group: 'payments', description: 'Record and adjust payments' },
  { code: 'inventory.view', group: 'inventory', description: 'View inventory and stock movement pages' },
  { code: 'inventory.manage', group: 'inventory', description: 'Create stock adjustments and inventory changes' },
  { code: 'accounting.view', group: 'accounting', description: 'View accounting pages and reports' },
  { code: 'accounting.manage', group: 'accounting', description: 'Create or update accounting data' },
  { code: 'reports.view', group: 'reports', description: 'View operational and financial reports' },
  { code: 'settings.view', group: 'settings', description: 'Open settings surfaces' },
  { code: 'settings.company.manage', group: 'settings', description: 'Manage company profile and GST settings' },
  { code: 'settings.invoice_series.manage', group: 'settings', description: 'Manage invoice series' },
  { code: 'settings.users.manage', group: 'settings', description: 'Invite users and update user access' },
  { code: 'settings.roles.manage', group: 'settings', description: 'Create and maintain custom roles' },
  { code: 'settings.notifications.manage', group: 'settings', description: 'Manage notification templates and test sends' },
  { code: 'settings.subscription.manage', group: 'settings', description: 'Manage subscription and billing setup' },
];

const ALL_PERMISSION_CODES = ALL_PERMISSION_DEFINITIONS.map(
  (permission) => permission.code,
);

const STAFF_PERMISSION_CODES = [
  'dashboard.view',
  'masters.view',
  'masters.manage',
  'sales.view',
  'sales.manage',
  'purchases.view',
  'purchases.manage',
  'payments.view',
  'payments.manage',
  'inventory.view',
  'inventory.manage',
  'reports.view',
];

const BUILTIN_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ALL_PERMISSION_CODES,
  admin: ALL_PERMISSION_CODES,
  staff: STAFF_PERMISSION_CODES,
};

const RESERVED_ROLE_NAMES = new Set(Object.keys(BUILTIN_ROLE_PERMISSIONS));

type EffectiveAccess = {
  primaryRole: string;
  assignedRoles: string[];
  permissions: string[];
};

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeBuiltinRole(roleName: string) {
    const normalized = roleName.trim().toLowerCase();
    return BUILTIN_ROLE_PERMISSIONS[normalized] ? normalized : roleName.trim();
  }

  async ensureCompanyRbac(companyId: string) {
    for (const permission of ALL_PERMISSION_DEFINITIONS) {
      await this.prisma.permission.upsert({
        where: {
          companyId_code: {
            companyId,
            code: permission.code,
          },
        },
        update: {
          description: permission.description,
        },
        create: {
          companyId,
          code: permission.code,
          description: permission.description,
        },
      });
    }
  }

  async listPermissions(companyId: string) {
    await this.ensureCompanyRbac(companyId);
    return ALL_PERMISSION_DEFINITIONS;
  }

  async listRoles(companyId: string) {
    await this.ensureCompanyRbac(companyId);

    const roles = await this.prisma.role.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    const builtIn = Object.entries(BUILTIN_ROLE_PERMISSIONS).map(
      ([name, permissions]) => ({
        id: `builtin-${name}`,
        name,
        builtin: true as const,
        permissions,
        user_count: 0,
      }),
    );

    const builtInCounts = await this.prisma.user.groupBy({
      by: ['role'],
      where: { companyId },
      _count: { role: true },
    });

    for (const builtInRole of builtIn) {
      builtInRole.user_count =
        builtInCounts.find((row) => row.role === builtInRole.name)?._count.role ??
        0;
    }

    return {
      built_in: builtIn,
      roles: roles.map((role) => ({
        id: role.id,
        companyId: role.companyId,
        name: role.name,
        permissions: role.rolePermissions.map(
          (rolePermission) => rolePermission.permission.code,
        ),
        user_count: role._count.userRoles,
        createdAt: role.createdAt,
      })),
      permissions: ALL_PERMISSION_DEFINITIONS,
      audit: await this.listAuditEntries(companyId),
    };
  }

  async createRole(
    companyId: string,
    dto: { name: string; permission_codes: string[] },
    actorUserId: string,
  ) {
    await this.ensureCompanyRbac(companyId);

    const normalizedName = dto.name.trim().toLowerCase();
    this.assertCustomRoleName(normalizedName);

    const permissions = await this.getPermissionsForCodes(
      companyId,
      dto.permission_codes,
    );

    const role = await this.prisma.role.create({
      data: {
        companyId,
        name: normalizedName,
        rolePermissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.recordAdminActivity(companyId, actorUserId, {
      action: 'role.created',
      targetType: 'role',
      targetId: role.id,
      summary: `Created custom role "${role.name}"`,
    });

    return {
      id: role.id,
      companyId: role.companyId,
      name: role.name,
      permissions: role.rolePermissions.map((item) => item.permission.code),
      createdAt: role.createdAt,
    };
  }

  async updateRole(
    companyId: string,
    roleId: string,
    dto: { name?: string; permission_codes?: string[] },
    actorUserId: string,
  ) {
    const existing = await this.prisma.role.findFirst({
      where: { id: roleId, companyId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    if (!existing) throw new NotFoundException('Role not found');

    const normalizedName = dto.name?.trim().toLowerCase();
    if (normalizedName) {
      this.assertCustomRoleName(normalizedName);
    }

    let permissionIds: string[] | undefined;
    if (dto.permission_codes) {
      const permissions = await this.getPermissionsForCodes(
        companyId,
        dto.permission_codes,
      );
      permissionIds = permissions.map((permission) => permission.id);
    }

    const role = await this.prisma.$transaction(async (tx) => {
      if (permissionIds) {
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });
      }

      return tx.role.update({
        where: { id: roleId },
        data: {
          name: normalizedName,
          rolePermissions: permissionIds
            ? {
                create: permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              }
            : undefined,
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    await this.recordAdminActivity(companyId, actorUserId, {
      action: 'role.updated',
      targetType: 'role',
      targetId: role.id,
      summary: `Updated custom role "${role.name}"`,
    });

    return {
      id: role.id,
      companyId: role.companyId,
      name: role.name,
      permissions: role.rolePermissions.map((item) => item.permission.code),
      createdAt: role.createdAt,
    };
  }

  async deleteRole(companyId: string, roleId: string, actorUserId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId },
      select: { id: true, name: true },
    });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    await this.recordAdminActivity(companyId, actorUserId, {
      action: 'role.deleted',
      targetType: 'role',
      targetId: role.id,
      summary: `Deleted custom role "${role.name}"`,
    });

    return { deleted: true };
  }

  async listUsers(companyId: string) {
    await this.ensureCompanyRbac(companyId);

    const users = await this.prisma.user.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return users.map((user) => {
      const access = this.collectEffectiveAccess({
        primaryRole: user.role,
        customRoles: user.userRoles.map((userRole) => userRole.role),
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: access.primaryRole,
        assigned_roles: access.assignedRoles,
        permissions: access.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      };
    });
  }

  async inviteUser(
    companyId: string,
    dto: {
      email: string;
      name?: string;
      role?: string;
      primary_role?: string;
      role_ids?: string[];
      is_active?: boolean;
      temp_password?: string;
    },
    actorUserId: string,
  ) {
    await this.ensureCompanyRbac(companyId);
    const { default: bcrypt } = await import('bcryptjs');

    const primaryRole = this.normalizePrimaryRole(
      dto.primary_role ?? dto.role ?? 'staff',
    );
    const roleIds = await this.validateRoleIds(companyId, dto.role_ids ?? []);

    const tempPassword =
      dto.temp_password ?? Math.random().toString(36).slice(2) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const created = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email.trim().toLowerCase(),
        name: dto.name?.trim() || null,
        role: primaryRole,
        isActive: dto.is_active ?? true,
        passwordHash,
        userRoles: {
          create: roleIds.map((roleId) => ({
            roleId,
          })),
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await this.recordAdminActivity(companyId, actorUserId, {
      action: 'user.invited',
      targetType: 'user',
      targetId: created.id,
      summary: `Invited ${created.email} with primary role "${created.role}"`,
    });

    const access = this.collectEffectiveAccess({
      primaryRole: created.role,
      customRoles: created.userRoles.map((userRole) => userRole.role),
    });

    return {
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        assigned_roles: access.assignedRoles,
        permissions: access.permissions,
        isActive: created.isActive,
        createdAt: created.createdAt,
      },
      dev: {
        temporary_password: tempPassword,
      },
    };
  }

  async patchUser(
    companyId: string,
    userId: string,
    dto: {
      name?: string;
      role?: string;
      primary_role?: string;
      role_ids?: string[];
      is_active?: boolean;
    },
    actorUserId: string,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existing) throw new NotFoundException('User not found');

    const primaryRole = dto.primary_role ?? dto.role;
    const normalizedPrimaryRole = primaryRole
      ? this.normalizePrimaryRole(primaryRole)
      : undefined;
    const roleIds =
      dto.role_ids !== undefined
        ? await this.validateRoleIds(companyId, dto.role_ids)
        : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (roleIds) {
        await tx.userRole.deleteMany({
          where: { userId },
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          name: dto.name ?? undefined,
          role: normalizedPrimaryRole ?? undefined,
          isActive: dto.is_active ?? undefined,
          userRoles: roleIds
            ? {
                create: roleIds.map((roleId) => ({ roleId })),
              }
            : undefined,
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    await this.recordAdminActivity(companyId, actorUserId, {
      action: 'user.updated',
      targetType: 'user',
      targetId: updated.id,
      summary: `Updated access for ${updated.email}`,
    });

    const access = this.collectEffectiveAccess({
      primaryRole: updated.role,
      customRoles: updated.userRoles.map((userRole) => userRole.role),
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      assigned_roles: access.assignedRoles,
      permissions: access.permissions,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      lastLogin: updated.lastLogin,
    };
  }

  async getEffectiveAccessForUser(userId: string): Promise<EffectiveAccess> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedAccessError();

    return this.collectEffectiveAccess({
      primaryRole: user.role,
      customRoles: user.userRoles.map((userRole) => userRole.role),
    });
  }

  async hasPermissions(userId: string, permissions: string[]) {
    if (permissions.length === 0) return true;
    const access = await this.getEffectiveAccessForUser(userId);
    return permissions.every((permission) =>
      access.permissions.includes(permission),
    );
  }

  async assertHasPermissions(userId: string, permissions: string[]) {
    const ok = await this.hasPermissions(userId, permissions);
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  async getSessionAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const access = this.collectEffectiveAccess({
      primaryRole: user.role,
      customRoles: user.userRoles.map((userRole) => userRole.role),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: access.primaryRole,
        assigned_roles: access.assignedRoles,
        permissions: access.permissions,
        company_id: user.companyId,
      },
      company: user.company,
    };
  }

  async listAuditEntries(companyId: string): Promise<AdminAuditEntry[]> {
    await this.backfillAdminAuditEntries(companyId);

    const rows = await this.prisma.adminAuditLog.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      actor_user_id: row.actorUserId ?? '',
      actor_email: row.actorEmail ?? null,
      target_type: row.targetType,
      target_id: row.targetId ?? null,
      summary: row.summary,
      created_at: row.createdAt.toISOString(),
    }));
  }

  private async backfillAdminAuditEntries(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { invoiceSettings: true },
    });
    const invoiceSettings =
      company?.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? (company.invoiceSettings as Record<string, unknown>)
        : {};
    const entries = invoiceSettings.admin_activity_log;
    if (!Array.isArray(entries) || entries.length === 0) return;

    const existing = await this.prisma.adminAuditLog.count({
      where: { companyId },
    });
    if (existing > 0) return;

    await this.prisma.adminAuditLog.createMany({
      data: (entries as AdminAuditEntry[]).map((entry) => ({
        id: entry.id,
        companyId,
        actorUserId: entry.actor_user_id ?? null,
        actorEmail: entry.actor_email ?? null,
        action: entry.action,
        targetType: entry.target_type,
        targetId: entry.target_id ?? null,
        summary: entry.summary,
        metadata: {},
        createdAt: new Date(entry.created_at),
      })),
      skipDuplicates: true,
    });
  }

  async recordAdminActivity(
    companyId: string,
    actorUserId: string,
    event: {
      action: string;
      targetType: string;
      targetId?: string | null;
      summary: string;
    },
  ) {
    const [company, actor] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { invoiceSettings: true },
      }),
      this.prisma.user.findUnique({
        where: { id: actorUserId },
        select: { email: true },
      }),
    ]);

    const invoiceSettings =
      company?.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? (company.invoiceSettings as Record<string, unknown>)
        : {};
    const existingEntries = Array.isArray(invoiceSettings.admin_activity_log)
      ? (invoiceSettings.admin_activity_log as AdminAuditEntry[])
      : [];

    const nextEntry: AdminAuditEntry = {
      id: crypto.randomUUID(),
      action: event.action,
      actor_user_id: actorUserId,
      actor_email: actor?.email ?? null,
      target_type: event.targetType,
      target_id: event.targetId ?? null,
      summary: event.summary,
      created_at: new Date().toISOString(),
    };

    await this.prisma.adminAuditLog.create({
      data: {
        companyId,
        actorUserId,
        actorEmail: actor?.email ?? null,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId ?? null,
        summary: event.summary,
        metadata: {},
      },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        invoiceSettings: {
          ...invoiceSettings,
          admin_activity_log: [nextEntry, ...existingEntries].slice(0, 100),
        } as any,
      },
    });
  }

  private assertCustomRoleName(roleName: string) {
    if (!roleName) throw new BadRequestException('Role name is required');
    if (RESERVED_ROLE_NAMES.has(roleName)) {
      throw new BadRequestException(
        'Built-in role names cannot be reused for custom roles',
      );
    }
  }

  private normalizePrimaryRole(roleName: string) {
    const normalized = roleName.trim().toLowerCase();
    if (!BUILTIN_ROLE_PERMISSIONS[normalized]) {
      throw new BadRequestException('Invalid primary role');
    }
    return normalized;
  }

  private async getPermissionsForCodes(companyId: string, codes: string[]) {
    const normalized = [...new Set(codes.map((code) => code.trim()))].filter(
      Boolean,
    );
    const invalid = normalized.filter(
      (code) =>
        !ALL_PERMISSION_DEFINITIONS.some((permission) => permission.code === code),
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unknown permission codes: ${invalid.join(', ')}`,
      );
    }

    return this.prisma.permission.findMany({
      where: {
        companyId,
        code: { in: normalized },
      },
    });
  }

  private async validateRoleIds(companyId: string, roleIds: string[]) {
    const uniqueIds = [...new Set(roleIds)];
    if (uniqueIds.length === 0) return [];

    const roles = await this.prisma.role.findMany({
      where: {
        companyId,
        id: { in: uniqueIds },
      },
      select: { id: true },
    });

    if (roles.length !== uniqueIds.length) {
      throw new BadRequestException('One or more custom roles were not found');
    }

    return uniqueIds;
  }

  private collectEffectiveAccess(input: {
    primaryRole: string;
    customRoles: Array<{
      id: string;
      name: string;
      rolePermissions: Array<{
        permission: {
          code: string;
        };
      }>;
    }>;
  }): EffectiveAccess {
    const normalizedPrimaryRole = this.normalizeBuiltinRole(input.primaryRole);
    const permissions = new Set<string>(
      BUILTIN_ROLE_PERMISSIONS[normalizedPrimaryRole] ?? [],
    );
    const assignedRoles = [normalizedPrimaryRole];

    for (const customRole of input.customRoles) {
      assignedRoles.push(customRole.name);
      for (const rolePermission of customRole.rolePermissions) {
        permissions.add(rolePermission.permission.code);
      }
    }

    return {
      primaryRole: normalizedPrimaryRole,
      assignedRoles,
      permissions: [...permissions].sort(),
    };
  }
}

class UnauthorizedAccessError extends NotFoundException {
  constructor() {
    super('User not found');
  }
}
