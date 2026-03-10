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

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];
}
