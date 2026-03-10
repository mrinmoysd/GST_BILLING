import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInvoiceSeriesDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

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
