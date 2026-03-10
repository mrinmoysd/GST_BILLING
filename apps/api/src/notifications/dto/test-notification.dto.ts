import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const CHANNELS = ['email', 'whatsapp', 'sms', 'inapp'] as const;

export class TestNotificationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  template_code!: string;

  @IsString()
  @IsIn(CHANNELS)
  channel!: (typeof CHANNELS)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(254)
  to_address!: string;

  @IsOptional()
  @IsObject()
  sample_payload?: Record<string, unknown>;
}
