import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class StockAdjustmentDto {
  @ApiPropertyOptional({ description: 'Legacy adjustment quantity field' })
  @IsNumber()
  @IsOptional()
  delta?: number;

  @ApiPropertyOptional({
    description: 'Positive or negative adjustment quantity',
  })
  @IsNumber()
  @IsOptional()
  change_qty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Optional document/source linkage' })
  @IsOptional()
  @IsString()
  source_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_id?: string;

  @ApiPropertyOptional({ description: 'Optional warehouse / godown context' })
  @IsOptional()
  @IsUUID()
  @Length(36, 36)
  warehouse_id?: string;
}
