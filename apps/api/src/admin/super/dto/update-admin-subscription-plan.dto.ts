import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAdminSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_inr?: number;

  @IsOptional()
  @IsString()
  @IsIn(['month', 'year'])
  billing_interval?: 'month' | 'year';

  @IsOptional()
  @IsObject()
  limits?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trial_days?: number;

  @IsOptional()
  @IsBoolean()
  allow_add_ons?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
