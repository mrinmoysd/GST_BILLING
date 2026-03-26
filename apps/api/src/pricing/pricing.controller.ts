import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { CreateCommercialSchemeDto } from './dto/create-commercial-scheme.dto';
import { CreateCustomerProductPriceDto } from './dto/create-customer-product-price.dto';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { PricingPreviewDto } from './dto/pricing-preview.dto';
import { PricingService } from './pricing.service';

@ApiTags('Pricing')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/pricing')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('/price-lists')
  listPriceLists(@Param('companyId') companyId: string) {
    return this.pricing.listPriceLists(companyId);
  }

  @Post('/price-lists')
  createPriceList(
    @Param('companyId') companyId: string,
    @Body() dto: CreatePriceListDto,
  ) {
    return this.pricing.createPriceList({ companyId, dto });
  }

  @Get('/customer-rates')
  listCustomerRates(@Param('companyId') companyId: string) {
    return this.pricing.listCustomerProductPrices(companyId);
  }

  @Post('/customer-rates')
  createCustomerRate(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCustomerProductPriceDto,
  ) {
    return this.pricing.createCustomerProductPrice({ companyId, dto });
  }

  @Get('/schemes')
  listSchemes(@Param('companyId') companyId: string) {
    return this.pricing.listSchemes(companyId);
  }

  @Post('/schemes')
  createScheme(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCommercialSchemeDto,
  ) {
    return this.pricing.createScheme({ companyId, dto });
  }

  @Get('/audit-logs')
  listAuditLogs(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.pricing.listCommercialAuditLogs({
      companyId,
      limit: limit ? Number(limit) : undefined,
      action,
    });
  }

  @Post('/preview')
  preview(
    @Param('companyId') companyId: string,
    @Body() dto: PricingPreviewDto,
  ) {
    return this.pricing.preview({
      companyId,
      customerId: dto.customer_id,
      items: dto.items,
      documentDate: dto.document_date,
      documentType: dto.document_type,
    });
  }
}
