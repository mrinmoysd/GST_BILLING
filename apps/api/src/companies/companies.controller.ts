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

  @Post('/verify-gstin')
  async verifyGstin(@Param('companyId') companyId: string) {
    const data = await this.companies.verifyGstin(companyId);
    return { ok: true, data };
  }

  @Post('/logo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
  async getLogo(
    @Param('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const filepath = this.companies.getLogoPath(companyId);
    return res.sendFile(filepath);
  }
}
