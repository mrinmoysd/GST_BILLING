import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { Headers } from '@nestjs/common';
import type { Response } from 'express';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { ShareInvoiceDto } from './dto/share-invoice.dto';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/invoices')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('sales.view')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly pdf: InvoicePdfService,
    private readonly jobs: JobsService,
  ) {}

  @Get()
  list(
    @Param('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.invoices.list({
      companyId,
      page: Number(page),
      limit: Number(limit),
      q,
      status,
      from,
      to,
    });
  }

  @Get('/:invoiceId')
  get(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoices.get({ companyId, invoiceId });
  }

  @Post()
  @RequirePermissions('sales.manage')
  createDraft(
    @Param('companyId') companyId: string,
    @Body() dto: CreateInvoiceDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Req() req?: any,
  ) {
    return this.invoices.createDraft({
      companyId,
      createdByUserId: req?.user?.sub ?? null,
      dto,
      idempotencyKey,
    });
  }

  @Patch('/:invoiceId')
  @RequirePermissions('sales.manage')
  patchDraft(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() body: any,
  ) {
    return this.invoices.patchDraft({
      companyId,
      invoiceId,
      patch: {
        notes: body?.notes,
        due_date: body?.due_date,
        issue_date: body?.issue_date,
      },
    });
  }

  @Post('/:invoiceId/issue')
  @RequirePermissions('sales.manage')
  issue(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: IssueInvoiceDto,
  ) {
    return this.invoices.issue({
      companyId,
      invoiceId,
      seriesCode: dto.series_code,
      creditOverrideReason: dto.credit_override_reason,
    });
  }

  @Post('/:invoiceId/cancel')
  @RequirePermissions('sales.manage')
  cancel(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoices.cancel({ companyId, invoiceId });
  }

  @Post('/:invoiceId/credit-notes')
  @RequirePermissions('sales.manage')
  createCreditNote(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreateCreditNoteDto,
  ) {
    return this.invoices.createCreditNote({ companyId, invoiceId, dto });
  }

  @Post('/:invoiceId/share')
  @RequirePermissions('sales.manage')
  share(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: ShareInvoiceDto,
  ) {
    return this.invoices.shareInvoice({ companyId, invoiceId, dto });
  }

  @Post('/:invoiceId/pdf/regenerate')
  @RequirePermissions('sales.manage')
  async regeneratePdf(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.jobs.enqueueInvoicePdfRegenerate({ companyId, invoiceId });
  }

  @Get('/:invoiceId/pdf')
  async getPdf(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Res() res: Response,
  ) {
    const { filepath } = await this.pdf.getPath({ companyId, invoiceId });
    return res.sendFile(filepath);
  }
}
