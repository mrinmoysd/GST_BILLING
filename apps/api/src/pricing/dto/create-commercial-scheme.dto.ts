import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommercialSchemeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: ['percentage_discount', 'flat_discount_amount', 'free_quantity'],
  })
  @IsString()
  @IsNotEmpty()
  scheme_type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pricing_tier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  min_quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  min_amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  percent_discount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flat_discount_amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  free_quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_exclusive?: boolean;

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
}
