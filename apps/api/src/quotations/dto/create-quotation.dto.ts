import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreateQuotationItemDto {
  @IsUUID()
  product_id!: string;

  @IsDecimalStringSafe()
  quantity!: string;

  @IsDecimalStringSafe()
  unit_price!: string;

  @IsOptional()
  @IsDecimalStringSafe()
  discount?: string;

  @IsOptional()
  @IsString()
  override_reason?: string;
}

export class CreateQuotationDto {
  @IsUUID()
  customer_id!: string;

  @IsOptional()
  @IsUUID()
  salesperson_user_id?: string;

  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items!: CreateQuotationItemDto[];
}
