import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePeriodLockDto {
  @ApiPropertyOptional({ example: '2026-03-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  lock_until?: string | null;

  @ApiPropertyOptional({ example: 'March books closed' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string | null;
}
