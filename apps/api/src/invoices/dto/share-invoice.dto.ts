import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ShareInvoiceDto {
  @IsString()
  @IsIn(['email', 'whatsapp', 'sms'])
  channel!: 'email' | 'whatsapp' | 'sms';

  @IsString()
  @MaxLength(255)
  recipient!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
