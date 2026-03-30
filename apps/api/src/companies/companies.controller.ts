import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @RequirePermissions('settings.company.manage')
  async getCompany(@Param('companyId') companyId: string) {
    const company = await this.companies.getCompany(companyId);
    return { ok: true, data: company };
  }

  @Patch()
  @RequirePermissions('settings.company.manage')
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.companies.updateCompany(companyId, dto);
    return { ok: true, data: company };
  }

  @Post('/verify-gstin')
  @RequirePermissions('settings.company.manage')
  async verifyGstin(@Param('companyId') companyId: string) {
    const data = await this.companies.verifyGstin(companyId);
    return { ok: true, data };
  }

  @Post('/logo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('settings.company.manage')
  async uploadLogo(
    @Param('companyId') companyId: string,
    @UploadedFile() file?: any,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const company = await this.companies.attachLogo(companyId, file);
    return { ok: true, data: company };
  }

  @Get('/logo')
  @RequirePermissions('settings.company.manage')
  async getLogo(
    @Param('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const filepath = this.companies.getLogoPath(companyId);
    return res.sendFile(filepath);
  }
}
