import { Module, forwardRef } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { JobsModule } from '../jobs/jobs.module';
import { RbacModule } from '../rbac/rbac.module';
import { GstModule } from '../gst/gst.module';
import { PricingModule } from '../pricing/pricing.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { MigrationOpsModule } from '../migration-ops/migration-ops.module';
import { BillingModule } from '../billing/billing.module';
import { InvoicesController } from './invoices.controller';
import { InvoiceComplianceController } from './invoice-compliance.controller';
import { InvoiceComplianceService } from './invoice-compliance.service';
import { PaymentsController } from './payments.controller';
import { InvoiceSeriesController } from './invoice-series.controller';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';

@Module({
  imports: [
    PrismaModule,
    AccountingModule,
    InventoryModule,
    IdempotencyModule,
    RbacModule,
    GstModule,
    PricingModule,
    SalesOrdersModule,
    MigrationOpsModule,
    BillingModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [
    InvoicesController,
    InvoiceComplianceController,
    PaymentsController,
    InvoiceSeriesController,
  ],
  providers: [
    InvoicesService,
    InvoiceComplianceService,
    PaymentsService,
    InvoiceNumberService,
    InvoicePdfService,
  ],
  exports: [InvoicePdfService],
})
export class InvoicesModule {}
