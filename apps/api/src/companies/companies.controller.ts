import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  async getCompany(@Param('companyId') companyId: string) {
    const company = await this.companies.getCompany(companyId);
    return { ok: true, data: company };
  }

  @Patch()
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.companies.updateCompany(companyId, dto);
    return { ok: true, data: company };
  }
}
