import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreateCollectionTaskDto {
  @IsUUID()
  customer_id!: string;

  @IsOptional()
  @IsUUID()
  invoice_id?: string;

  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;

  @IsOptional()
  @IsUUID()
  salesperson_user_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsDateString()
  next_action_date?: string;

  @IsOptional()
  @IsDateString()
  promise_to_pay_date?: string;

  @IsOptional()
  @IsDecimalStringSafe()
  promise_to_pay_amount?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
