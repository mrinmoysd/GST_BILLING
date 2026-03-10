import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class PatchPurchaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Purchase date (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  purchase_date?: string;
}
