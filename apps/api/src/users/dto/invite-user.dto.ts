import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  role?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  // Dev-mode only: allow providing a known password.
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  temp_password?: string;
}
