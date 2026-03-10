import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { StockAdjustmentV2Dto } from './dto/stock-adjustment-v2.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('products/:productId/stock-adjustment')
  @ApiOkResponse({
    description: 'Creates a stock movement and updates product stock',
  })
  async adjust(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body() dto: StockAdjustmentV2Dto,
  ) {
    const data = await this.inventory.adjustStock({
      companyId,
      productId,
      delta: new Decimal(dto.change_qty),
      sourceType: (dto.source_type as any) ?? 'manual',
      sourceId: dto.source_id,
      note: dto.reason,
    });

    return { data };
  }

  @Get('stock-movements')
  async movements(
    @Param('companyId') companyId: string,
    @Query('product_id') productId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.listMovements({
      companyId,
      productId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Get('inventory/low-stock')
  async lowStock(
    @Param('companyId') companyId: string,
    @Query('threshold') threshold?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.lowStock({
      companyId,
      threshold: threshold ? Number(threshold) : undefined,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }
}
