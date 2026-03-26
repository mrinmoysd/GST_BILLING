import { IsOptional, IsString, Length } from 'class-validator';

export class ConvertDeliveryChallanToInvoiceDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  series_code?: string;
}
