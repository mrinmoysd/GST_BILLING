import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateCreditNoteItemDto {
  @IsOptional()
  @IsString()
  invoice_item_id?: string;

  @IsString()
  product_id!: string;

  @IsString()
  quantity!: string;
}

export class CreateCreditNoteDto {
  @IsOptional()
  @IsString()
  note_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  restock?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['credit_note', 'sales_return'])
  kind?: 'credit_note' | 'sales_return';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCreditNoteItemDto)
  items!: CreateCreditNoteItemDto[];
}
