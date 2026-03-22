import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { CreateGstExportDto } from './dto/create-gst-export.dto';
import { GstService } from './gst.service';

@ApiTags('GST')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/gst')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class GstController {
  constructor(private readonly gst: GstService) {}

  @Get('gstr1')
  async gstr1(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { ok: true, data: await this.gst.getGstr1({ companyId, from, to }) };
  }

  @Get('gstr3b')
  async gstr3b(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { ok: true, data: await this.gst.getGstr3b({ companyId, from, to }) };
  }

  @Get('hsn-summary')
  async hsnSummary(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { ok: true, data: await this.gst.getHsnSummary({ companyId, from, to }) };
  }

  @Get('itc')
  async itc(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { ok: true, data: await this.gst.getItcReport({ companyId, from, to }) };
  }

  @Post('export')
  async createExport(
    @Param('companyId') companyId: string,
    @Body() dto: CreateGstExportDto,
  ) {
    return this.gst.createExport({
      companyId,
      report: dto.report,
      format: dto.format,
      from: dto.from,
      to: dto.to,
    });
  }

  @Get('exports/:jobId')
  async getJob(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.gst.getExportJob({ companyId, jobId });
  }

  @Get('exports/:jobId/download')
  async download(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ) {
    const job = await this.gst.getExportJob({ companyId, jobId });
    const data = job.data;
    if (data.status !== 'succeeded') {
      res.status(409);
      return res.json({ message: 'Export not ready', status: data.status });
    }

    const filepath = this.gst.getDownloadPath({
      jobId,
      resultFileName: data.resultFileName,
    });
    if (!fs.existsSync(filepath)) {
      res.status(404);
      return res.json({ message: 'Export file missing on disk' });
    }

    const contentType = data.resultFileName?.endsWith('.json')
      ? 'application/json'
      : data.resultFileName?.endsWith('.xls')
        ? 'application/vnd.ms-excel'
        : 'text/csv';
    res.setHeader('Content-Type', contentType);
    if (data.resultFileName) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${data.resultFileName}"`,
      );
    }

    return res.sendFile(filepath);
  }
}
