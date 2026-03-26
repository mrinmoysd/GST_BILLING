import { Module } from '@nestjs/common';
import { GstModule } from '../gst/gst.module';
import { PricingModule } from '../pricing/pricing.module';
import { DeliveryChallansController } from './delivery-challans.controller';
import { DeliveryChallansService } from './delivery-challans.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  imports: [GstModule, PricingModule],
  controllers: [SalesOrdersController, DeliveryChallansController],
  providers: [SalesOrdersService, DeliveryChallansService],
  exports: [SalesOrdersService, DeliveryChallansService],
})
export class SalesOrdersModule {}
