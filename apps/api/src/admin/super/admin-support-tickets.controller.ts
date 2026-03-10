import {
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
import { SuperAdminGuard } from './super-admin.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('/api/admin/support-tickets')
@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)
export class AdminSupportTicketsController {
  constructor(private readonly prisma: PrismaService) {}

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

    const [total, rows] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
    ]);

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
          createdAt: Date;
          updatedAt: Date;
        }) => ({
          id: t.id,
          email: t.email,
          name: t.name,
          subject: t.subject,
          message: t.message,
          status: t.status,
          priority: t.priority,
          created_at: t.createdAt.toISOString(),
          updated_at: t.updatedAt.toISOString(),
        }),
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
    },
  ) {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: body.status ? String(body.status) : undefined,
        priority: body.priority ? String(body.priority) : undefined,
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
