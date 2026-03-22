import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import {
  INTERNAL_ADMIN_ROLE_DEFINITIONS,
  getInternalAdminPermissions,
  isInternalAdminRole,
} from './admin-roles.constants';

@Injectable()
export class AdminGovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  listRoleCatalog() {
    return INTERNAL_ADMIN_ROLE_DEFINITIONS.map((role) => ({
      code: role.code,
      label: role.label,
      permissions: [...role.permissions],
    }));
  }

  async listInternalUsers(args: {
    page: number;
    limit: number;
    q?: string;
  }) {
    const skip = (args.page - 1) * args.limit;
    const where = {
      role: { in: INTERNAL_ADMIN_ROLE_DEFINITIONS.map((role) => role.code) },
      ...(args.q
        ? {
            OR: [
              { email: { contains: args.q, mode: 'insensitive' as const } },
              { name: { contains: args.q, mode: 'insensitive' as const } },
              { role: { contains: args.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: args.limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      total,
      rows: rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        permissions: getInternalAdminPermissions(row.role),
        is_active: row.isActive,
        is_super_admin: row.role === 'super_admin',
        last_login: row.lastLogin?.toISOString() ?? null,
        created_at: row.createdAt.toISOString(),
      })),
    };
  }

  async createInternalUser(dto: {
    email: string;
    password: string;
    role: string;
    name?: string;
  }) {
    const role = dto.role.trim();
    if (!isInternalAdminRole(role)) {
      throw new BadRequestException('Invalid internal admin role');
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An internal user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.prisma.user.create({
      data: {
        companyId: null,
        email,
        name: dto.name?.trim() || null,
        role,
        isActive: true,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      permissions: getInternalAdminPermissions(created.role),
      is_active: created.isActive,
      is_super_admin: created.role === 'super_admin',
      last_login: created.lastLogin?.toISOString() ?? null,
      created_at: created.createdAt.toISOString(),
    };
  }

  async updateInternalUser(
    userId: string,
    dto: {
      name?: string;
      role?: string;
      is_active?: boolean;
      password?: string;
    },
    actorUserId?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    if (!existing || !isInternalAdminRole(existing.role)) {
      throw new NotFoundException('Internal admin user not found');
    }

    if (dto.role && !isInternalAdminRole(dto.role.trim())) {
      throw new BadRequestException('Invalid internal admin role');
    }

    if (actorUserId && actorUserId === existing.id && dto.is_active === false) {
      throw new BadRequestException('You cannot deactivate your own admin account');
    }

    const nextRole = dto.role?.trim() || existing.role;
    const nextName = dto.name === undefined ? undefined : dto.name.trim() || null;
    const passwordHash =
      dto.password && dto.password.trim().length > 0
        ? await bcrypt.hash(dto.password, 10)
        : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.user.update({
        where: { id: existing.id },
        data: {
          name: nextName,
          role: dto.role === undefined ? undefined : nextRole,
          isActive: dto.is_active,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (
        dto.is_active === false ||
        passwordHash !== undefined ||
        dto.role !== undefined
      ) {
        await tx.session.updateMany({
          where: {
            userId: existing.id,
            companyId: null,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }

      return row;
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      permissions: getInternalAdminPermissions(updated.role),
      is_active: updated.isActive,
      is_super_admin: updated.role === 'super_admin',
      last_login: updated.lastLogin?.toISOString() ?? null,
      created_at: updated.createdAt.toISOString(),
    };
  }

  async listAuditLogs(args: {
    page: number;
    limit: number;
    q?: string;
    action?: string;
    actorUserId?: string;
    companyId?: string;
  }) {
    const skip = (args.page - 1) * args.limit;
    const where = {
      ...(args.action ? { action: args.action } : {}),
      ...(args.actorUserId ? { actorUserId: args.actorUserId } : {}),
      ...(args.companyId ? { companyId: args.companyId } : {}),
      ...(args.q
        ? {
            OR: [
              { summary: { contains: args.q, mode: 'insensitive' as const } },
              { actorEmail: { contains: args.q, mode: 'insensitive' as const } },
              { targetId: { contains: args.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.internalAdminAuditLog.count({ where }),
      this.prisma.internalAdminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
        include: {
          actor: {
            select: { id: true, email: true, name: true, role: true },
          },
          company: {
            select: { id: true, name: true, gstin: true },
          },
        },
      }),
    ]);

    return {
      total,
      rows: rows.map((row) => ({
        id: row.id,
        action: row.action,
        target_type: row.targetType,
        target_id: row.targetId,
        summary: row.summary,
        metadata: row.metadata,
        created_at: row.createdAt.toISOString(),
        actor: row.actor
          ? {
              id: row.actor.id,
              email: row.actor.email,
              name: row.actor.name,
              role: row.actor.role,
            }
          : {
              id: row.actorUserId,
              email: row.actorEmail,
              name: null,
              role: row.adminRole,
            },
        company: row.company
          ? {
              id: row.company.id,
              name: row.company.name,
              gstin: row.company.gstin,
            }
          : null,
      })),
    };
  }

  async logAction(args: {
    actorUserId?: string | null;
    actorEmail?: string | null;
    adminRole?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    companyId?: string | null;
    summary: string;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.prisma.internalAdminAuditLog.create({
      data: {
        actorUserId: args.actorUserId ?? null,
        actorEmail: args.actorEmail ?? null,
        adminRole: args.adminRole ?? null,
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId ?? null,
        companyId: args.companyId ?? null,
        summary: args.summary,
        metadata:
          (args.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  }
}
