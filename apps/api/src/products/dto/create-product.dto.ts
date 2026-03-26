import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsn?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Unit price as string/number (Decimal)' })
  @IsOptional()
  @ValidateIf((o) => o.price !== undefined)
  price?: string | number;

  @ApiPropertyOptional({ description: 'Unit cost as string/number (Decimal)' })
  @IsOptional()
  @ValidateIf((o) => o.costPrice !== undefined)
  costPrice?: string | number;

  @ApiPropertyOptional({ description: 'GST rate percent' })
  @IsOptional()
  @IsNumber()
  gstRate?: number;

  @ApiPropertyOptional({ description: 'Legacy/UI alias for GST rate percent' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Reorder level threshold' })
  @IsOptional()
  @ValidateIf((o) => o.reorderLevel !== undefined)
  reorderLevel?: string | number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  batchTrackingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  batch_tracking_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  expiryTrackingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  expiry_tracking_enabled?: boolean;

  @ApiPropertyOptional({ enum: ['NONE', 'FIFO', 'FEFO'] })
  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'FIFO', 'FEFO'])
  batchIssuePolicy?: 'NONE' | 'FIFO' | 'FEFO';

  @ApiPropertyOptional({ enum: ['NONE', 'FIFO', 'FEFO'] })
  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'FIFO', 'FEFO'])
  batch_issue_policy?: 'NONE' | 'FIFO' | 'FEFO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nearExpiryDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  near_expiry_days?: number;
}
