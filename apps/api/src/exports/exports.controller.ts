import {
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
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { ExportsService } from './exports.service';

@ApiTags('exports')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/exports')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('reports.view')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post('gstr1')
  createGstr1(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.exportsService.createGstr1Export({ companyId, from, to });
  }

  @Get(':jobId')
  getJob(@Param('companyId') companyId: string, @Param('jobId') jobId: string) {
    return this.exportsService.getJob({ companyId, jobId });
  }

  @Get(':jobId/download')
  async download(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ) {
    // Ensure job exists and is company-scoped.
    const job = await this.exportsService.getJob({ companyId, jobId });
    const data = job.data;

    if (data.status !== 'succeeded') {
      res.status(409);
      return res.json({ message: 'Export not ready', status: data.status });
    }

    const filepath = this.exportsService.getDownloadPath(jobId);
    if (!fs.existsSync(filepath)) {
      res.status(404);
      return res.json({ message: 'Export file missing on disk' });
    }

    res.setHeader('Content-Type', 'text/csv');
    if (data.resultFileName) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${data.resultFileName}"`,
      );
    }

    return res.sendFile(filepath);
  }
}
