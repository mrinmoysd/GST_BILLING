import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateProductDto } from './dto/create-product.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { InventoryService } from '../inventory/inventory.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('api/companies/:companyId/products')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('masters.view')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly inventory: InventoryService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'OK' })
  async list(
    @Param('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.products.list(
      companyId,
      Number(page ?? 1),
      Number(limit ?? 20),
      q,
    );
  }

  @Post()
  @RequirePermissions('masters.manage')
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateProductDto,
  ) {
    const data = await this.products.create(companyId, dto);
    return { data };
  }

  @Get(':productId')
  async get(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    const data = await this.products.get(companyId, productId);
    return { data };
  }

  @Patch(':productId')
  @RequirePermissions('masters.manage')
  async update(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.products.update(companyId, productId, dto);
    return { data };
  }

  @Delete(':productId')
  @RequirePermissions('masters.manage')
  async remove(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    const data = await this.products.remove(companyId, productId);
    return { data };
  }

  @Post(':productId/stock-adjustment')
  @RequirePermissions('inventory.manage')
  async stockAdjustment(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    const delta = dto.change_qty ?? dto.delta;
    if (delta === undefined || delta === null || Number.isNaN(Number(delta))) {
      throw new BadRequestException('delta or change_qty is required');
    }

    const data = await this.inventory.adjustStock({
      companyId,
      productId,
      delta: new Decimal(delta),
      sourceType: (dto.source_type as any) ?? 'manual',
      sourceId: dto.source_id,
      note: dto.reason,
      warehouseId: dto.warehouse_id,
    });
    return { data };
  }
}
