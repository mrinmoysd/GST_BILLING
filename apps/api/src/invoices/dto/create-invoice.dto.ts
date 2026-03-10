import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreateInvoiceItemDto {
  @IsUUID()
  product_id!: string;

  @IsDecimalStringSafe()
  quantity!: string;

  @IsDecimalStringSafe()
  unit_price!: string;

  @IsOptional()
  @IsDecimalStringSafe()
  discount?: string;
}

export class CreateInvoiceDto {
  @IsUUID()
  customer_id!: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  series_code?: string;

  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idempotency_key?: string;
}
