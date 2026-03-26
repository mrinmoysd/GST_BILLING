import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateStockTransferItemDto {
  @ApiProperty()
  @IsUUID()
  @Length(36, 36)
  product_id!: string;

  @ApiProperty()
  @IsDecimalStringSafe()
  quantity!: string;
}

export class CreateStockTransferDto {
  @ApiProperty()
  @IsUUID()
  @Length(36, 36)
  from_warehouse_id!: string;

  @ApiProperty()
  @IsUUID()
  @Length(36, 36)
  to_warehouse_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  transfer_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateStockTransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  items!: CreateStockTransferItemDto[];
}
