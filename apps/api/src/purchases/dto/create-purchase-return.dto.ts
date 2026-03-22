import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreatePurchaseReturnItemDto {
  @IsOptional()
  @IsString()
  purchase_item_id?: string;

  @IsString()
  product_id!: string;

  @IsString()
  quantity!: string;
}

export class CreatePurchaseReturnDto {
  @IsOptional()
  @IsString()
  return_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items!: CreatePurchaseReturnItemDto[];
}
