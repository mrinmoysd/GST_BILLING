import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAdminSubscriptionOverridesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_full_seats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_view_only_seats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  invoice_uplift_per_month?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  company_uplift?: number;

  @IsOptional()
  @IsString()
  @IsIn(['hard_block', 'wallet_overage', 'warn_only'])
  enforcement_mode?: 'hard_block' | 'wallet_overage' | 'warn_only';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
