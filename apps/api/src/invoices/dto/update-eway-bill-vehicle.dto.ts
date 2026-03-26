import { IsDateString, IsInt, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class UpdateEWayBillVehicleDto {
  @IsString()
  @Length(1, 64)
  vehicle_number!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  transporter_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  transport_mode?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  distance_km?: number;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  transport_document_number?: string;

  @IsOptional()
  @IsDateString()
  transport_document_date?: string;
}
