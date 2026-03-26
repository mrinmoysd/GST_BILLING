import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePaymentInstrumentDto {
  @IsOptional()
  @IsString()
  instrument_status?: string;

  @IsOptional()
  @IsUUID()
  bank_account_id?: string | null;

  @IsOptional()
  @IsString()
  instrument_number?: string | null;

  @IsOptional()
  @IsDateString()
  instrument_date?: string | null;

  @IsOptional()
  @IsDateString()
  deposit_date?: string | null;

  @IsOptional()
  @IsDateString()
  clearance_date?: string | null;

  @IsOptional()
  @IsDateString()
  bounce_date?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
