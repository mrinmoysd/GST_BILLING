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

export class CreateInvoiceItemBatchAllocationDto {
  @IsUUID()
  product_batch_id!: string;

  @IsDecimalStringSafe()
  quantity!: string;
}

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

  @IsOptional()
  @IsString()
  @Length(3, 240)
  override_reason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemBatchAllocationDto)
  batch_allocations?: CreateInvoiceItemBatchAllocationDto[];
}

export class CreateInvoiceDto {
  @IsUUID()
  customer_id!: string;

  @IsOptional()
  @IsUUID()
  salesperson_user_id?: string;

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

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idempotency_key?: string;
}
