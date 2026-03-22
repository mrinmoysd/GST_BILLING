import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing.webhook.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
