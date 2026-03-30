import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateAdminSubscriptionDto {
  @IsString()
  @IsIn([
    'cancel',
    'reactivate',
    'mark_past_due',
    'mark_active',
    'change_plan',
    'reconcile',
    'extend_trial',
    'end_trial',
  ])
  action!:
    | 'cancel'
    | 'reactivate'
    | 'mark_past_due'
    | 'mark_active'
    | 'change_plan'
    | 'reconcile'
    | 'extend_trial'
    | 'end_trial';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  plan_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trial_days?: number;
}
