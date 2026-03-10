import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const CHANNELS = ['email', 'whatsapp', 'sms', 'inapp'] as const;

export class CreateNotificationTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @IsString()
  @IsIn(CHANNELS)
  channel!: (typeof CHANNELS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string | null;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
