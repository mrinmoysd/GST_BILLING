import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const PROVIDERS = ['stripe', 'razorpay'] as const;

export class CheckoutDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  plan_code?: string;

  @IsString()
  @IsIn(PROVIDERS)
  provider!: (typeof PROVIDERS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  success_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancel_url?: string;
}
