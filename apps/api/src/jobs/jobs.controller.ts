import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/jobs')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('sales.view')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('/:jobId')
  getJob(@Param('jobId') jobId: string) {
    return this.jobs.getJob({ jobId });
  }
}
