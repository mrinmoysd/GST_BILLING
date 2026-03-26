import { Module } from '@nestjs/common';
import { GstModule } from '../gst/gst.module';
import { PricingModule } from '../pricing/pricing.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [GstModule, SalesOrdersModule, PricingModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
