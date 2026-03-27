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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { AuthUser, type AuthUserPayload } from '../common/auth/auth-user.decorator';
import {
  CreateCustomFieldDto,
  CreateImportProfileDto,
  CreateIntegrationApiKeyDto,
  CreateMigrationProjectDto,
  CreatePrintTemplateDto,
  CreatePrintTemplateVersionDto,
  CreateWebhookEndpointDto,
  PreviewPrintTemplateDto,
  SetCustomFieldValueDto,
  TestWebhookEndpointDto,
  UpdateCustomFieldDto,
  UpdateImportProfileDto,
  UpdateMigrationProjectDto,
  UpdateWebhookEndpointDto,
  UploadAliasDto,
  UploadImportJobDto,
} from './migration-ops.dto';
import { MigrationOpsService } from './migration-ops.service';

@ApiTags('MigrationOps')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class MigrationOpsController {
  constructor(private readonly migrationOps: MigrationOpsService) {}

  @Get('migration-projects')
  listProjects(@Param('companyId') companyId: string) {
    return this.migrationOps.listMigrationProjects(companyId);
  }

  @Post('migration-projects')
  createProject(
    @Param('companyId') companyId: string,
    @Body() dto: CreateMigrationProjectDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createMigrationProject(companyId, dto, user.sub);
  }

  @Get('migration-projects/:projectId')
  getProject(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.migrationOps.getMigrationProject(companyId, projectId);
  }

  @Patch('migration-projects/:projectId')
  patchProject(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateMigrationProjectDto,
  ) {
    return this.migrationOps.updateMigrationProject(companyId, projectId, dto);
  }

  @Get('imports/templates')
  listTemplates() {
    return this.migrationOps.listImportTemplates();
  }

  @Get('imports/templates/:entityType/download')
  downloadTemplate(@Param('entityType') entityType: string) {
    return this.migrationOps.getImportTemplateDownload(entityType);
  }

  @Get('import-profiles')
  listImportProfiles(@Param('companyId') companyId: string) {
    return this.migrationOps.listImportProfiles(companyId);
  }

  @Post('import-profiles')
  createImportProfile(
    @Param('companyId') companyId: string,
    @Body() dto: CreateImportProfileDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createImportProfile(companyId, dto, user.sub);
  }

  @Patch('import-profiles/:profileId')
  updateImportProfile(
    @Param('companyId') companyId: string,
    @Param('profileId') profileId: string,
    @Body() dto: UpdateImportProfileDto,
  ) {
    return this.migrationOps.updateImportProfile(companyId, profileId, dto);
  }

  @Post('import-jobs/upload')
  uploadImportJob(
    @Param('companyId') companyId: string,
    @Body() dto: UploadImportJobDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.uploadImportJob(companyId, dto, user.sub);
  }

  @Post('import-jobs/:jobId/dry-run')
  dryRunImportJob(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.migrationOps.dryRunImportJob(companyId, jobId);
  }

  @Post('import-jobs/:jobId/commit')
  commitImportJob(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.migrationOps.commitImportJob(companyId, jobId);
  }

  @Get('import-jobs')
  listImportJobs(@Param('companyId') companyId: string) {
    return this.migrationOps.listImportJobs(companyId);
  }

  @Get('import-jobs/:jobId')
  getImportJob(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.migrationOps.getImportJob(companyId, jobId);
  }

  @Get('import-jobs/:jobId/rows')
  listImportJobRows(
    @Param('companyId') companyId: string,
    @Param('jobId') jobId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('status') status?: string,
  ) {
    return this.migrationOps.listImportJobRows({
      companyId,
      jobId,
      page: Number(page),
      limit: Number(limit),
      status,
    });
  }

  @Get('imports/opening-stock/template')
  getOpeningStockTemplate() {
    return this.migrationOps.getImportTemplateDownload('opening_stock');
  }

  @Post('imports/opening-stock/upload')
  uploadOpeningStock(
    @Param('companyId') companyId: string,
    @Body() dto: UploadAliasDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.uploadImportJob(
      companyId,
      {
        entity_type: 'opening_stock',
        ...dto,
      },
      user.sub,
    );
  }

  @Get('imports/opening-balances/template')
  getOpeningBalanceTemplate() {
    return this.migrationOps.listImportTemplates();
  }

  @Post('imports/opening-balances/upload')
  uploadOpeningBalances(
    @Param('companyId') companyId: string,
    @Body() dto: UploadAliasDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.uploadImportJob(
      companyId,
      {
        entity_type: 'ledger_openings',
        ...dto,
      },
      user.sub,
    );
  }

  @Get('imports/open-sales-invoices/template')
  getOpenSalesInvoiceTemplate() {
    return this.migrationOps.getImportTemplateDownload('open_sales_invoices');
  }

  @Post('imports/open-sales-invoices/upload')
  uploadOpenSalesInvoices(
    @Param('companyId') companyId: string,
    @Body() dto: UploadAliasDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.uploadImportJob(
      companyId,
      {
        entity_type: 'open_sales_invoices',
        ...dto,
      },
      user.sub,
    );
  }

  @Get('imports/open-purchases/template')
  getOpenPurchasesTemplate() {
    return this.migrationOps.getImportTemplateDownload('open_purchase_bills');
  }

  @Post('imports/open-purchases/upload')
  uploadOpenPurchases(
    @Param('companyId') companyId: string,
    @Body() dto: UploadAliasDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.uploadImportJob(
      companyId,
      {
        entity_type: 'open_purchase_bills',
        ...dto,
      },
      user.sub,
    );
  }

  @Get('print-templates')
  listPrintTemplates(
    @Param('companyId') companyId: string,
    @Query('template_type') templateType?: string,
  ) {
    return this.migrationOps.listPrintTemplates(companyId, templateType);
  }

  @Post('print-templates')
  createPrintTemplate(
    @Param('companyId') companyId: string,
    @Body() dto: CreatePrintTemplateDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createPrintTemplate(companyId, dto, user.sub);
  }

  @Get('print-templates/:templateId')
  getPrintTemplate(
    @Param('companyId') companyId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.migrationOps.getPrintTemplate(companyId, templateId);
  }

  @Post('print-templates/:templateId/versions')
  createPrintTemplateVersion(
    @Param('companyId') companyId: string,
    @Param('templateId') templateId: string,
    @Body() dto: CreatePrintTemplateVersionDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createPrintTemplateVersion(
      companyId,
      templateId,
      dto,
      user.sub,
    );
  }

  @Post('print-templates/:templateId/publish')
  publishPrintTemplate(
    @Param('companyId') companyId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.migrationOps.publishPrintTemplate(companyId, templateId);
  }

  @Post('print-templates/:templateId/set-default')
  setDefaultPrintTemplate(
    @Param('companyId') companyId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.migrationOps.setDefaultPrintTemplate(companyId, templateId);
  }

  @Post('print-templates/:templateId/preview')
  previewPrintTemplate(
    @Param('companyId') companyId: string,
    @Param('templateId') templateId: string,
    @Body() dto: PreviewPrintTemplateDto,
  ) {
    return this.migrationOps.previewPrintTemplate(companyId, templateId, dto);
  }

  @Get('custom-fields')
  listCustomFields(
    @Param('companyId') companyId: string,
    @Query('entity_type') entityType?: string,
  ) {
    return this.migrationOps.listCustomFields(companyId, entityType);
  }

  @Post('custom-fields')
  createCustomField(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCustomFieldDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createCustomField(companyId, dto, user.sub);
  }

  @Patch('custom-fields/:fieldId')
  updateCustomField(
    @Param('companyId') companyId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.migrationOps.updateCustomField(companyId, fieldId, dto);
  }

  @Get('custom-fields/values')
  listCustomFieldValues(
    @Param('companyId') companyId: string,
    @Query('entity_type') entityType: string,
    @Query('entity_id') entityId: string,
  ) {
    return this.migrationOps.listCustomFieldValues(companyId, entityType, entityId);
  }

  @Post('custom-fields/values')
  setCustomFieldValue(
    @Param('companyId') companyId: string,
    @Body() dto: SetCustomFieldValueDto,
  ) {
    return this.migrationOps.setCustomFieldValue(companyId, dto);
  }

  @Get('integrations/webhooks')
  listWebhookEndpoints(@Param('companyId') companyId: string) {
    return this.migrationOps.listWebhookEndpoints(companyId);
  }

  @Get('integrations/webhooks/events')
  listWebhookEvents() {
    return this.migrationOps.listSupportedWebhookEvents();
  }

  @Post('integrations/webhooks')
  createWebhookEndpoint(
    @Param('companyId') companyId: string,
    @Body() dto: CreateWebhookEndpointDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createWebhookEndpoint(companyId, dto, user.sub);
  }

  @Patch('integrations/webhooks/:endpointId')
  updateWebhookEndpoint(
    @Param('companyId') companyId: string,
    @Param('endpointId') endpointId: string,
    @Body() dto: UpdateWebhookEndpointDto,
  ) {
    return this.migrationOps.updateWebhookEndpoint(companyId, endpointId, dto);
  }

  @Post('integrations/webhooks/:endpointId/test')
  testWebhookEndpoint(
    @Param('companyId') companyId: string,
    @Param('endpointId') endpointId: string,
    @Body() dto: TestWebhookEndpointDto,
  ) {
    return this.migrationOps.testWebhookEndpoint(companyId, endpointId, dto);
  }

  @Get('integrations/webhooks/:endpointId/deliveries')
  listWebhookDeliveries(
    @Param('companyId') companyId: string,
    @Param('endpointId') endpointId: string,
  ) {
    return this.migrationOps.listWebhookDeliveries(companyId, endpointId);
  }

  @Post('integrations/webhooks/:endpointId/deliveries/:deliveryId/retry')
  retryWebhookDelivery(
    @Param('companyId') companyId: string,
    @Param('endpointId') endpointId: string,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.migrationOps.retryWebhookDelivery(companyId, endpointId, deliveryId);
  }

  @Get('integrations/api-keys')
  listApiKeys(@Param('companyId') companyId: string) {
    return this.migrationOps.listIntegrationApiKeys(companyId);
  }

  @Post('integrations/api-keys')
  createApiKey(
    @Param('companyId') companyId: string,
    @Body() dto: CreateIntegrationApiKeyDto,
    @AuthUser() user: AuthUserPayload,
  ) {
    return this.migrationOps.createIntegrationApiKey(companyId, dto, user.sub);
  }

  @Post('integrations/api-keys/:keyId/revoke')
  revokeApiKey(
    @Param('companyId') companyId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.migrationOps.revokeIntegrationApiKey(companyId, keyId);
  }
}
