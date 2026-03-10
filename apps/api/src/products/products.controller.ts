import {
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
import { CreateProductDto } from './dto/create-product.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { InventoryService } from '../inventory/inventory.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('api/companies/:companyId/products')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
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
  async update(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.products.update(companyId, productId, dto);
    return { data };
  }

  @Delete(':productId')
  async remove(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    const data = await this.products.remove(companyId, productId);
    return { data };
  }

  @Post(':productId/stock-adjustment')
  async stockAdjustment(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    const data = await this.inventory.adjustStock({
      companyId,
      productId,
      delta: new Decimal(dto.delta),
      sourceType: 'manual',
      note: dto.reason,
    });
    return { data };
  }
}
