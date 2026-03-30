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
import { AuthUser } from '../common/auth/auth-user.decorator';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import {
  AssignCustomerCoverageDto,
  CreateCollectionUpdateDto,
  CreateFieldQuotationDto,
  CreateFieldSalesOrderDto,
  CreateSalesBeatDto,
  CreateSalesRouteDto,
  CreateSalesTerritoryDto,
  CreateSalespersonRouteAssignmentDto,
  CreateVisitDto,
  CreateVisitOutcomeDto,
  CreateVisitPlanDto,
  GenerateVisitPlansDto,
  ReviewDcrDto,
  SubmitDcrDto,
  UpdateCustomerCoverageDto,
  UpdateSalesBeatDto,
  UpdateSalesRouteDto,
  UpdateSalesTerritoryDto,
  UpdateVisitDto,
  UpdateVisitPlanDto,
  VisitCheckInDto,
  VisitCheckOutDto,
} from './field-sales.dto';
import { FieldSalesService } from './field-sales.service';

@ApiTags('FieldSales')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/field-sales')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('field_sales.manage_masters')
export class FieldSalesController {
  constructor(private readonly fieldSales: FieldSalesService) {}

  @Get('territories')
  listTerritories(@Param('companyId') companyId: string) {
    return this.fieldSales.listTerritories(companyId);
  }

  @Post('territories')
  createTerritory(
    @Param('companyId') companyId: string,
    @Body() dto: CreateSalesTerritoryDto,
  ) {
    return this.fieldSales.createTerritory(companyId, dto);
  }

  @Patch('territories/:territoryId')
  updateTerritory(
    @Param('companyId') companyId: string,
    @Param('territoryId') territoryId: string,
    @Body() dto: UpdateSalesTerritoryDto,
  ) {
    return this.fieldSales.updateTerritory(companyId, territoryId, dto);
  }

  @Get('routes')
  listRoutes(
    @Param('companyId') companyId: string,
    @Query('territory_id') territoryId?: string,
  ) {
    return this.fieldSales.listRoutes({ companyId, territoryId });
  }

  @Post('routes')
  createRoute(
    @Param('companyId') companyId: string,
    @Body() dto: CreateSalesRouteDto,
  ) {
    return this.fieldSales.createRoute(companyId, dto);
  }

  @Patch('routes/:routeId')
  updateRoute(
    @Param('companyId') companyId: string,
    @Param('routeId') routeId: string,
    @Body() dto: UpdateSalesRouteDto,
  ) {
    return this.fieldSales.updateRoute(companyId, routeId, dto);
  }

  @Get('beats')
  listBeats(
    @Param('companyId') companyId: string,
    @Query('route_id') routeId?: string,
  ) {
    return this.fieldSales.listBeats({ companyId, routeId });
  }

  @Post('beats')
  createBeat(
    @Param('companyId') companyId: string,
    @Body() dto: CreateSalesBeatDto,
  ) {
    return this.fieldSales.createBeat(companyId, dto);
  }

  @Patch('beats/:beatId')
  updateBeat(
    @Param('companyId') companyId: string,
    @Param('beatId') beatId: string,
    @Body() dto: UpdateSalesBeatDto,
  ) {
    return this.fieldSales.updateBeat(companyId, beatId, dto);
  }

  @Get('coverage')
  listCoverage(
    @Param('companyId') companyId: string,
    @Query('salesperson_user_id') salespersonUserId?: string,
    @Query('customer_id') customerId?: string,
    @Query('active_only') activeOnly?: string,
  ) {
    return this.fieldSales.listCoverage({
      companyId,
      salespersonUserId,
      customerId,
      activeOnly: activeOnly !== 'false',
    });
  }

  @Post('coverage')
  createCoverage(
    @Param('companyId') companyId: string,
    @Body() dto: AssignCustomerCoverageDto & { customer_id: string },
  ) {
    return this.fieldSales.assignCustomerCoverage(companyId, dto.customer_id, dto);
  }

  @Patch('coverage/:coverageId')
  updateCoverage(
    @Param('companyId') companyId: string,
    @Param('coverageId') coverageId: string,
    @Body() dto: UpdateCustomerCoverageDto,
  ) {
    return this.fieldSales.updateCoverage(companyId, coverageId, dto);
  }

  @Post('customers/:customerId/assign-coverage')
  assignCoverage(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
    @Body() dto: AssignCustomerCoverageDto,
  ) {
    return this.fieldSales.assignCustomerCoverage(companyId, customerId, dto);
  }

  @Get('salespeople/:userId/assignments')
  listAssignments(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    return this.fieldSales.listSalespersonAssignments(companyId, userId);
  }

  @Post('salespeople/:userId/assignments')
  createAssignment(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: CreateSalespersonRouteAssignmentDto,
  ) {
    return this.fieldSales.createSalespersonAssignment(companyId, userId, dto);
  }

  @Post('visit-plans/generate')
  @RequirePermissions('field_sales.view_team_worklists')
  generateVisitPlans(
    @Param('companyId') companyId: string,
    @Body() dto: GenerateVisitPlansDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.generateVisitPlans(companyId, dto, user.sub);
  }

  @Get('visit-plans')
  @RequirePermissions('field_sales.view_team_worklists')
  listVisitPlans(
    @Param('companyId') companyId: string,
    @Query('date') date: string,
    @Query('salesperson_user_id') salespersonUserId?: string,
  ) {
    return this.fieldSales.listVisitPlans({ companyId, date, salespersonUserId });
  }

  @Post('visit-plans')
  @RequirePermissions('field_sales.view_team_worklists')
  createVisitPlan(
    @Param('companyId') companyId: string,
    @Body() dto: CreateVisitPlanDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.createVisitPlan(companyId, dto, user.sub);
  }

  @Patch('visit-plans/:visitPlanId')
  @RequirePermissions('field_sales.view_team_worklists')
  updateVisitPlan(
    @Param('companyId') companyId: string,
    @Param('visitPlanId') visitPlanId: string,
    @Body() dto: UpdateVisitPlanDto,
  ) {
    return this.fieldSales.updateVisitPlan(companyId, visitPlanId, dto);
  }

  @Get('my/worklist')
  @RequirePermissions('field_sales.log_visits')
  myWorklist(
    @Param('companyId') companyId: string,
    @Query('date') date: string,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.myWorklist(companyId, user.sub, date);
  }

  @Get('my/customers')
  @RequirePermissions('field_sales.log_visits')
  myCustomers(
    @Param('companyId') companyId: string,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.myCustomers(companyId, user.sub);
  }

  @Get('my/summary')
  @RequirePermissions('field_sales.log_visits')
  mySummary(
    @Param('companyId') companyId: string,
    @Query('date') date: string,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.mySummary(companyId, user.sub, date);
  }

  @Get('visits/:visitId')
  @RequirePermissions('field_sales.log_visits')
  getVisit(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
  ) {
    return this.fieldSales.getVisit(companyId, visitId);
  }

  @Post('visits')
  @RequirePermissions('field_sales.log_visits')
  createVisit(
    @Param('companyId') companyId: string,
    @Body() dto: CreateVisitDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.createVisit(companyId, dto, user.sub);
  }

  @Post('visits/:visitId/check-in')
  @RequirePermissions('field_sales.log_visits')
  checkIn(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: VisitCheckInDto,
  ) {
    return this.fieldSales.checkIn(companyId, visitId, dto);
  }

  @Post('visits/:visitId/check-out')
  @RequirePermissions('field_sales.log_visits')
  checkOut(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: VisitCheckOutDto,
  ) {
    return this.fieldSales.checkOut(companyId, visitId, dto);
  }

  @Patch('visits/:visitId')
  @RequirePermissions('field_sales.log_visits')
  updateVisit(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: UpdateVisitDto,
  ) {
    return this.fieldSales.updateVisit(companyId, visitId, dto);
  }

  @Post('visits/:visitId/outcomes')
  @RequirePermissions('field_sales.log_visits')
  addOutcome(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: CreateVisitOutcomeDto,
  ) {
    return this.fieldSales.addVisitOutcome(companyId, visitId, dto);
  }

  @Post('visits/:visitId/mark-missed')
  @RequirePermissions('field_sales.log_visits')
  markMissed(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body('remarks') remarks?: string,
  ) {
    return this.fieldSales.markMissed(companyId, visitId, remarks);
  }

  @Post('visits/:visitId/create-sales-order')
  @RequirePermissions('field_sales.create_documents')
  createSalesOrderFromVisit(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: CreateFieldSalesOrderDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.createSalesOrderFromVisit(companyId, visitId, dto, user.sub);
  }

  @Post('visits/:visitId/create-quotation')
  @RequirePermissions('field_sales.create_documents')
  createQuotationFromVisit(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: CreateFieldQuotationDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.createQuotationFromVisit(companyId, visitId, dto, user.sub);
  }

  @Post('visits/:visitId/collection-updates')
  @RequirePermissions('field_sales.record_followups')
  createCollectionUpdate(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: CreateCollectionUpdateDto,
  ) {
    return this.fieldSales.createCollectionUpdate(companyId, visitId, dto);
  }

  @Post('visits/:visitId/promises')
  @RequirePermissions('field_sales.record_followups')
  createPromise(
    @Param('companyId') companyId: string,
    @Param('visitId') visitId: string,
    @Body() dto: CreateCollectionUpdateDto,
  ) {
    return this.fieldSales.createCollectionUpdate(companyId, visitId, dto);
  }

  @Get('dcr')
  @RequirePermissions('field_sales.submit_dcr')
  getDcr(
    @Param('companyId') companyId: string,
    @Query('date') date: string,
    @Query('salesperson_user_id') salespersonUserId: string,
  ) {
    return this.fieldSales.getDcr(companyId, date, salespersonUserId);
  }

  @Post('dcr/submit')
  @RequirePermissions('field_sales.submit_dcr')
  submitDcr(
    @Param('companyId') companyId: string,
    @Body() dto: SubmitDcrDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.submitDcr(companyId, user.sub, dto);
  }

  @Post('dcr/:dcrId/reopen')
  @RequirePermissions('field_sales.review_dcr')
  reopenDcr(
    @Param('companyId') companyId: string,
    @Param('dcrId') dcrId: string,
    @Body() dto: ReviewDcrDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.reopenDcr(companyId, dcrId, user.sub, dto);
  }

  @Post('dcr/:dcrId/approve')
  @RequirePermissions('field_sales.review_dcr')
  approveDcr(
    @Param('companyId') companyId: string,
    @Param('dcrId') dcrId: string,
    @Body() dto: ReviewDcrDto,
    @AuthUser() user: { sub: string },
  ) {
    return this.fieldSales.approveDcr(companyId, dcrId, user.sub, dto);
  }
}
