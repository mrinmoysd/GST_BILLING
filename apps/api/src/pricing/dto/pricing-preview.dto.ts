import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PricingPreviewLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantity!: string;
}

export class PricingPreviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customer_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  document_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document_type?: string;

  @ApiProperty({ type: [PricingPreviewLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingPreviewLineDto)
  items!: PricingPreviewLineDto[];
}
