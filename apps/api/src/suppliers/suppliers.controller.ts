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

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('api/companies/:companyId/suppliers')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('masters.view')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @ApiOkResponse({ description: 'OK' })
  async list(
    @Param('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.suppliers.list(
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
    @Body() dto: CreateSupplierDto,
  ) {
    const data = await this.suppliers.create(companyId, dto);
    return { data };
  }

  @Get(':supplierId')
  async get(
    @Param('companyId') companyId: string,
    @Param('supplierId') supplierId: string,
  ) {
    const data = await this.suppliers.get(companyId, supplierId);
    return { data };
  }

  @Patch(':supplierId')
  @RequirePermissions('masters.manage')
  async update(
    @Param('companyId') companyId: string,
    @Param('supplierId') supplierId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const data = await this.suppliers.update(companyId, supplierId, dto);
    return { data };
  }

  @Delete(':supplierId')
  @RequirePermissions('masters.manage')
  async remove(
    @Param('companyId') companyId: string,
    @Param('supplierId') supplierId: string,
  ) {
    const data = await this.suppliers.remove(companyId, supplierId);
    return { data };
  }

  @Get(':supplierId/ledger')
  async ledger(
    @Param('companyId') companyId: string,
    @Param('supplierId') supplierId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.suppliers.ledger(companyId, supplierId, {
      from,
      to,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
    return { ok: true, data };
  }
}
