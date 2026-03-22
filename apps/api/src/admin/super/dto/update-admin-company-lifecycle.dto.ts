import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminCompanyLifecycleDto {
  @IsString()
  @IsIn(['suspend', 'reactivate'])
  action!: 'suspend' | 'reactivate';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
