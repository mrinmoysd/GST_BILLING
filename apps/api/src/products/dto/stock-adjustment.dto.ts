import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class StockAdjustmentDto {
  @ApiProperty({ description: 'Positive or negative adjustment quantity' })
  @IsNumber()
  @IsNotEmpty()
  delta!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
