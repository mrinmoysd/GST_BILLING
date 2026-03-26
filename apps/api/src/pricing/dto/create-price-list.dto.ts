import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceListItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_id!: string;

  @ApiPropertyOptional({ description: 'Fixed resolved unit price' })
  @IsOptional()
  @IsString()
  fixed_price?: string;

  @ApiPropertyOptional({ description: 'Percent discount from product base price' })
  @IsOptional()
  @IsString()
  discount_percent?: string;
}

export class CreatePriceListDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pricing_tier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @ApiProperty({ type: [CreatePriceListItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceListItemDto)
  items!: CreatePriceListItemDto[];
}
