import { IsOptional, IsString } from 'class-validator';

export class IssueInvoiceDto {
  @IsOptional()
  @IsString()
  series_code?: string;
}
