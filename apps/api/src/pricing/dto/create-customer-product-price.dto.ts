import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerProductPriceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customer_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fixed_price?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discount_percent?: string;

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
