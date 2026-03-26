import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class StockAdjustmentV2Dto {
  @ApiProperty({ description: 'Positive or negative adjustment quantity' })
  @IsNumber()
  @IsNotEmpty()
  change_qty!: number;

  @ApiPropertyOptional()
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
