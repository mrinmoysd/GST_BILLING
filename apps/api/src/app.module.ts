import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './common/config/env.validation';
import { CustomersModule } from './customers/customers.module';
import { InventoryModule } from './inventory/inventory.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReportsModule } from './reports/reports.module';
import { ExportsModule } from './exports/exports.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { JobsModule } from './jobs/jobs.module';
import { AdminModule } from './admin/admin.module';
import { AccountingModule } from './accounting/accounting.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { BillingModule } from './billing/billing.module';
import { PlatformAdminModule } from './admin/platform-admin.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { GstModule } from './gst/gst.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { PricingModule } from './pricing/pricing.module';
import { FinanceOpsModule } from './finance-ops/finance-ops.module';
import { FieldSalesModule } from './field-sales/field-sales.module';
import { MigrationOpsModule } from './migration-ops/migration-ops.module';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // prefer root .env (when running from repo root) then local .env
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,
    InventoryModule,
    InvoicesModule,
    PurchasesModule,
    ReportsModule,
    ExportsModule,
    JobsModule,
    AdminModule,
    PlatformAdminModule,
    AccountingModule,
    NotificationsModule,
    FilesModule,
    BillingModule,
    CompaniesModule,
    UsersModule,
    CategoriesModule,
    OnboardingModule,
    GstModule,
    QuotationsModule,
    SalesOrdersModule,
    PricingModule,
    FinanceOpsModule,
    FieldSalesModule,
    MigrationOpsModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
