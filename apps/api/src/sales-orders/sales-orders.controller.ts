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
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { ConvertSalesOrderToInvoiceDto } from './dto/convert-sales-order-to-invoice.dto';
import { SalesOrdersService } from './sales-orders.service';

@ApiTags('Sales Orders')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/sales-orders')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('sales.view')
export class SalesOrdersController {
  constructor(private readonly salesOrders: SalesOrdersService) {}

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
    return this.salesOrders.list({
      companyId,
      page: Number(page),
      limit: Number(limit),
      q,
      status,
      from,
      to,
    });
  }

  @Get('/:salesOrderId')
  get(
    @Param('companyId') companyId: string,
    @Param('salesOrderId') salesOrderId: string,
  ) {
    return this.salesOrders.get({ companyId, salesOrderId });
  }

  @Post()
  @RequirePermissions('sales.manage')
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateSalesOrderDto,
    @Req() req?: any,
  ) {
    return this.salesOrders.create({
      companyId,
      dto,
      actorUserId: req?.user?.sub ?? null,
    });
  }

  @Patch('/:salesOrderId')
  @RequirePermissions('sales.manage')
  patch(
    @Param('companyId') companyId: string,
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: UpdateSalesOrderDto,
    @Req() req?: any,
  ) {
    return this.salesOrders.patch({
      companyId,
      salesOrderId,
      dto,
      actorUserId: req?.user?.sub ?? null,
    });
  }

  @Post('/:salesOrderId/confirm')
  @RequirePermissions('sales.manage')
  confirm(
    @Param('companyId') companyId: string,
    @Param('salesOrderId') salesOrderId: string,
  ) {
    return this.salesOrders.transition({ companyId, salesOrderId, status: 'confirmed' });
  }

  @Post('/:salesOrderId/cancel')
  @RequirePermissions('sales.manage')
  cancel(
    @Param('companyId') companyId: string,
    @Param('salesOrderId') salesOrderId: string,
  ) {
    return this.salesOrders.transition({ companyId, salesOrderId, status: 'cancelled' });
  }

  @Post('/:salesOrderId/convert-to-invoice')
  @RequirePermissions('sales.manage')
  convert(
    @Param('companyId') companyId: string,
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: ConvertSalesOrderToInvoiceDto,
  ) {
    return this.salesOrders.convertToInvoice({
      companyId,
      salesOrderId,
      seriesCode: dto.series_code,
      items: dto.items,
    });
  }
}
