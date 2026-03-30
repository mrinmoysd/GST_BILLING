import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { StockAdjustmentV2Dto } from './dto/stock-adjustment-v2.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('inventory.view')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('products/:productId/stock-adjustment')
  @RequirePermissions('inventory.manage')
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
      warehouseId: dto.warehouse_id,
    });

    return { data };
  }

  @Get('stock-movements')
  async movements(
    @Param('companyId') companyId: string,
    @Query('product_id') productId?: string,
    @Query('warehouse_id') warehouseId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.listMovements({
      companyId,
      productId,
      warehouseId,
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

  @Get('inventory/batches')
  async batchStock(
    @Param('companyId') companyId: string,
    @Query('warehouse_id') warehouseId?: string,
    @Query('product_id') productId?: string,
    @Query('near_expiry_days') nearExpiryDays?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.listBatchStock({
      companyId,
      warehouseId,
      productId,
      nearExpiryDays: nearExpiryDays ? Number(nearExpiryDays) : undefined,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Get('inventory/near-expiry')
  async nearExpiry(
    @Param('companyId') companyId: string,
    @Query('warehouse_id') warehouseId?: string,
    @Query('product_id') productId?: string,
    @Query('days') days?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.listBatchStock({
      companyId,
      warehouseId,
      productId,
      nearExpiryDays: Number(days ?? 30),
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Get('warehouses')
  async warehouses(
    @Param('companyId') companyId: string,
    @Query('q') q?: string,
    @Query('active_only') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.listWarehouses({
      companyId,
      q,
      activeOnly: activeOnly === 'true',
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Post('warehouses')
  @RequirePermissions('inventory.manage')
  async createWarehouse(
    @Param('companyId') companyId: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    const data = await this.inventory.createWarehouse({
      companyId,
      name: dto.name,
      code: dto.code,
      locationLabel: dto.location_label,
      isDefault: dto.is_default,
    });
    return { data };
  }

  @Patch('warehouses/:warehouseId')
  @RequirePermissions('inventory.manage')
  async updateWarehouse(
    @Param('companyId') companyId: string,
    @Param('warehouseId') warehouseId: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const data = await this.inventory.updateWarehouse({
      companyId,
      warehouseId,
      name: dto.name,
      code: dto.code,
      locationLabel: dto.location_label,
      isDefault: dto.is_default,
      isActive: dto.is_active,
    });
    return { data };
  }

  @Get('warehouses/:warehouseId/stock')
  async warehouseStock(
    @Param('companyId') companyId: string,
    @Param('warehouseId') warehouseId: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.warehouseStock({
      companyId,
      warehouseId,
      q,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Get('stock-transfers')
  async transfers(
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.listTransfers({
      companyId,
      status,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Get('stock-transfers/:transferId')
  async transfer(
    @Param('companyId') companyId: string,
    @Param('transferId') transferId: string,
  ) {
    const data = await this.inventory.getTransfer({ companyId, transferId });
    return { data };
  }

  @Post('stock-transfers')
  @RequirePermissions('inventory.manage')
  async createTransfer(
    @Param('companyId') companyId: string,
    @Body() dto: CreateStockTransferDto,
  ) {
    const data = await this.inventory.createTransfer({
      companyId,
      fromWarehouseId: dto.from_warehouse_id,
      toWarehouseId: dto.to_warehouse_id,
      transferDate: dto.transfer_date ? new Date(dto.transfer_date) : undefined,
      notes: dto.notes,
      items: dto.items.map((item) => ({
        productId: item.product_id,
        quantity: new Decimal(item.quantity),
      })),
    });
    return { data };
  }

  @Post('stock-transfers/:transferId/dispatch')
  @RequirePermissions('inventory.manage')
  async dispatchTransfer(
    @Param('companyId') companyId: string,
    @Param('transferId') transferId: string,
  ) {
    const data = await this.inventory.dispatchTransfer({ companyId, transferId });
    return { data };
  }

  @Post('stock-transfers/:transferId/receive')
  @RequirePermissions('inventory.manage')
  async receiveTransfer(
    @Param('companyId') companyId: string,
    @Param('transferId') transferId: string,
  ) {
    const data = await this.inventory.receiveTransfer({ companyId, transferId });
    return { data };
  }

  @Post('stock-transfers/:transferId/cancel')
  @RequirePermissions('inventory.manage')
  async cancelTransfer(
    @Param('companyId') companyId: string,
    @Param('transferId') transferId: string,
  ) {
    const data = await this.inventory.cancelTransfer({ companyId, transferId });
    return { data };
  }
}
