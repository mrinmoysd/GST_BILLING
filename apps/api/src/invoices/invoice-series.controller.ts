import {
  Body,
  ConflictException,
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
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceSeriesDto } from './invoice-series/dto/create-invoice-series.dto';
import { UpdateInvoiceSeriesDto } from './invoice-series/dto/update-invoice-series.dto';

@ApiTags('Invoice Series')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/invoice-series')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
export class InvoiceSeriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('settings.invoice_series.manage')
  async list(@Param('companyId') companyId: string) {
    const rows = await this.prisma.invoiceSeries.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'asc' }],
    });
    return { ok: true, data: rows };
  }

  @Post()
  @RequirePermissions('settings.invoice_series.manage')
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateInvoiceSeriesDto,
  ) {
    const exists = await this.prisma.invoiceSeries.findFirst({
      where: { companyId, code: dto.code },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Invoice series code already exists');

    const created = await this.prisma.invoiceSeries.create({
      data: {
        companyId,
        code: dto.code,
        prefix: dto.prefix ?? null,
        nextNumber: dto.next_number ?? 1,
        isActive: dto.is_active ?? true,
      },
    });

    return { ok: true, data: created };
  }

  @Patch('/:seriesId')
  @RequirePermissions('settings.invoice_series.manage')
  async update(
    @Param('companyId') companyId: string,
    @Param('seriesId') seriesId: string,
    @Body() dto: UpdateInvoiceSeriesDto,
  ) {
    // Ensure it belongs to company
    const current = await this.prisma.invoiceSeries.findFirst({
      where: { id: seriesId, companyId },
    });
    if (!current) return { ok: false, error: { code: 'NOT_FOUND', message: 'Invoice series not found' } };

    const updated = await this.prisma.invoiceSeries.update({
      where: { id: seriesId },
      data: {
        prefix: dto.prefix ?? undefined,
        nextNumber: dto.next_number ?? undefined,
        isActive: dto.is_active ?? undefined,
      },
    });

    return { ok: true, data: updated };
  }

  @Delete('/:seriesId')
  @RequirePermissions('settings.invoice_series.manage')
  async remove(
    @Param('companyId') companyId: string,
    @Param('seriesId') seriesId: string,
  ) {
    // Prevent deleting a series that has invoices.
    const invoicesCount = await this.prisma.invoice.count({
      where: { companyId, seriesId },
    });
    if (invoicesCount > 0)
      throw new ConflictException('Cannot delete series with issued invoices');

    await this.prisma.invoiceSeries.deleteMany({
      where: { id: seriesId, companyId },
    });

    return { ok: true, data: { deleted: true } };
  }
}
