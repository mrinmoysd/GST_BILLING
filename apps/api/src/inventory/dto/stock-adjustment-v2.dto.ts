import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
}
