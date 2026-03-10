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
import { Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { Headers } from '@nestjs/common';
import type { Response } from 'express';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/invoices')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
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
  createDraft(
    @Param('companyId') companyId: string,
    @Body() dto: CreateInvoiceDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.invoices.createDraft({
      companyId,
      createdByUserId: 'TODO',
      dto,
      idempotencyKey,
    });
  }

  @Patch('/:invoiceId')
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
  issue(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: IssueInvoiceDto,
  ) {
    return this.invoices.issue({
      companyId,
      invoiceId,
      seriesCode: dto.series_code,
    });
  }

  @Post('/:invoiceId/cancel')
  cancel(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoices.cancel({ companyId, invoiceId });
  }

  @Post('/:invoiceId/pdf/regenerate')
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
