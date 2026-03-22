import { Module, forwardRef } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { JobsModule } from '../jobs/jobs.module';
import { RbacModule } from '../rbac/rbac.module';
import { GstModule } from '../gst/gst.module';
import { InvoicesController } from './invoices.controller';
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
    forwardRef(() => JobsModule),
  ],
  controllers: [
    InvoicesController,
    PaymentsController,
    InvoiceSeriesController,
  ],
  providers: [
    InvoicesService,
    PaymentsService,
    InvoiceNumberService,
    InvoicePdfService,
  ],
  exports: [InvoicePdfService],
})
export class InvoicesModule {}
