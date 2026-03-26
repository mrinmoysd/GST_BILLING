import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class RecordPaymentDto {
  @IsOptional()
  @IsUUID()
  invoice_id?: string;

  @IsOptional()
  @IsUUID()
  purchase_id?: string;

  @IsDecimalStringSafe()
  amount!: string;

  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  instrument_type?: string;

  @IsOptional()
  @IsUUID()
  bank_account_id?: string;

  @IsOptional()
  @IsString()
  instrument_number?: string;

  @IsOptional()
  @IsDateString()
  instrument_date?: string;

  @IsOptional()
  @IsDateString()
  deposit_date?: string;

  @IsOptional()
  @IsDateString()
  clearance_date?: string;

  @IsOptional()
  @IsDateString()
  bounce_date?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  payment_date?: string;
}
