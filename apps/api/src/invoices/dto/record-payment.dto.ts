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
  reference?: string;

  @IsOptional()
  @IsDateString()
  payment_date?: string;
}
