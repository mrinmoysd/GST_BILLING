import {
  Req,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../../auth/guards/jwt-access-auth.guard';
import { AdminGovernanceService } from './admin-governance.service';
import { SuperAdminGuard } from './super-admin.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/support-tickets')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminSupportTicketsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: AdminGovernanceService,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, Number(limit))) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status: String(status) } : {};

    const [total, rows, companyUsers] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      this.prisma.user.findMany({
        select: {
          email: true,
          companyId: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const companyByEmail = new Map(
      companyUsers
        .filter((row) => row.email && row.companyId)
        .map((row) => [
          String(row.email).toLowerCase(),
          {
            company_id: row.companyId,
            company_name: row.company?.name ?? null,
          },
        ]),
    );

    return {
      data: rows.map(
        (t: {
          id: string;
          email: string | null;
          name: string | null;
          subject: string | null;
          message: string;
          status: string;
          priority: string;
          metadata?: unknown;
          createdAt: Date;
          updatedAt: Date;
        }) => {
          const metadata =
            t.metadata && typeof t.metadata === 'object'
              ? (t.metadata as Record<string, unknown>)
              : {};
          const company = t.email
            ? companyByEmail.get(String(t.email).toLowerCase()) ?? null
            : null;

          return {
            id: t.id,
            email: t.email,
            name: t.name,
            subject: t.subject,
            message: t.message,
            status: t.status,
            priority: t.priority,
            created_at: t.createdAt.toISOString(),
            updated_at: t.updatedAt.toISOString(),
            assignee: typeof metadata.assignee === 'string' ? metadata.assignee : null,
            internal_note:
              typeof metadata.internal_note === 'string'
                ? metadata.internal_note
                : null,
            company_id: company?.company_id ?? null,
            company_name: company?.company_name ?? null,
          };
        },
      ),
      meta: { total, page: pageNum, limit: limitNum },
    };
  }

  @Patch('/:id')
  async patch(
    @Param('id') id: string,
    @Body()
    body: {
      status?: string;
      priority?: string;
      assignee?: string;
      internal_note?: string;
    },
    @Req() req: any,
  ) {
    const current = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: { metadata: true },
    });
    const metadata =
      current?.metadata && typeof current.metadata === 'object'
        ? ({ ...(current.metadata as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    if (typeof body.assignee === 'string') {
      metadata.assignee = body.assignee.trim();
    }
    if (typeof body.internal_note === 'string') {
      metadata.internal_note = body.internal_note.trim();
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: body.status ? String(body.status) : undefined,
        priority: body.priority ? String(body.priority) : undefined,
        metadata: metadata as object,
      },
    });

    await this.governance.logAction({
      actorUserId: req.user?.sub ?? null,
      actorEmail: req.user?.email ?? null,
      adminRole: Array.isArray(req.user?.roles) ? req.user.roles[0] : null,
      action: 'admin.support_ticket.updated',
      targetType: 'support_ticket',
      targetId: updated.id,
      summary: `Updated support ticket ${updated.id}`,
      metadata: {
        status: updated.status,
        priority: updated.priority,
        assignee: body.assignee ?? null,
      },
    });

    return {
      ok: true,
      data: {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }
}
