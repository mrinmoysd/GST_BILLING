import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { DeliveryChallansService } from './delivery-challans.service';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto';
import { UpdateDeliveryChallanDto } from './dto/update-delivery-challan.dto';
import { TransitionDeliveryChallanDto } from './dto/transition-delivery-challan.dto';
import { ConvertDeliveryChallanToInvoiceDto } from './dto/convert-delivery-challan-to-invoice.dto';

@ApiTags('Delivery Challans')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class DeliveryChallansController {
  constructor(private readonly challans: DeliveryChallansService) {}

  @Get('dispatch-queue')
  listQueue(
    @Param('companyId') companyId: string,
    @Query('q') q?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {
    return this.challans.listQueue({ companyId, q, warehouseId });
  }

  @Get('delivery-challans')
  listChallans(
    @Param('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sales_order_id') salesOrderId?: string,
  ) {
    return this.challans.listChallans({
      companyId,
      page: Number(page),
      limit: Number(limit),
      q,
      status,
      salesOrderId,
    });
  }

  @Get('delivery-challans/:challanId')
  get(
    @Param('companyId') companyId: string,
    @Param('challanId') challanId: string,
  ) {
    return this.challans.get({ companyId, challanId });
  }

  @Post('sales-orders/:salesOrderId/delivery-challans')
  create(
    @Param('companyId') companyId: string,
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: CreateDeliveryChallanDto,
  ) {
    return this.challans.create({ companyId, salesOrderId, dto });
  }

  @Patch('delivery-challans/:challanId')
  patch(
    @Param('companyId') companyId: string,
    @Param('challanId') challanId: string,
    @Body() dto: UpdateDeliveryChallanDto,
  ) {
    return this.challans.patch({ companyId, challanId, dto });
  }

  @Post('delivery-challans/:challanId/status')
  transition(
    @Param('companyId') companyId: string,
    @Param('challanId') challanId: string,
    @Body() dto: TransitionDeliveryChallanDto,
  ) {
    return this.challans.transition({ companyId, challanId, dto });
  }

  @Post('delivery-challans/:challanId/convert-to-invoice')
  convertToInvoice(
    @Param('companyId') companyId: string,
    @Param('challanId') challanId: string,
    @Body() dto: ConvertDeliveryChallanToInvoiceDto,
  ) {
    return this.challans.convertToInvoice({
      companyId,
      challanId,
      seriesCode: dto.series_code,
    });
  }
}
