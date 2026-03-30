import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { PatchPurchaseDto } from './dto/patch-purchase.dto';

@ApiTags('purchases')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/purchases')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('purchases.view')
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  async list(
    @Param('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const out = await this.purchases.list({
      companyId,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
      q,
      status,
      from,
      to,
    });
    return out;
  }

  @Get(':purchaseId')
  async get(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.purchases.get({ companyId, purchaseId });
  }

  @Post()
  @RequirePermissions('purchases.manage')
  async createDraft(
    @Param('companyId') companyId: string,
    @Body() dto: CreatePurchaseDto,
  ) {
    const data = await this.purchases.createDraft({ companyId, dto });
    return { data: data.data };
  }

  @Patch(':purchaseId')
  @RequirePermissions('purchases.manage')
  async patchDraft(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
    @Body() patch: PatchPurchaseDto,
  ) {
    return this.purchases.patchDraft({ companyId, purchaseId, patch });
  }

  @Post(':purchaseId/receive')
  @RequirePermissions('purchases.manage')
  async receive(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.purchases.receive({ companyId, purchaseId });
  }

  @Post(':purchaseId/cancel')
  @RequirePermissions('purchases.manage')
  async cancel(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.purchases.cancel({ companyId, purchaseId });
  }

  @Post(':purchaseId/returns')
  @RequirePermissions('purchases.manage')
  async createReturn(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchases.createReturn({ companyId, purchaseId, dto });
  }

  @Post(':purchaseId/bill')
  @RequirePermissions('purchases.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBill(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
    @UploadedFile() file?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Bill file is required.');
    }

    const storageDir = path.join(process.cwd(), 'storage', 'purchases');
    fs.mkdirSync(storageDir, { recursive: true });

    // Keep the same extension if present, else default to .bin
    const ext = path.extname(file.originalname || '') || '.bin';
    const filename = `purchase_${purchaseId}${ext}`;
    const filepath = path.join(storageDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    const billUrl = `/api/companies/${companyId}/purchases/${purchaseId}/bill`;
    return this.purchases.attachBill({
      companyId,
      purchaseId,
      billUrl,
      originalName: file.originalname,
    });
  }

  @Get(':purchaseId/bill')
  async downloadBill(
    @Param('companyId') companyId: string,
    @Param('purchaseId') purchaseId: string,
    @Res() res: Response,
  ) {
    // Stored path is deterministic; we don't rely on billUrl for filesystem path.
    const storageDir = path.join(process.cwd(), 'storage', 'purchases');

    // We don't know the extension without DB, so try common patterns.
    const candidates = fs
      .readdirSync(storageDir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter(
        (n) =>
          n.startsWith(`purchase_${purchaseId}.`) ||
          n === `purchase_${purchaseId}`,
      );

    if (!candidates.length) {
      throw new NotFoundException('Bill not found.');
    }

    const filepath = path.join(storageDir, candidates[0]);
    return res.sendFile(filepath);
  }
}
