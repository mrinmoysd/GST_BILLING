import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IsDecimalStringSafe } from '../common/validation/is-decimal-string-safe';

export class CreateSalesTerritoryDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  manager_user_id?: string;
}

export class UpdateSalesTerritoryDto extends PartialType(CreateSalesTerritoryDto) {}

export class CreateSalesRouteDto {
  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  default_warehouse_id?: string;

  @IsOptional()
  @IsUUID()
  manager_user_id?: string;
}

export class UpdateSalesRouteDto extends PartialType(CreateSalesRouteDto) {}

export class CreateSalesBeatDto {
  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @IsUUID()
  route_id!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  day_of_week?: string;

  @IsOptional()
  @IsInt()
  sequence_no?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateSalesBeatDto extends PartialType(CreateSalesBeatDto) {}

export class AssignCustomerCoverageDto {
  @IsUUID()
  salesperson_user_id!: string;

  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsUUID()
  beat_id?: string;

  @IsOptional()
  @IsString()
  visit_frequency?: string;

  @IsOptional()
  @IsString()
  preferred_visit_day?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerCoverageDto extends PartialType(AssignCustomerCoverageDto) {}

export class CreateSalespersonRouteAssignmentDto {
  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsUUID()
  beat_id?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

export class GenerateVisitPlansDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  salesperson_user_ids?: string[];

  @IsOptional()
  @IsIn(['replace_all', 'replace_missing_only', 'carry_forward_only'])
  mode?: 'replace_all' | 'replace_missing_only' | 'carry_forward_only';
}

export class CreateVisitPlanDto {
  @IsDateString()
  date!: string;

  @IsUUID()
  salesperson_user_id!: string;

  @IsUUID()
  customer_id!: string;

  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsUUID()
  beat_id?: string;

  @IsOptional()
  @IsString()
  plan_source?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsInt()
  sequence_no?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVisitPlanDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsInt()
  sequence_no?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateVisitDto {
  @IsOptional()
  @IsUUID()
  visit_plan_id?: string;

  @IsOptional()
  @IsUUID()
  salesperson_user_id?: string;

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsDateString()
  visit_date?: string;

  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsUUID()
  beat_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VisitCheckInDto {
  @IsOptional()
  @IsDateString()
  captured_at?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class VisitCheckOutDto extends VisitCheckInDto {}

export class UpdateVisitDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  primary_outcome?: string;

  @IsOptional()
  @IsBoolean()
  productive_flag?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  next_follow_up_date?: string;
}

export class CreateVisitOutcomeDto {
  @IsString()
  outcome_type!: string;

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @IsOptional()
  @IsDecimalStringSafe()
  amount?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateFieldSalesLineDto {
  @IsUUID()
  product_id!: string;

  @IsDecimalStringSafe()
  quantity!: string;

  @IsDecimalStringSafe()
  unit_price!: string;

  @IsOptional()
  @IsDecimalStringSafe()
  discount?: string;

  @IsOptional()
  @IsString()
  override_reason?: string;
}

export class CreateFieldSalesOrderDto {
  @IsOptional()
  @IsDateString()
  expected_dispatch_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldSalesLineDto)
  lines!: CreateFieldSalesLineDto[];
}

export class CreateFieldQuotationDto {
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldSalesLineDto)
  lines!: CreateFieldSalesLineDto[];
}

export class CreateCollectionUpdateDto {
  @IsOptional()
  @IsUUID()
  invoice_id?: string;

  @IsOptional()
  @IsDecimalStringSafe()
  outstanding_amount_seen?: string;

  @IsOptional()
  @IsDecimalStringSafe()
  promised_amount?: string;

  @IsOptional()
  @IsDateString()
  promised_date?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class SubmitDcrDto {
  @IsDateString()
  report_date!: string;

  @IsOptional()
  @IsUUID()
  salesperson_user_id?: string;

  @IsOptional()
  @IsString()
  closing_notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: string[];
}

export class ReviewDcrDto {
  @IsOptional()
  @IsString()
  review_notes?: string;
}
