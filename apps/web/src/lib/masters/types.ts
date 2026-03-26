export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pricingTier?: string | null;
  pricing_tier?: string | null;
  salespersonUserId?: string | null;
  salesperson_user_id?: string | null;
  salesperson?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  creditLimit?: string | number | null;
  credit_limit?: string | number | null;
  creditDays?: number | null;
  credit_days?: number | null;
  creditControlMode?: string | null;
  credit_control_mode?: string | null;
  creditWarningPercent?: string | number | null;
  credit_warning_percent?: string | number | null;
  creditBlockPercent?: string | number | null;
  credit_block_percent?: string | number | null;
  creditHold?: boolean;
  credit_hold?: boolean;
  creditHoldReason?: string | null;
  credit_hold_reason?: string | null;
  creditOverrideUntil?: string | null;
  credit_override_until?: string | null;
  creditOverrideReason?: string | null;
  credit_override_reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  hsn: string | null;
  categoryId?: string | null;
  price?: string | number | null;
  costPrice?: string | number | null;
  taxRate?: string | number | null;
  stock?: string | number;
  reorderLevel?: string | number | null;
  batchTrackingEnabled?: boolean;
  batch_tracking_enabled?: boolean;
  expiryTrackingEnabled?: boolean;
  expiry_tracking_enabled?: boolean;
  batchIssuePolicy?: "NONE" | "FIFO" | "FEFO" | string | null;
  batch_issue_policy?: "NONE" | "FIFO" | "FEFO" | string | null;
  nearExpiryDays?: number | null;
  near_expiry_days?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number };
};
