import { IsOptional, IsString } from 'class-validator';

export class TransitionDeliveryChallanDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  dispatch_notes?: string;

  @IsOptional()
  @IsString()
  delivery_notes?: string;
}
