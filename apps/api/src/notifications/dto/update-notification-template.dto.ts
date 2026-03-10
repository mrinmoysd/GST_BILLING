import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateNotificationTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
