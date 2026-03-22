import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PatchUserDto {
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
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  primary_role?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  role_ids?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
