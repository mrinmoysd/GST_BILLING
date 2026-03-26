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

  @Get('distributor/sales-by-salesperson')
  salesBySalesperson(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.salesBySalesperson({ companyId, from, to });
  }

  @Get('distributor/collections-by-salesperson')
  collectionsBySalesperson(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.collectionsBySalesperson({ companyId, from, to });
  }

  @Get('distributor/outstanding-by-salesperson')
  outstandingBySalesperson(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.outstandingBySalesperson({ companyId, asOf });
  }

  @Get('distributor/outstanding-by-customer')
  outstandingByCustomer(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.outstandingByCustomer({ companyId, asOf });
  }

  @Get('distributor/stock-by-warehouse')
  stockByWarehouse(@Param('companyId') companyId: string) {
    return this.reports.stockByWarehouse({ companyId });
  }

  @Get('distributor/product-movement')
  productMovement(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reports.productMovement({
      companyId,
      from,
      to,
      limit: Number(limit ?? 10),
    });
  }

  @Get('distributor/dashboard')
  distributorDashboard(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.distributorDashboard({ companyId, from, to, asOf });
  }

  @Get('distributor/dispatch-operations')
  dispatchOperations(
    @Param('companyId') companyId: string,
    @Query('q') q?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {
    return this.reports.dispatchOperations({ companyId, q, warehouseId });
  }

  @Get('distributor/commercial/scheme-usage')
  schemeUsage(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.schemeUsage({ companyId, from, to });
  }

  @Get('distributor/commercial/discount-leakage')
  discountLeakage(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.discountLeakage({ companyId, from, to });
  }

  @Get('distributor/commercial/price-coverage')
  priceCoverage(@Param('companyId') companyId: string) {
    return this.reports.priceCoverage({ companyId });
  }

  @Get('distributor/commercial/audit')
  commercialAudit(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reports.commercialAudit({
      companyId,
      limit: Number(limit ?? 50),
    });
  }

  @Get('receivables/aging')
  receivableAging(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.receivableAging({ companyId, asOf });
  }

  @Get('payables/aging')
  payableAging(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.payableAging({ companyId, asOf });
  }

  @Get('credit-control/dashboard')
  creditControlDashboard(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.creditControlDashboard({ companyId, asOf });
  }

  @Get('banking/reconciliation-summary')
  bankingReconciliationSummary(@Param('companyId') companyId: string) {
    return this.reports.bankingReconciliationSummary({ companyId });
  }

  @Get('distributor/route-coverage')
  routeCoverage(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('route_id') routeId?: string,
  ) {
    return this.reports.routeCoverage({ companyId, from, to, routeId });
  }

  @Get('distributor/rep-visit-productivity')
  repVisitProductivity(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('salesperson_user_id') salespersonUserId?: string,
  ) {
    return this.reports.repVisitProductivity({
      companyId,
      from,
      to,
      salespersonUserId,
    });
  }

  @Get('distributor/missed-visits')
  missedVisits(
    @Param('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.reports.missedVisits({ companyId, date });
  }

  @Get('distributor/route-outstanding')
  routeOutstanding(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    return this.reports.routeOutstanding({ companyId, asOf });
  }

  @Get('distributor/dcr-register')
  dcrRegister(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.dcrRegister({ companyId, from, to });
  }
}
