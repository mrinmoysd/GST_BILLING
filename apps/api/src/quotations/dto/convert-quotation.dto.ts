import { IsOptional, IsString, Length } from 'class-validator';

export class ConvertQuotationToInvoiceDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  series_code?: string;
}
