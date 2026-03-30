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
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { ConvertQuotationToInvoiceDto } from './dto/convert-quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/quotations')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('sales.view')
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  list(
    @Param('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.quotations.list({
      companyId,
      page: Number(page),
      limit: Number(limit),
      q,
      status,
      from,
      to,
    });
  }

  @Get('/:quotationId')
  get(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.quotations.get({ companyId, quotationId });
  }

  @Post()
  @RequirePermissions('sales.manage')
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateQuotationDto,
    @Req() req?: any,
  ) {
    return this.quotations.create({
      companyId,
      dto,
      actorUserId: req?.user?.sub ?? null,
    });
  }

  @Patch('/:quotationId')
  @RequirePermissions('sales.manage')
  patch(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
    @Body() dto: UpdateQuotationDto,
    @Req() req?: any,
  ) {
    return this.quotations.patch({
      companyId,
      quotationId,
      dto,
      actorUserId: req?.user?.sub ?? null,
    });
  }

  @Post('/:quotationId/send')
  @RequirePermissions('sales.manage')
  send(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.quotations.transition({
      companyId,
      quotationId,
      status: 'sent',
    });
  }

  @Post('/:quotationId/approve')
  @RequirePermissions('sales.manage')
  approve(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.quotations.transition({
      companyId,
      quotationId,
      status: 'approved',
    });
  }

  @Post('/:quotationId/expire')
  @RequirePermissions('sales.manage')
  expire(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.quotations.transition({
      companyId,
      quotationId,
      status: 'expired',
    });
  }

  @Post('/:quotationId/cancel')
  @RequirePermissions('sales.manage')
  cancel(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.quotations.transition({
      companyId,
      quotationId,
      status: 'cancelled',
    });
  }

  @Post('/:quotationId/convert-to-invoice')
  @RequirePermissions('sales.manage')
  convert(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
    @Body() dto: ConvertQuotationToInvoiceDto,
  ) {
    return this.quotations.convertToInvoice({
      companyId,
      quotationId,
      seriesCode: dto.series_code,
    });
  }

  @Post('/:quotationId/convert-to-sales-order')
  @RequirePermissions('sales.manage')
  convertToSalesOrder(
    @Param('companyId') companyId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.quotations.convertToSalesOrder({
      companyId,
      quotationId,
    });
  }
}
