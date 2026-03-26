import { IsOptional, IsString, Length } from 'class-validator';

export class CancelComplianceDocumentDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  reason?: string;
}
