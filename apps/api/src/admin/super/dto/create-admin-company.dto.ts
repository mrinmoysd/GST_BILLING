import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export class CreateAdminCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  company_name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  owner_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(GSTIN_RE, { message: 'Invalid GSTIN format' })
  gstin?: string;

  @IsOptional()
  @IsString()
  @Matches(PAN_RE, { message: 'Invalid PAN format' })
  pan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  business_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  state_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  invoice_prefix?: string;

  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;
}
