import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  nickname!: string;

  @IsString()
  bank_name!: string;

  @IsOptional()
  @IsString()
  branch_name?: string;

  @IsOptional()
  @IsString()
  account_holder_name?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @IsOptional()
  @IsString()
  upi_handle?: string;

  @IsOptional()
  @IsUUID()
  ledger_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
