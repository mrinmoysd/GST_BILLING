import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreateDeliveryChallanItemDto {
  @IsUUID()
  sales_order_item_id!: string;

  @IsDecimalStringSafe()
  quantity_requested!: string;

  @IsOptional()
  @IsDecimalStringSafe()
  quantity_dispatched?: string;

  @IsOptional()
  @IsDecimalStringSafe()
  quantity_delivered?: string;

  @IsOptional()
  @IsDecimalStringSafe()
  short_supply_quantity?: string;
}

export class CreateDeliveryChallanDto {
  @IsUUID()
  warehouse_id!: string;

  @IsOptional()
  @IsDateString()
  challan_date?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  transporter_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  vehicle_number?: string;

  @IsOptional()
  @IsString()
  dispatch_notes?: string;

  @IsOptional()
  @IsString()
  delivery_notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryChallanItemDto)
  items!: CreateDeliveryChallanItemDto[];
}
