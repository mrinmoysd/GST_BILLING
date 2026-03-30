import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { BillingEnforcementService } from './billing-enforcement.service';
import { BillingEntitlementsService } from './billing-entitlements.service';
import { BillingUsageService } from './billing-usage.service';
import { BillingWarningsService } from './billing-warnings.service';
import { BillingController } from './billing.controller';
import { BillingPublicController } from './billing-public.controller';
import { BillingWebhookController } from './billing.webhook.controller';
import { BillingService } from './billing.service';

@Global()
@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [BillingController, BillingPublicController, BillingWebhookController],
  providers: [
    BillingService,
    BillingEntitlementsService,
    BillingEnforcementService,
    BillingUsageService,
    BillingWarningsService,
  ],
  exports: [
    BillingService,
    BillingEntitlementsService,
    BillingEnforcementService,
    BillingUsageService,
    BillingWarningsService,
  ],
})
export class BillingModule {}
