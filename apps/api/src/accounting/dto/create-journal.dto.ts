import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDecimalStringSafe } from '../../common/validation/is-decimal-string-safe';

export class CreateJournalLineDto {
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  debit_ledger_id?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  credit_ledger_id?: string;

  @ApiProperty({ example: '100.00', description: 'Amount as decimal string' })
  @IsNotEmpty()
  @IsDecimalStringSafe()
  amount!: string;
}

export class CreateJournalDto {
  @ApiProperty({ example: '2026-03-06', format: 'date' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({ example: 'Being invoice issued' })
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiProperty({ type: [CreateJournalLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines!: CreateJournalLineDto[];
}
