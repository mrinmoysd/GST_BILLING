import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Canonical taxonomy for a retail accounting Chart of Accounts.
// Top-level: asset, liability, equity, income, expense
// Subtypes allowed for better reporting.
const LEDGER_TYPES = [
  // Top-level
  'asset',
  'liability',
  'equity',
  'income',
  'expense',

  // Asset subtypes
  'current_asset',
  'fixed_asset',
  'inventory',
  'accounts_receivable',
  'cash',
  'bank',
  'prepaid_expense',

  // Liability subtypes
  'current_liability',
  'long_term_liability',
  'accounts_payable',
  'tax_payable',
  'loan',

  // Equity subtypes
  'owner_equity',
  'retained_earnings',
  'capital',
  'drawings',

  // Income subtypes
  'sales',
  'service_income',
  'other_income',
  'discount_received',
  'interest_income',

  // Expense subtypes
  'cost_of_goods_sold',
  'operating_expense',
  'salary',
  'rent',
  'utilities',
  'marketing',
  'purchase',
  'discount_given',
  'tax_expense',
] as const;

export type LedgerType = (typeof LEDGER_TYPES)[number];

export class CreateLedgerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  account_code!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  account_name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(32)
  @IsIn(LEDGER_TYPES as unknown as string[])
  type!: LedgerType;
}
