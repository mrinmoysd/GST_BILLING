import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { CancelComplianceDocumentDto } from './dto/cancel-compliance-document.dto';
import { GenerateEWayBillDto } from './dto/generate-eway-bill.dto';
import { UpdateEWayBillVehicleDto } from './dto/update-eway-bill-vehicle.dto';
import { InvoiceComplianceService } from './invoice-compliance.service';

@ApiTags('Invoice Compliance')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/invoices')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class InvoiceComplianceController {
  constructor(private readonly compliance: InvoiceComplianceService) {}

  @Get('compliance/exceptions')
  listExceptions(
    @Param('companyId') companyId: string,
    @Query('q') q?: string,
    @Query('limit') limit = '100',
  ) {
    return this.compliance.listExceptions({
      companyId,
      q,
      limit: Number(limit),
    });
  }

  @Get(':invoiceId/compliance')
  getInvoiceCompliance(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.compliance.getInvoiceCompliance({ companyId, invoiceId });
  }

  @Post(':invoiceId/compliance/e-invoice/generate')
  generateEInvoice(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.compliance.generateEInvoice({ companyId, invoiceId });
  }

  @Post(':invoiceId/compliance/e-invoice/cancel')
  cancelEInvoice(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CancelComplianceDocumentDto,
  ) {
    return this.compliance.cancelEInvoice({
      companyId,
      invoiceId,
      reason: dto.reason,
    });
  }

  @Post(':invoiceId/compliance/e-invoice/sync')
  syncEInvoice(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.compliance.syncEInvoice({ companyId, invoiceId });
  }

  @Post(':invoiceId/compliance/e-way-bill/generate')
  generateEWayBill(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: GenerateEWayBillDto,
  ) {
    return this.compliance.generateEWayBill({ companyId, invoiceId, dto });
  }

  @Post(':invoiceId/compliance/e-way-bill/update-vehicle')
  updateEWayBillVehicle(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UpdateEWayBillVehicleDto,
  ) {
    return this.compliance.updateEWayBillVehicle({
      companyId,
      invoiceId,
      dto,
    });
  }

  @Post(':invoiceId/compliance/e-way-bill/cancel')
  cancelEWayBill(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CancelComplianceDocumentDto,
  ) {
    return this.compliance.cancelEWayBill({
      companyId,
      invoiceId,
      reason: dto.reason,
    });
  }

  @Post(':invoiceId/compliance/e-way-bill/sync')
  syncEWayBill(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.compliance.syncEWayBill({ companyId, invoiceId });
  }
}
