import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminSubscriptionDto {
  @IsString()
  @IsIn([
    'cancel',
    'reactivate',
    'mark_past_due',
    'mark_active',
    'change_plan',
    'reconcile',
  ])
  action!:
    | 'cancel'
    | 'reactivate'
    | 'mark_past_due'
    | 'mark_active'
    | 'change_plan'
    | 'reconcile';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  plan_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
