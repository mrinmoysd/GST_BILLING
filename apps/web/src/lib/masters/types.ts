export type AddressValue = {
  line1?: string | null;
  line_1?: string | null;
  line2?: string | null;
  line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  postal_code?: string | null;
  country?: string | null;
  fullText?: string | null;
  full_text?: string | null;
};

export type CustomerSummary = {
  credit?: {
    current_exposure?: number;
    open_invoices_count?: number;
    overdue_invoices_count?: number;
    overdue_amount?: number;
    last_payment?: {
      id: string;
      payment_date?: string | null;
      amount?: number;
      method?: string | null;
      instrument_status?: string | null;
      invoice_id?: string | null;
      invoice_number?: string | null;
    } | null;
  };
  collections?: {
    owner?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string | null;
    } | null;
    open_tasks_count?: number;
    overdue_tasks_count?: number;
    next_action_date?: string | null;
    latest_open_task?: {
      id: string;
      status?: string | null;
      priority?: string | null;
      channel?: string | null;
      due_date?: string | null;
      next_action_date?: string | null;
      promise_to_pay_date?: string | null;
      promise_to_pay_amount?: number;
      notes?: string | null;
    } | null;
  };
  coverage?: {
    active_assignment?: {
      id: string;
      visit_frequency?: string | null;
      preferred_visit_day?: string | null;
      priority?: string | null;
      notes?: string | null;
      salesperson?: {
        id: string;
        name?: string | null;
        email?: string | null;
        role?: string | null;
      } | null;
      territory?: { id: string; code: string; name: string } | null;
      route?: { id: string; code: string; name: string } | null;
      beat?: {
        id: string;
        code: string;
        name: string;
        dayOfWeek?: string | null;
        day_of_week?: string | null;
      } | null;
    } | null;
    latest_visit?: {
      id: string;
      visit_date?: string | null;
      status?: string | null;
      primary_outcome?: string | null;
      productive_flag?: boolean;
      next_follow_up_date?: string | null;
    } | null;
    next_planned_visit?: {
      id: string;
      visit_date?: string | null;
      status?: string | null;
      priority?: string | null;
      route?: { id: string; code: string; name: string } | null;
      beat?: {
        id: string;
        code: string;
        name: string;
        dayOfWeek?: string | null;
        day_of_week?: string | null;
      } | null;
    } | null;
  };
  activity?: {
    recent_invoices?: Array<{
      id: string;
      invoice_number?: string | null;
      status?: string | null;
      issue_date?: string | null;
      due_date?: string | null;
      total?: number;
      balance_due?: number;
    }>;
    recent_payments?: Array<{
      id: string;
      payment_date?: string | null;
      amount?: number;
      method?: string | null;
      instrument_status?: string | null;
      invoice_id?: string | null;
      invoice_number?: string | null;
      reference?: string | null;
    }>;
  };
};

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin?: string | null;
  stateCode?: string | null;
  state_code?: string | null;
  billingAddress?: AddressValue | null;
  billing_address?: AddressValue | null;
  shippingAddress?: AddressValue | null;
  shipping_address?: AddressValue | null;
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
  summary?: CustomerSummary;
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
  unit?: string | null;
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
