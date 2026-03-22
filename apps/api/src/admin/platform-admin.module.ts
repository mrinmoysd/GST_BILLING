import { Module } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';

import { AdminCompaniesController } from './super/admin-companies.controller';
import { AdminAuditController } from './super/admin-audit.controller';
import { AdminDashboardController } from './super/admin-dashboard.controller';
import { AdminGovernanceService } from './super/admin-governance.service';
import { AdminInternalUsersController } from './super/admin-internal-users.controller';
import { AdminSubscriptionsController } from './super/admin-subscriptions.controller';
import { AdminUsageController } from './super/admin-usage.controller';
import { AdminSupportTicketsController } from './super/admin-support-tickets.controller';
import { PlatformAdminService } from './super/platform-admin.service';

@Module({
  imports: [PrismaModule, AccountingModule, BillingModule],
  controllers: [
    AdminAuditController,
    AdminCompaniesController,
    AdminDashboardController,
    AdminInternalUsersController,
    AdminSubscriptionsController,
    AdminUsageController,
    AdminSupportTicketsController,
  ],
  providers: [PlatformAdminService, AdminGovernanceService],
})
export class PlatformAdminModule {}
