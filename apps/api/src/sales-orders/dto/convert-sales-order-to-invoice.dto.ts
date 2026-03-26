import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class SalesOrderFulfillmentItemDto {
  @IsUUID()
  sales_order_item_id!: string;

  @IsDecimalStringSafe()
  quantity!: string;
}

export class ConvertSalesOrderToInvoiceDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  series_code?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderFulfillmentItemDto)
  items?: SalesOrderFulfillmentItemDto[];
}
