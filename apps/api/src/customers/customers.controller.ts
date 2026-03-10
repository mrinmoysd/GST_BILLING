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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('api/companies/:companyId/customers')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOkResponse({ description: 'OK' })
  async list(
    @Param('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.customers.list(
      companyId,
      Number(page ?? 1),
      Number(limit ?? 20),
      q,
    );
  }

  @Post()
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    const data = await this.customers.create(companyId, dto);
    return { data };
  }

  @Get(':customerId')
  async get(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
  ) {
    const data = await this.customers.get(companyId, customerId);
    return { data };
  }

  @Patch(':customerId')
  async update(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const data = await this.customers.update(companyId, customerId, dto);
    return { data };
  }

  @Delete(':customerId')
  async remove(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
  ) {
    const data = await this.customers.remove(companyId, customerId);
    return { data };
  }

  @Get(':customerId/ledger')
  async ledger(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.customers.ledger(companyId, customerId, {
      from,
      to,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
    return { ok: true, data };
  }
}
