import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportBankStatementDto {
  @IsUUID()
  bank_account_id!: string;

  @IsOptional()
  @IsString()
  source_filename?: string;

  @IsString()
  csv_content!: string;
}
