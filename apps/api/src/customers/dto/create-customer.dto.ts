import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state_code?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  billing_address?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  shipping_address?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salesperson_user_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pricing_tier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimalStringSafe()
  credit_limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  credit_days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credit_control_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimalStringSafe()
  credit_warning_percent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimalStringSafe()
  credit_block_percent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  credit_hold?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credit_hold_reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  credit_override_until?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credit_override_reason?: string;
}
