import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateInvoiceSeriesDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  prefix?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  next_number?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
