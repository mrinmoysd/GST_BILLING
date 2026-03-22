import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateGstExportDto {
  @IsString()
  @IsIn(['gstr1', 'gstr3b', 'hsn', 'itc'])
  report!: 'gstr1' | 'gstr3b' | 'hsn' | 'itc';

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  @IsIn(['json', 'csv', 'excel'])
  format?: 'json' | 'csv' | 'excel';
}
