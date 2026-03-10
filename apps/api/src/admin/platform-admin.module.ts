import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { AdminCompaniesController } from './super/admin-companies.controller';
import { AdminSubscriptionsController } from './super/admin-subscriptions.controller';
import { AdminUsageController } from './super/admin-usage.controller';
import { AdminSupportTicketsController } from './super/admin-support-tickets.controller';
import { PlatformAdminService } from './super/platform-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminCompaniesController,
    AdminSubscriptionsController,
    AdminUsageController,
    AdminSupportTicketsController,
  ],
  providers: [PlatformAdminService],
})
export class PlatformAdminModule {}
