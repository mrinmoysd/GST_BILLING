import { Module } from '@nestjs/common';

import { FinanceOpsModule } from '../finance-ops/finance-ops.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { FieldSalesController } from './field-sales.controller';
import { FieldSalesService } from './field-sales.service';

@Module({
  imports: [SalesOrdersModule, QuotationsModule, FinanceOpsModule],
  controllers: [FieldSalesController],
  providers: [FieldSalesService],
  exports: [FieldSalesService],
})
export class FieldSalesModule {}
