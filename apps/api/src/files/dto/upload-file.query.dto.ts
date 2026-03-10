import { IsString, MinLength } from 'class-validator';

export class UploadFileQueryDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
