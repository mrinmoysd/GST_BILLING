import { IsOptional, IsString } from 'class-validator';

export class IssueInvoiceDto {
  @IsOptional()
  @IsString()
  series_code?: string;

  @IsOptional()
  @IsString()
  credit_override_reason?: string;
}
