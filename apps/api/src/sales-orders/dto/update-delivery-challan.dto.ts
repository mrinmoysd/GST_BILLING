import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryChallanDto } from './create-delivery-challan.dto';

export class UpdateDeliveryChallanDto extends PartialType(
  CreateDeliveryChallanDto,
) {}
