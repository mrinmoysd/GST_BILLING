import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

// Minimal validation for GSTIN and PAN. (We can harden later.)
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const BUSINESS_TYPES = [
  'retailer',
  'wholesaler',
  'service',
  'manufacturer',
  'other',
] as const;

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(GSTIN_RE, { message: 'Invalid GSTIN format' })
  gstin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(PAN_RE, { message: 'Invalid PAN format' })
  pan?: string;

  @IsOptional()
  @IsString()
  @IsIn(BUSINESS_TYPES as unknown as string[])
  business_type?: (typeof BUSINESS_TYPES)[number];

  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  state_code?: string;

  @IsOptional()
  @IsObject()
  contact?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  bank_details?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  invoice_settings?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
