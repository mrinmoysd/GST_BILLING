import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreatePurchaseItemBatchDto {
  @ApiProperty({ example: 'BATCH-001' })
  @IsString()
  batch_number!: string;

  @ApiProperty({ example: '10' })
  @IsDecimalStringSafe()
  quantity!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  expiry_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  manufacturing_date?: string;
}

export class CreatePurchaseItemDto {
  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsUUID()
  @Length(36, 36)
  product_id!: string;

  @ApiProperty({
    example: '10',
    description: 'Quantity purchased (decimal string)',
  })
  @IsDecimalStringSafe()
  quantity!: string;

  @ApiProperty({ example: '94.5', description: 'Unit cost (decimal string)' })
  @IsDecimalStringSafe()
  unit_cost!: string;

  @ApiProperty({ example: '0', required: false })
  @IsOptional()
  @IsDecimalStringSafe()
  discount?: string;

  @ApiProperty({
    required: false,
    type: [Object],
    description: 'Optional batch breakdown for batch-tracked products',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemBatchDto)
  batches?: CreatePurchaseItemBatchDto[];
}

export class CreatePurchaseDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  @Length(36, 36)
  supplier_id!: string;

  @ApiProperty({ required: false, description: 'Purchase date (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  purchase_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Warehouse / godown ID' })
  @IsOptional()
  @IsUUID()
  @Length(36, 36)
  warehouse_id?: string;

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];
}
