import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const FILE_TYPES = [
  'company_logo',
  'invoice_pdf',
  'purchase_bill',
  'export',
  'attachment',
] as const;

export class SignUploadDto {
  @IsString()
  @IsIn(FILE_TYPES)
  type!: (typeof FILE_TYPES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  mime_type?: string;

  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024)
  size_bytes!: number;
}
