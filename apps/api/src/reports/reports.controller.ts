import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/reports')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('sales/summary')
  salesSummary(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.salesSummary({ companyId, from, to });
  }

  @Get('purchases/summary')
  purchasesSummary(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.purchasesSummary({ companyId, from, to });
  }

  @Get('sales/outstanding')
  outstanding(
    @Param('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.reports.outstandingInvoices({
      companyId,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
      q,
    });
  }

  @Get('sales/top-products')
  topProducts(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: 'amount' | 'quantity',
  ) {
    return this.reports.topProducts({
      companyId,
      from,
      to,
      limit: Number(limit ?? 10),
      sortBy,
    });
  }

  @Get('profit/snapshot')
  profitSnapshot(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.profitSnapshot({ companyId, from, to });
  }
}
