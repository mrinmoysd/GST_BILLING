import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { FinanceOpsService } from '../finance-ops/finance-ops.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationsService } from '../quotations/quotations.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
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

const PRODUCTIVE_OUTCOMES = new Set([
  'order_booked',
  'quotation_shared',
  'collection_followup_done',
  'payment_received',
  'promise_received',
]);

@Injectable()
export class FieldSalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesOrders: SalesOrdersService,
    private readonly quotations: QuotationsService,
    private readonly financeOps: FinanceOpsService,
  ) {}

  private decimalToNumber(value: unknown) {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    const maybe = (value as any)?.toString?.();
    return typeof maybe === 'string' ? Number(maybe) : Number(value);
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return date;
  }

  private parseOptionalDate(value?: string | null) {
    if (!value) return null;
    return this.parseDate(value, 'date');
  }

  private dateOnly(value: Date | string) {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toISOString().slice(0, 10);
  }

  private normalizeDayName(value?: string | null) {
    return value?.trim().toLowerCase() || null;
  }

  private buildDateRange(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    return { gte: start, lte: end };
  }

  private async assertUser(companyId: string, userId?: string | null, label = 'User') {
    if (!userId) return null;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, isActive: true },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException(`${label} not found`);
    return user;
  }

  private async assertCustomer(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        salespersonUserId: true,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async assertInvoice(companyId: string, invoiceId?: string | null, customerId?: string) {
    if (!invoiceId) return null;
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
        ...(customerId ? { customerId } : {}),
      },
      select: {
        id: true,
        customerId: true,
        invoiceNumber: true,
        balanceDue: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async assertCoverageHierarchy(args: {
    companyId: string;
    territoryId?: string | null;
    routeId?: string | null;
    beatId?: string | null;
  }) {
    const territory = args.territoryId
      ? await this.prisma.salesTerritory.findFirst({
          where: { id: args.territoryId, companyId: args.companyId },
          select: { id: true, name: true },
        })
      : null;
    if (args.territoryId && !territory) {
      throw new NotFoundException('Territory not found');
    }

    const route = args.routeId
      ? await this.prisma.salesRoute.findFirst({
          where: { id: args.routeId, companyId: args.companyId },
          select: { id: true, name: true, territoryId: true, defaultWarehouseId: true },
        })
      : null;
    if (args.routeId && !route) {
      throw new NotFoundException('Route not found');
    }

    if (territory && route?.territoryId && route.territoryId !== territory.id) {
      throw new BadRequestException('Route does not belong to the selected territory');
    }

    const beat = args.beatId
      ? await this.prisma.salesBeat.findFirst({
          where: { id: args.beatId, companyId: args.companyId },
          select: { id: true, name: true, routeId: true, territoryId: true, dayOfWeek: true },
        })
      : null;
    if (args.beatId && !beat) {
      throw new NotFoundException('Beat not found');
    }

    if (route && beat && beat.routeId !== route.id) {
      throw new BadRequestException('Beat does not belong to the selected route');
    }
    if (territory && beat?.territoryId && beat.territoryId !== territory.id) {
      throw new BadRequestException('Beat does not belong to the selected territory');
    }

    return { territory, route, beat };
  }

  private buildWorklistCounts(
    plans: Array<{ status: string; visit?: { productiveFlag?: boolean | null } | null }>,
  ) {
    return plans.reduce(
      (acc, plan) => {
        if (plan.status === 'planned') acc.planned += 1;
        if (plan.status === 'completed') acc.completed += 1;
        if (plan.status === 'missed') acc.missed += 1;
        if (plan.visit?.productiveFlag) acc.productive += 1;
        return acc;
      },
      { planned: 0, completed: 0, missed: 0, productive: 0 },
    );
  }

  private async buildDcrSnapshot(companyId: string, salespersonUserId: string, reportDate: string) {
    const visitDate = new Date(reportDate);
    const plans = await this.prisma.salesVisitPlan.findMany({
      where: {
        companyId,
        salespersonUserId,
        visitDate,
      },
      include: {
        visit: {
          include: {
            outcomes: true,
          },
        },
      },
    });

    const orders = await this.prisma.salesOrder.findMany({
      where: {
        companyId,
        salespersonUserId,
        sourceChannel: 'field_sales',
        orderDate: visitDate,
      },
      select: { id: true, total: true },
    });
    const quotations = await this.prisma.quotation.findMany({
      where: {
        companyId,
        salespersonUserId,
        sourceChannel: 'field_sales',
        issueDate: visitDate,
      },
      select: { id: true },
    });
    const collectionUpdates = await this.prisma.collectionTask.count({
      where: {
        companyId,
        salespersonUserId,
        createdAt: this.buildDateRange(reportDate),
      },
    });

    const plannedVisitsCount = plans.length;
    const completedVisitsCount = plans.filter((plan) => plan.status === 'completed').length;
    const missedVisitsCount = plans.filter((plan) => plan.status === 'missed').length;
    const productiveVisitsCount = plans.filter((plan) => plan.visit?.productiveFlag).length;
    const salesOrderValue = orders.reduce(
      (sum, order) => sum + Number(order.total.toString()),
      0,
    );

    return {
      planned_visits_count: plannedVisitsCount,
      completed_visits_count: completedVisitsCount,
      missed_visits_count: missedVisitsCount,
      productive_visits_count: productiveVisitsCount,
      quotations_count: quotations.length,
      sales_orders_count: orders.length,
      sales_order_value: salesOrderValue,
      collection_updates_count: collectionUpdates,
    };
  }

  async listTerritories(companyId: string) {
    const data = await this.prisma.salesTerritory.findMany({
      where: { companyId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { routes: true, coverages: true, visits: true } },
      },
    });
    return { data };
  }

  async createTerritory(companyId: string, dto: CreateSalesTerritoryDto) {
    await this.assertUser(companyId, dto.manager_user_id, 'Manager');
    const data = await this.prisma.salesTerritory.create({
      data: {
        companyId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        status: dto.status?.trim() || 'active',
        managerUserId: dto.manager_user_id ?? null,
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    return { data };
  }

  async updateTerritory(companyId: string, territoryId: string, dto: UpdateSalesTerritoryDto) {
    const territory = await this.prisma.salesTerritory.findFirst({
      where: { id: territoryId, companyId },
      select: { id: true },
    });
    if (!territory) throw new NotFoundException('Territory not found');
    if (dto.manager_user_id !== undefined) {
      await this.assertUser(companyId, dto.manager_user_id, 'Manager');
    }
    const data = await this.prisma.salesTerritory.update({
      where: { id: territoryId },
      data: {
        code: dto.code?.trim(),
        name: dto.name?.trim(),
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        status: dto.status?.trim(),
        managerUserId:
          dto.manager_user_id !== undefined ? dto.manager_user_id || null : undefined,
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    return { data };
  }

  async listRoutes(args: { companyId: string; territoryId?: string }) {
    const data = await this.prisma.salesRoute.findMany({
      where: {
        companyId: args.companyId,
        ...(args.territoryId ? { territoryId: args.territoryId } : {}),
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      include: {
        territory: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, name: true, email: true } },
        defaultWarehouse: { select: { id: true, name: true, code: true } },
        _count: { select: { beats: true, coverages: true, visits: true } },
      },
    });
    return { data };
  }

  async createRoute(companyId: string, dto: CreateSalesRouteDto) {
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
    });
    await this.assertUser(companyId, dto.manager_user_id, 'Manager');
    if (dto.default_warehouse_id) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.default_warehouse_id, companyId },
        select: { id: true },
      });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
    }
    const data = await this.prisma.salesRoute.create({
      data: {
        companyId,
        territoryId: dto.territory_id ?? null,
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        status: dto.status?.trim() || 'active',
        defaultWarehouseId: dto.default_warehouse_id ?? null,
        managerUserId: dto.manager_user_id ?? null,
      },
      include: {
        territory: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, name: true, email: true } },
        defaultWarehouse: { select: { id: true, name: true, code: true } },
      },
    });
    return { data };
  }

  async updateRoute(companyId: string, routeId: string, dto: UpdateSalesRouteDto) {
    const route = await this.prisma.salesRoute.findFirst({
      where: { id: routeId, companyId },
      select: { id: true },
    });
    if (!route) throw new NotFoundException('Route not found');
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
    });
    if (dto.manager_user_id !== undefined) {
      await this.assertUser(companyId, dto.manager_user_id, 'Manager');
    }
    if (dto.default_warehouse_id !== undefined && dto.default_warehouse_id) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.default_warehouse_id, companyId },
        select: { id: true },
      });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
    }
    const data = await this.prisma.salesRoute.update({
      where: { id: routeId },
      data: {
        territoryId:
          dto.territory_id !== undefined ? dto.territory_id || null : undefined,
        code: dto.code?.trim(),
        name: dto.name?.trim(),
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        status: dto.status?.trim(),
        defaultWarehouseId:
          dto.default_warehouse_id !== undefined
            ? dto.default_warehouse_id || null
            : undefined,
        managerUserId:
          dto.manager_user_id !== undefined ? dto.manager_user_id || null : undefined,
      },
      include: {
        territory: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, name: true, email: true } },
        defaultWarehouse: { select: { id: true, name: true, code: true } },
      },
    });
    return { data };
  }

  async listBeats(args: { companyId: string; routeId?: string }) {
    const data = await this.prisma.salesBeat.findMany({
      where: {
        companyId: args.companyId,
        ...(args.routeId ? { routeId: args.routeId } : {}),
      },
      orderBy: [{ route: { name: 'asc' } }, { sequenceNo: 'asc' }, { name: 'asc' }],
      include: {
        territory: { select: { id: true, name: true, code: true } },
        route: { select: { id: true, name: true, code: true } },
        _count: { select: { coverages: true, visits: true } },
      },
    });
    return { data };
  }

  async createBeat(companyId: string, dto: CreateSalesBeatDto) {
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
      routeId: dto.route_id,
    });
    const data = await this.prisma.salesBeat.create({
      data: {
        companyId,
        territoryId: dto.territory_id ?? null,
        routeId: dto.route_id,
        code: dto.code.trim(),
        name: dto.name.trim(),
        dayOfWeek: this.normalizeDayName(dto.day_of_week),
        sequenceNo: dto.sequence_no ?? null,
        status: dto.status?.trim() || 'active',
      },
      include: {
        territory: { select: { id: true, name: true, code: true } },
        route: { select: { id: true, name: true, code: true } },
      },
    });
    return { data };
  }

  async updateBeat(companyId: string, beatId: string, dto: UpdateSalesBeatDto) {
    const beat = await this.prisma.salesBeat.findFirst({
      where: { id: beatId, companyId },
      select: { id: true },
    });
    if (!beat) throw new NotFoundException('Beat not found');
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
      routeId: dto.route_id,
      beatId,
    });
    const data = await this.prisma.salesBeat.update({
      where: { id: beatId },
      data: {
        territoryId:
          dto.territory_id !== undefined ? dto.territory_id || null : undefined,
        routeId: dto.route_id,
        code: dto.code?.trim(),
        name: dto.name?.trim(),
        dayOfWeek:
          dto.day_of_week !== undefined
            ? this.normalizeDayName(dto.day_of_week)
            : undefined,
        sequenceNo: dto.sequence_no,
        status: dto.status?.trim(),
      },
      include: {
        territory: { select: { id: true, name: true, code: true } },
        route: { select: { id: true, name: true, code: true } },
      },
    });
    return { data };
  }

  async listCoverage(args: {
    companyId: string;
    salespersonUserId?: string;
    customerId?: string;
    activeOnly?: boolean;
  }) {
    const data = await this.prisma.customerSalesCoverage.findMany({
      where: {
        companyId: args.companyId,
        ...(args.salespersonUserId ? { salespersonUserId: args.salespersonUserId } : {}),
        ...(args.customerId ? { customerId: args.customerId } : {}),
        ...(args.activeOnly === false ? {} : { isActive: true }),
      },
      orderBy: [{ customer: { name: 'asc' } }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
      },
    });
    return { data };
  }

  async assignCustomerCoverage(companyId: string, customerId: string, dto: AssignCustomerCoverageDto) {
    const customer = await this.assertCustomer(companyId, customerId);
    await this.assertUser(companyId, dto.salesperson_user_id, 'Salesperson');
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
      routeId: dto.route_id,
      beatId: dto.beat_id,
    });

    const data = await this.prisma.$transaction(async (tx) => {
      await tx.customerSalesCoverage.updateMany({
        where: { companyId, customerId, isActive: true },
        data: {
          isActive: false,
          effectiveTo: dto.effective_from ? new Date(dto.effective_from) : new Date(),
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: { salespersonUserId: dto.salesperson_user_id },
      });

      return tx.customerSalesCoverage.create({
        data: {
          companyId,
          customerId: customer.id,
          salespersonUserId: dto.salesperson_user_id,
          territoryId: dto.territory_id ?? null,
          routeId: dto.route_id ?? null,
          beatId: dto.beat_id ?? null,
          visitFrequency: dto.visit_frequency?.trim() || null,
          preferredVisitDay: this.normalizeDayName(dto.preferred_visit_day),
          priority: dto.priority?.trim() || null,
          isActive: dto.is_active ?? true,
          effectiveFrom: this.parseOptionalDate(dto.effective_from),
          effectiveTo: this.parseOptionalDate(dto.effective_to),
          notes: dto.notes?.trim() || null,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          salesperson: { select: { id: true, name: true, email: true, role: true } },
          territory: { select: { id: true, code: true, name: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        },
      });
    });

    return { data };
  }

  async updateCoverage(companyId: string, coverageId: string, dto: UpdateCustomerCoverageDto) {
    const coverage = await this.prisma.customerSalesCoverage.findFirst({
      where: { id: coverageId, companyId },
      select: { id: true },
    });
    if (!coverage) throw new NotFoundException('Coverage not found');
    if (dto.salesperson_user_id) {
      await this.assertUser(companyId, dto.salesperson_user_id, 'Salesperson');
    }
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
      routeId: dto.route_id,
      beatId: dto.beat_id,
    });

    const data = await this.prisma.customerSalesCoverage.update({
      where: { id: coverageId },
      data: {
        salespersonUserId: dto.salesperson_user_id,
        territoryId:
          dto.territory_id !== undefined ? dto.territory_id || null : undefined,
        routeId: dto.route_id !== undefined ? dto.route_id || null : undefined,
        beatId: dto.beat_id !== undefined ? dto.beat_id || null : undefined,
        visitFrequency:
          dto.visit_frequency !== undefined ? dto.visit_frequency?.trim() || null : undefined,
        preferredVisitDay:
          dto.preferred_visit_day !== undefined
            ? this.normalizeDayName(dto.preferred_visit_day)
            : undefined,
        priority: dto.priority !== undefined ? dto.priority?.trim() || null : undefined,
        isActive: dto.is_active,
        effectiveFrom:
          dto.effective_from !== undefined
            ? this.parseOptionalDate(dto.effective_from)
            : undefined,
        effectiveTo:
          dto.effective_to !== undefined
            ? this.parseOptionalDate(dto.effective_to)
            : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
      },
    });
    return { data };
  }

  async listSalespersonAssignments(companyId: string, userId: string) {
    const data = await this.prisma.salespersonRouteAssignment.findMany({
      where: { companyId, salespersonUserId: userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
      },
    });
    return { data };
  }

  async createSalespersonAssignment(
    companyId: string,
    userId: string,
    dto: CreateSalespersonRouteAssignmentDto,
  ) {
    await this.assertUser(companyId, userId, 'Salesperson');
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
      routeId: dto.route_id,
      beatId: dto.beat_id,
    });
    const data = await this.prisma.salespersonRouteAssignment.create({
      data: {
        companyId,
        salespersonUserId: userId,
        territoryId: dto.territory_id ?? null,
        routeId: dto.route_id ?? null,
        beatId: dto.beat_id ?? null,
        isPrimary: dto.is_primary ?? false,
        effectiveFrom: this.parseOptionalDate(dto.effective_from),
        effectiveTo: this.parseOptionalDate(dto.effective_to),
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
      },
    });
    return { data };
  }

  async generateVisitPlans(companyId: string, dto: GenerateVisitPlansDto, actorUserId?: string | null) {
    const visitDate = this.parseDate(dto.date, 'date');
    const mode = dto.mode ?? 'replace_missing_only';
    const dayName = visitDate
      .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
      .toLowerCase();

    const coverageWhere: Prisma.CustomerSalesCoverageWhereInput = {
      companyId,
      isActive: true,
      OR:
        mode === 'carry_forward_only'
          ? undefined
          : [
              { preferredVisitDay: dayName },
              { preferredVisitDay: null },
            ],
      ...(dto.salesperson_user_ids?.length
        ? { salespersonUserId: { in: dto.salesperson_user_ids } }
        : {}),
    };

    const coverageRows =
      mode === 'carry_forward_only'
        ? []
        : await this.prisma.customerSalesCoverage.findMany({
            where: coverageWhere,
            include: {
              beat: { select: { sequenceNo: true, dayOfWeek: true } },
            },
            orderBy: [
              { routeId: 'asc' },
              { beatId: 'asc' },
              { customerId: 'asc' },
            ],
          });

    const carryForwardRows = await this.prisma.salesVisitPlan.findMany({
      where: {
        companyId,
        visitDate: { lt: visitDate },
        status: { in: ['planned', 'started', 'missed'] },
        ...(dto.salesperson_user_ids?.length
          ? { salespersonUserId: { in: dto.salesperson_user_ids } }
          : {}),
      },
      orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });

    const candidateMap = new Map<
      string,
      {
        salespersonUserId: string;
        customerId: string;
        territoryId?: string | null;
        routeId?: string | null;
        beatId?: string | null;
        priority?: string | null;
        sequenceNo?: number | null;
        planSource: string;
      }
    >();

    for (const coverage of coverageRows) {
      const key = `${coverage.salespersonUserId}:${coverage.customerId}`;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          salespersonUserId: coverage.salespersonUserId,
          customerId: coverage.customerId,
          territoryId: coverage.territoryId,
          routeId: coverage.routeId,
          beatId: coverage.beatId,
          priority: coverage.priority,
          sequenceNo: coverage.beat?.sequenceNo ?? null,
          planSource: 'generated',
        });
      }
    }

    for (const row of carryForwardRows) {
      const key = `${row.salespersonUserId}:${row.customerId}`;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          salespersonUserId: row.salespersonUserId,
          customerId: row.customerId,
          territoryId: row.territoryId,
          routeId: row.routeId,
          beatId: row.beatId,
          priority: row.priority,
          sequenceNo: row.sequenceNo,
          planSource: 'carry_forward',
        });
      }
    }

    const candidates = Array.from(candidateMap.values());
    if (!candidates.length) {
      return { data: [], meta: { created: 0, mode, date: dto.date } };
    }

    const existing = await this.prisma.salesVisitPlan.findMany({
      where: {
        companyId,
        visitDate,
        salespersonUserId: { in: candidates.map((row) => row.salespersonUserId) },
      },
      select: {
        id: true,
        customerId: true,
        salespersonUserId: true,
        visit: { select: { id: true } },
      },
    });

    if (mode === 'replace_all') {
      const deletableIds = existing
        .filter((row) => !row.visit)
        .map((row) => row.id);
      if (deletableIds.length) {
        await this.prisma.salesVisitPlan.deleteMany({
          where: { id: { in: deletableIds } },
        });
      }
    }

    const existingKeys = new Set(
      existing.map((row) => `${row.salespersonUserId}:${row.customerId}`),
    );

    const createRows = candidates.filter(
      (row) => !existingKeys.has(`${row.salespersonUserId}:${row.customerId}`),
    );

    const created: Array<{ id: string }> = [];
    for (const row of createRows) {
      const plan = await this.prisma.salesVisitPlan.create({
        data: {
          companyId,
          visitDate,
          salespersonUserId: row.salespersonUserId,
          customerId: row.customerId,
          territoryId: row.territoryId ?? null,
          routeId: row.routeId ?? null,
          beatId: row.beatId ?? null,
          planSource: row.planSource,
          priority: row.priority ?? null,
          sequenceNo: row.sequenceNo ?? null,
          generatedByUserId: actorUserId ?? null,
        },
        select: { id: true },
      });
      created.push(plan);
    }

    return {
      data: await this.listVisitPlans({
        companyId,
        date: dto.date,
        salespersonUserId: dto.salesperson_user_ids?.[0],
      }),
      meta: { created: created.length, mode, date: dto.date },
    };
  }

  async listVisitPlans(args: {
    companyId: string;
    date: string;
    salespersonUserId?: string;
  }) {
    const date = this.parseDate(args.date, 'date');
    const data = await this.prisma.salesVisitPlan.findMany({
      where: {
        companyId: args.companyId,
        visitDate: date,
        ...(args.salespersonUserId ? { salespersonUserId: args.salespersonUserId } : {}),
      },
      orderBy: [{ sequenceNo: 'asc' }, { customer: { name: 'asc' } }],
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true, phone: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        visit: {
          include: {
            outcomes: true,
          },
        },
      },
    });
    return { data };
  }

  async createVisitPlan(companyId: string, dto: CreateVisitPlanDto, actorUserId?: string | null) {
    await this.assertUser(companyId, dto.salesperson_user_id, 'Salesperson');
    await this.assertCustomer(companyId, dto.customer_id);
    await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id,
      routeId: dto.route_id,
      beatId: dto.beat_id,
    });
    const visitDate = this.parseDate(dto.date, 'date');
    const existing = await this.prisma.salesVisitPlan.findFirst({
      where: {
        companyId,
        visitDate,
        salespersonUserId: dto.salesperson_user_id,
        customerId: dto.customer_id,
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Visit plan already exists for this customer');
    const data = await this.prisma.salesVisitPlan.create({
      data: {
        companyId,
        visitDate,
        salespersonUserId: dto.salesperson_user_id,
        customerId: dto.customer_id,
        territoryId: dto.territory_id ?? null,
        routeId: dto.route_id ?? null,
        beatId: dto.beat_id ?? null,
        planSource: dto.plan_source?.trim() || 'manual',
        priority: dto.priority?.trim() || null,
        sequenceNo: dto.sequence_no ?? null,
        notes: dto.notes?.trim() || null,
        generatedByUserId: actorUserId ?? null,
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true, phone: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
      },
    });
    return { data };
  }

  async updateVisitPlan(companyId: string, visitPlanId: string, dto: UpdateVisitPlanDto) {
    const plan = await this.prisma.salesVisitPlan.findFirst({
      where: { id: visitPlanId, companyId },
      select: { id: true },
    });
    if (!plan) throw new NotFoundException('Visit plan not found');
    const data = await this.prisma.salesVisitPlan.update({
      where: { id: visitPlanId },
      data: {
        status: dto.status?.trim(),
        priority: dto.priority !== undefined ? dto.priority?.trim() || null : undefined,
        sequenceNo: dto.sequence_no,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true, phone: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        visit: true,
      },
    });
    return { data };
  }

  async myWorklist(companyId: string, userId: string, date: string) {
    await this.assertUser(companyId, userId);
    const visitDate = this.parseDate(date, 'date');
    const plans = await this.prisma.salesVisitPlan.findMany({
      where: { companyId, salespersonUserId: userId, visitDate },
      orderBy: [{ sequenceNo: 'asc' }, { customer: { name: 'asc' } }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        route: { select: { id: true, name: true, code: true } },
        beat: { select: { id: true, name: true, code: true } },
        visit: {
          include: {
            outcomes: true,
          },
        },
      },
    });

    const customerIds = plans.map((plan) => plan.customerId);
    const [invoices, orders] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          companyId,
          customerId: { in: customerIds.length ? customerIds : ['00000000-0000-0000-0000-000000000000'] },
          status: 'issued',
          balanceDue: { gt: 0 },
        },
        select: { customerId: true, balanceDue: true },
      }),
      this.prisma.salesOrder.findMany({
        where: {
          companyId,
          customerId: { in: customerIds.length ? customerIds : ['00000000-0000-0000-0000-000000000000'] },
        },
        orderBy: { orderDate: 'desc' },
        select: { customerId: true, orderDate: true },
      }),
    ]);

    const outstandingByCustomer = new Map<string, number>();
    for (const invoice of invoices) {
      outstandingByCustomer.set(
        invoice.customerId,
        (outstandingByCustomer.get(invoice.customerId) ?? 0) +
          Number(invoice.balanceDue.toString()),
      );
    }

    const lastOrderByCustomer = new Map<string, string>();
    for (const order of orders) {
      if (!lastOrderByCustomer.has(order.customerId) && order.orderDate) {
        lastOrderByCustomer.set(order.customerId, this.dateOnly(order.orderDate));
      }
    }

    return {
      data: {
        date,
        salesperson_user_id: userId,
        counts: this.buildWorklistCounts(plans),
        visits: plans.map((plan) => ({
          visit_plan_id: plan.id,
          visit_id: plan.visit?.id ?? null,
          customer_id: plan.customer.id,
          customer_name: plan.customer.name,
          route_name: plan.route?.name ?? null,
          beat_name: plan.beat?.name ?? null,
          priority: plan.priority ?? null,
          sequence_no: plan.sequenceNo ?? null,
          outstanding_amount: outstandingByCustomer.get(plan.customerId) ?? 0,
          last_ordered_at: lastOrderByCustomer.get(plan.customerId) ?? null,
          status: plan.visit?.status ?? plan.status,
        })),
      },
    };
  }

  async myCustomers(companyId: string, userId: string) {
    await this.assertUser(companyId, userId);
    const rows = await this.prisma.customerSalesCoverage.findMany({
      where: { companyId, salespersonUserId: userId, isActive: true },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        route: { select: { id: true, name: true, code: true } },
        beat: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ route: { name: 'asc' } }, { beat: { name: 'asc' } }, { customer: { name: 'asc' } }],
    });

    const customerIds = rows.map((row) => row.customerId);
    const [invoiceRows, orderRows, visitRows] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId, customerId: { in: customerIds.length ? customerIds : ['00000000-0000-0000-0000-000000000000'] }, status: 'issued', balanceDue: { gt: 0 } },
        select: { customerId: true, balanceDue: true },
      }),
      this.prisma.salesOrder.findMany({
        where: { companyId, customerId: { in: customerIds.length ? customerIds : ['00000000-0000-0000-0000-000000000000'] } },
        orderBy: { orderDate: 'desc' },
        select: { customerId: true, orderDate: true },
      }),
      this.prisma.salesVisit.findMany({
        where: { companyId, customerId: { in: customerIds.length ? customerIds : ['00000000-0000-0000-0000-000000000000'] } },
        orderBy: { visitDate: 'desc' },
        select: { customerId: true, nextFollowUpDate: true, visitDate: true },
      }),
    ]);

    const outstandingByCustomer = new Map<string, number>();
    invoiceRows.forEach((row) => {
      outstandingByCustomer.set(
        row.customerId,
        (outstandingByCustomer.get(row.customerId) ?? 0) +
          Number(row.balanceDue.toString()),
      );
    });

    const lastOrderByCustomer = new Map<string, string>();
    orderRows.forEach((row) => {
      if (row.orderDate && !lastOrderByCustomer.has(row.customerId)) {
        lastOrderByCustomer.set(row.customerId, this.dateOnly(row.orderDate));
      }
    });

    const nextFollowUpByCustomer = new Map<string, string>();
    visitRows.forEach((row) => {
      if (row.nextFollowUpDate && !nextFollowUpByCustomer.has(row.customerId)) {
        nextFollowUpByCustomer.set(row.customerId, this.dateOnly(row.nextFollowUpDate));
      }
    });

    return {
      data: rows.map((row) => ({
        coverage_id: row.id,
        customer: row.customer,
        route: row.route,
        beat: row.beat,
        visit_frequency: row.visitFrequency,
        preferred_visit_day: row.preferredVisitDay,
        priority: row.priority,
        outstanding_amount: outstandingByCustomer.get(row.customerId) ?? 0,
        last_ordered_at: lastOrderByCustomer.get(row.customerId) ?? null,
        next_follow_up_date: nextFollowUpByCustomer.get(row.customerId) ?? null,
      })),
    };
  }

  async mySummary(companyId: string, userId: string, date: string) {
    const [worklist, openTasks] = await Promise.all([
      this.myWorklist(companyId, userId, date),
      this.prisma.collectionTask.count({
        where: {
          companyId,
          salespersonUserId: userId,
          status: { in: ['open', 'in_progress'] },
        },
      }),
    ]);

    return {
      data: {
        ...worklist.data,
        open_collection_tasks: openTasks,
      },
    };
  }

  async createVisit(companyId: string, dto: CreateVisitDto, actorUserId: string) {
    const salespersonUserId = dto.salesperson_user_id ?? actorUserId;
    await this.assertUser(companyId, salespersonUserId, 'Salesperson');

    let plan:
      | Awaited<ReturnType<typeof this.prisma.salesVisitPlan.findFirst>>
      | null = null;
    if (dto.visit_plan_id) {
      plan = await this.prisma.salesVisitPlan.findFirst({
        where: { id: dto.visit_plan_id, companyId },
      });
      if (!plan) throw new NotFoundException('Visit plan not found');
      const existingVisit = await this.prisma.salesVisit.findFirst({
        where: { companyId, visitPlanId: plan.id },
        include: {
          outcomes: true,
          customer: { select: { id: true, name: true, phone: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        },
      });
      if (existingVisit) return { data: existingVisit };
    }

    const customerId = dto.customer_id ?? plan?.customerId;
    if (!customerId) throw new BadRequestException('customer_id is required');
    await this.assertCustomer(companyId, customerId);

    const hierarchy = await this.assertCoverageHierarchy({
      companyId,
      territoryId: dto.territory_id ?? plan?.territoryId,
      routeId: dto.route_id ?? plan?.routeId,
      beatId: dto.beat_id ?? plan?.beatId,
    });

    const visitDate = this.parseDate(dto.visit_date ?? plan?.visitDate.toISOString() ?? new Date().toISOString(), 'visit_date');

    const data = await this.prisma.$transaction(async (tx) => {
      const visit = await tx.salesVisit.create({
        data: {
          companyId,
          visitPlanId: plan?.id ?? null,
          salespersonUserId,
          customerId,
          territoryId: hierarchy.territory?.id ?? plan?.territoryId ?? null,
          routeId: hierarchy.route?.id ?? plan?.routeId ?? null,
          beatId: hierarchy.beat?.id ?? plan?.beatId ?? null,
          visitDate,
          status: 'planned',
          notes: dto.notes?.trim() || null,
        },
        include: {
          outcomes: true,
          customer: { select: { id: true, name: true, phone: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
          salesperson: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      if (plan) {
        await tx.salesVisitPlan.update({
          where: { id: plan.id },
          data: { status: 'planned' },
        });
      }

      return visit;
    });

    return { data };
  }

  async getVisit(companyId: string, visitId: string) {
    const data = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true, phone: true } },
        territory: { select: { id: true, code: true, name: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        visitPlan: true,
        outcomes: { orderBy: { createdAt: 'asc' } },
        quotations: {
          select: { id: true, quoteNumber: true, status: true, total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        salesOrders: {
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        collectionTasks: {
          select: {
            id: true,
            status: true,
            promiseToPayAmount: true,
            promiseToPayDate: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!data) throw new NotFoundException('Visit not found');
    return { data };
  }

  async checkIn(companyId: string, visitId: string, dto: VisitCheckInDto) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      select: { id: true, visitPlanId: true, notes: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    const capturedAt = dto.captured_at ? this.parseDate(dto.captured_at, 'captured_at') : new Date();
    const data = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesVisit.update({
        where: { id: visitId },
        data: {
          checkInAt: capturedAt,
          checkInLatitude: dto.latitude ?? undefined,
          checkInLongitude: dto.longitude ?? undefined,
          status: 'in_progress',
          notes:
            dto.remarks !== undefined
              ? [visit.notes, dto.remarks.trim()].filter(Boolean).join('\n')
              : undefined,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
          outcomes: true,
        },
      });

      if (visit.visitPlanId) {
        await tx.salesVisitPlan.update({
          where: { id: visit.visitPlanId },
          data: { status: 'started' },
        });
      }
      return updated;
    });
    return { data };
  }

  async checkOut(companyId: string, visitId: string, dto: VisitCheckOutDto) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      select: { id: true, notes: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    const capturedAt = dto.captured_at ? this.parseDate(dto.captured_at, 'captured_at') : new Date();
    const data = await this.prisma.salesVisit.update({
      where: { id: visitId },
      data: {
        checkOutAt: capturedAt,
        checkOutLatitude: dto.latitude ?? undefined,
        checkOutLongitude: dto.longitude ?? undefined,
        notes:
          dto.remarks !== undefined
            ? [visit.notes, dto.remarks.trim()].filter(Boolean).join('\n')
            : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        route: { select: { id: true, code: true, name: true } },
        beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
        outcomes: true,
      },
    });
    return { data };
  }

  async updateVisit(companyId: string, visitId: string, dto: UpdateVisitDto) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      select: { id: true, visitPlanId: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (dto.status === 'completed' && !dto.primary_outcome) {
      throw new BadRequestException('primary_outcome is required when completing a visit');
    }
    const productiveFlag =
      dto.productive_flag ??
      (dto.primary_outcome ? PRODUCTIVE_OUTCOMES.has(dto.primary_outcome) : undefined);
    const data = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesVisit.update({
        where: { id: visitId },
        data: {
          status: dto.status?.trim(),
          primaryOutcome:
            dto.primary_outcome !== undefined ? dto.primary_outcome?.trim() || null : undefined,
          productiveFlag,
          notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
          nextFollowUpDate:
            dto.next_follow_up_date !== undefined
              ? this.parseOptionalDate(dto.next_follow_up_date)
              : undefined,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
          outcomes: true,
        },
      });
      if (visit.visitPlanId && dto.status) {
        await tx.salesVisitPlan.update({
          where: { id: visit.visitPlanId },
          data: {
            status:
              dto.status === 'in_progress'
                ? 'started'
                : dto.status === 'completed'
                  ? 'completed'
                  : dto.status,
          },
        });
      }
      return updated;
    });
    return { data };
  }

  async addVisitOutcome(companyId: string, visitId: string, dto: CreateVisitOutcomeDto) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      select: { id: true, productiveFlag: true, primaryOutcome: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    const data = await this.prisma.$transaction(async (tx) => {
      const outcome = await tx.salesVisitOutcome.create({
        data: {
          companyId,
          visitId,
          outcomeType: dto.outcome_type.trim(),
          referenceType: dto.reference_type?.trim() || null,
          referenceId: dto.reference_id ?? null,
          amount: dto.amount ? new Decimal(dto.amount) : null,
          remarks: dto.remarks?.trim() || null,
        },
      });
      if (PRODUCTIVE_OUTCOMES.has(dto.outcome_type) && !visit.productiveFlag) {
        await tx.salesVisit.update({
          where: { id: visitId },
          data: {
            productiveFlag: true,
            primaryOutcome: visit.primaryOutcome ?? dto.outcome_type.trim(),
          },
        });
      }
      return outcome;
    });
    return { data };
  }

  async markMissed(companyId: string, visitId: string, remarks?: string) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      select: { id: true, visitPlanId: true, notes: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    const data = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesVisit.update({
        where: { id: visitId },
        data: {
          status: 'missed',
          notes: remarks ? [visit.notes, remarks.trim()].filter(Boolean).join('\n') : undefined,
        },
      });
      if (visit.visitPlanId) {
        await tx.salesVisitPlan.update({
          where: { id: visit.visitPlanId },
          data: { status: 'missed' },
        });
      }
      return updated;
    });
    return { data };
  }

  async createSalesOrderFromVisit(
    companyId: string,
    visitId: string,
    dto: CreateFieldSalesOrderDto,
    actorUserId: string,
  ) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      include: {
        customer: true,
        route: { select: { id: true, defaultWarehouseId: true } },
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    const created = await this.salesOrders.create({
      companyId,
      actorUserId,
      dto: {
        customer_id: visit.customerId,
        salesperson_user_id: visit.salespersonUserId,
        order_date: this.dateOnly(visit.visitDate),
        expected_dispatch_date: dto.expected_dispatch_date,
        notes: dto.notes ?? visit.notes ?? undefined,
        items: dto.lines,
      },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.update({
        where: { id: created.data.id },
        data: {
          sourceChannel: 'field_sales',
          capturedByUserId: actorUserId,
          salesVisitId: visit.id,
          territoryId: visit.territoryId,
          routeId: visit.routeId,
          beatId: visit.beatId,
        },
        include: {
          customer: true,
          quotation: true,
          salesperson: { select: { id: true, name: true, email: true, role: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
          items: { include: { product: true } },
        },
      });

      await tx.salesVisit.update({
        where: { id: visit.id },
        data: {
          status: 'completed',
          productiveFlag: true,
          primaryOutcome: 'order_booked',
          checkOutAt: visit.checkOutAt ?? new Date(),
        },
      });

      if (visit.visitPlanId) {
        await tx.salesVisitPlan.update({
          where: { id: visit.visitPlanId },
          data: { status: 'completed' },
        });
      }

      await tx.salesVisitOutcome.create({
        data: {
          companyId,
          visitId: visit.id,
          outcomeType: 'order_booked',
          referenceType: 'sales_order',
          referenceId: order.id,
          amount: order.total,
          remarks: `Field order ${order.orderNumber ?? order.id} created`,
        },
      });

      return order;
    });

    return { data: updated };
  }

  async createQuotationFromVisit(
    companyId: string,
    visitId: string,
    dto: CreateFieldQuotationDto,
    actorUserId: string,
  ) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    const created = await this.quotations.create({
      companyId,
      actorUserId,
      dto: {
        customer_id: visit.customerId,
        salesperson_user_id: visit.salespersonUserId,
        issue_date: this.dateOnly(visit.visitDate),
        expiry_date: dto.expiry_date,
        notes: dto.notes ?? visit.notes ?? undefined,
        items: dto.lines,
      },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.update({
        where: { id: created.data.id },
        data: {
          sourceChannel: 'field_sales',
          capturedByUserId: actorUserId,
          salesVisitId: visit.id,
          territoryId: visit.territoryId,
          routeId: visit.routeId,
          beatId: visit.beatId,
        },
        include: {
          customer: true,
          salesperson: { select: { id: true, name: true, email: true, role: true } },
          route: { select: { id: true, code: true, name: true } },
          beat: { select: { id: true, code: true, name: true, dayOfWeek: true } },
          items: { include: { product: true } },
        },
      });

      await tx.salesVisit.update({
        where: { id: visit.id },
        data: {
          status: 'completed',
          productiveFlag: true,
          primaryOutcome: 'quotation_shared',
          checkOutAt: visit.checkOutAt ?? new Date(),
        },
      });

      if (visit.visitPlanId) {
        await tx.salesVisitPlan.update({
          where: { id: visit.visitPlanId },
          data: { status: 'completed' },
        });
      }

      await tx.salesVisitOutcome.create({
        data: {
          companyId,
          visitId: visit.id,
          outcomeType: 'quotation_shared',
          referenceType: 'quotation',
          referenceId: quotation.id,
          amount: quotation.total,
          remarks: `Field quotation ${quotation.quoteNumber ?? quotation.id} created`,
        },
      });

      return quotation;
    });

    return { data: updated };
  }

  async createCollectionUpdate(
    companyId: string,
    visitId: string,
    dto: CreateCollectionUpdateDto,
  ) {
    const visit = await this.prisma.salesVisit.findFirst({
      where: { id: visitId, companyId },
      select: {
        id: true,
        customerId: true,
        salespersonUserId: true,
        visitPlanId: true,
        checkOutAt: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    await this.assertInvoice(companyId, dto.invoice_id, visit.customerId);

    const channelStatus = dto.status?.trim() || 'promise_received';
    const task = await this.financeOps.createCollectionTask(companyId, {
      customer_id: visit.customerId,
      invoice_id: dto.invoice_id,
      assigned_to_user_id: visit.salespersonUserId,
      priority: dto.promised_amount ? 'high' : 'normal',
      channel: 'visit',
      next_action_date: dto.promised_date,
      promise_to_pay_date: dto.promised_date,
      promise_to_pay_amount: dto.promised_amount,
      outcome: channelStatus,
      notes: dto.remarks,
    } as any);

    const data = await this.prisma.$transaction(async (tx) => {
      const linkedTask = await tx.collectionTask.update({
        where: { id: task.data.id },
        data: {
          salesVisitId: visit.id,
          salespersonUserId: visit.salespersonUserId,
        },
      });

      await tx.salesVisit.update({
        where: { id: visit.id },
        data: {
          status: 'completed',
          productiveFlag: Boolean(dto.promised_amount || dto.promised_date || channelStatus),
          primaryOutcome: channelStatus,
          nextFollowUpDate: this.parseOptionalDate(dto.promised_date),
          checkOutAt: visit.checkOutAt ?? new Date(),
        },
      });

      if (visit.visitPlanId) {
        await tx.salesVisitPlan.update({
          where: { id: visit.visitPlanId },
          data: { status: 'completed' },
        });
      }

      await tx.salesVisitOutcome.create({
        data: {
          companyId,
          visitId: visit.id,
          outcomeType: channelStatus,
          referenceType: 'collection_task',
          referenceId: linkedTask.id,
          amount: dto.promised_amount ? new Decimal(dto.promised_amount) : null,
          remarks: dto.remarks?.trim() || null,
        },
      });

      return linkedTask;
    });

    return { data };
  }

  async getDcr(companyId: string, date: string, salespersonUserId: string) {
    await this.assertUser(companyId, salespersonUserId, 'Salesperson');
    const snapshot = await this.buildDcrSnapshot(companyId, salespersonUserId, date);
    const report = await this.prisma.repDailyReport.findFirst({
      where: {
        companyId,
        salespersonUserId,
        reportDate: this.parseDate(date, 'date'),
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return {
      data: {
        report_date: date,
        salesperson_user_id: salespersonUserId,
        snapshot,
        report,
      },
    };
  }

  async submitDcr(companyId: string, actorUserId: string, dto: SubmitDcrDto) {
    const salespersonUserId = dto.salesperson_user_id ?? actorUserId;
    await this.assertUser(companyId, salespersonUserId, 'Salesperson');
    const reportDate = this.parseDate(dto.report_date, 'report_date');
    const snapshot = await this.buildDcrSnapshot(companyId, salespersonUserId, dto.report_date);
    const data = await this.prisma.repDailyReport.upsert({
      where: {
        companyId_salespersonUserId_reportDate: {
          companyId,
          salespersonUserId,
          reportDate,
        },
      },
      update: {
        ...snapshot,
        closingNotes: dto.closing_notes?.trim() || null,
        issues: dto.issues ? (dto.issues as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: 'submitted',
        submittedAt: new Date(),
      },
      create: {
        companyId,
        salespersonUserId,
        reportDate,
        ...snapshot,
        closingNotes: dto.closing_notes?.trim() || null,
        issues: dto.issues ? (dto.issues as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: 'submitted',
        submittedAt: new Date(),
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return { data };
  }

  async reopenDcr(companyId: string, dcrId: string, reviewerUserId: string, dto: ReviewDcrDto) {
    await this.assertUser(companyId, reviewerUserId, 'Reviewer');
    const report = await this.prisma.repDailyReport.findFirst({
      where: { id: dcrId, companyId },
      select: { id: true },
    });
    if (!report) throw new NotFoundException('DCR not found');
    const data = await this.prisma.repDailyReport.update({
      where: { id: dcrId },
      data: {
        status: 'reopened',
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
        reviewNotes: dto.review_notes?.trim() || null,
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return { data };
  }

  async approveDcr(companyId: string, dcrId: string, reviewerUserId: string, dto: ReviewDcrDto) {
    await this.assertUser(companyId, reviewerUserId, 'Reviewer');
    const report = await this.prisma.repDailyReport.findFirst({
      where: { id: dcrId, companyId },
      select: { id: true },
    });
    if (!report) throw new NotFoundException('DCR not found');
    const data = await this.prisma.repDailyReport.update({
      where: { id: dcrId },
      data: {
        status: 'approved',
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
        reviewNotes: dto.review_notes?.trim() || null,
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return { data };
  }
}
