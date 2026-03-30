export type SeatLimit = {
  included: number;
  max: number | null;
  extra_price_inr: number;
};

export type InvoiceLimit = {
  included_per_month: number | null;
  monthly_billing_value_inr: number | null;
  mode: "hard_block" | "wallet_overage" | "warn_only";
  overage_price_inr: number;
};

export type CompanyLimit = {
  included: number;
  max: number | null;
  extra_price_inr: number;
};

export type TrialPolicy = {
  enabled: boolean;
  days: number;
  require_payment_method_upfront: boolean;
  allow_full_access: boolean;
  allow_grace_period: boolean;
  block_on_expiry: boolean;
  status?: string;
  started_at?: string | null;
  ends_at?: string | null;
  days_remaining?: number;
};

export type StructuredPlanLimits = {
  full_seats: SeatLimit;
  view_only_seats: SeatLimit;
  invoices: InvoiceLimit;
  companies: CompanyLimit;
  features: Record<string, boolean>;
  enforcement: {
    allow_add_ons: boolean;
  };
  trial: TrialPolicy;
  overrides?: {
    extra_full_seats?: number;
    extra_view_only_seats?: number;
    invoice_uplift_per_month?: number;
    company_uplift?: number;
    enforcement_mode?: "hard_block" | "wallet_overage" | "warn_only" | null;
  };
};

export type StructuredSubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  price_inr: number;
  billing_interval: "month" | "year";
  is_active?: boolean;
  is_public?: boolean;
  display_order?: number;
  trial_days?: number;
  allow_add_ons?: boolean;
  limits: StructuredPlanLimits;
};

export type CommercialWarning = {
  code: string;
  category:
    | "trial"
    | "invoices"
    | "invoice_value"
    | "full_seats"
    | "view_only_seats"
    | "companies";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  used?: number;
  limit?: number | null;
  ratio_percent?: number | null;
  threshold_percent?: number | null;
};

export type CommercialWarningSummary = {
  highest_severity: "none" | "info" | "warning" | "critical";
  items: CommercialWarning[];
  counts: {
    info: number;
    warning: number;
    critical: number;
  };
};

export function formatCurrencyInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPlanPrice(plan: StructuredSubscriptionPlan) {
  return `${formatCurrencyInr(plan.price_inr)}/${plan.billing_interval}`;
}

export function seatSummary(limit: SeatLimit, tone: "full" | "view" = "full") {
  if (limit.included <= 0) {
    return tone === "full" ? "No full-right seats included" : "No view-only seats included";
  }

  const base =
    tone === "full"
      ? `${limit.included} full-right ${limit.included === 1 ? "seat" : "seats"}`
      : `${limit.included} view-only ${limit.included === 1 ? "seat" : "seats"}`;

  if (limit.max === null) return `${base} included`;
  if (limit.max === limit.included) return `${base} included`;
  return `${base} included, max ${limit.max}`;
}

export function companySummary(limit: CompanyLimit) {
  const base = `${limit.included} ${limit.included === 1 ? "company" : "companies"}`;
  if (limit.max === null) return `${base} included`;
  if (limit.max === limit.included) return `${base} included`;
  return `${base} included, max ${limit.max}`;
}

export function invoiceSummary(limit: InvoiceLimit) {
  if (limit.included_per_month === null) return "Unlimited invoices per month";
  return `${formatCompactNumber(limit.included_per_month)} invoices per month`;
}

export function invoiceValueSummary(limit: InvoiceLimit) {
  if (limit.monthly_billing_value_inr === null) return null;
  return `Billing value cap ${formatCurrencyInr(limit.monthly_billing_value_inr)} per month`;
}

export function overageSummary(limit: InvoiceLimit) {
  if (limit.mode !== "wallet_overage" || limit.overage_price_inr <= 0) return null;
  return `${formatCurrencyInr(limit.overage_price_inr)} per extra invoice via wallet`;
}

export function extraSeatSummary(limit: SeatLimit, label: "user" | "company") {
  if (limit.extra_price_inr <= 0) return null;
  return `${formatCurrencyInr(limit.extra_price_inr)} per extra ${label}`;
}

export function usageRatio(used: number, limit: number | null | undefined) {
  if (limit === null || limit === undefined || limit <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

export function asStructuredPlanLimits(value: unknown): StructuredPlanLimits | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as StructuredPlanLimits;
}
