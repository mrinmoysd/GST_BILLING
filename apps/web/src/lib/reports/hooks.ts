import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type SalesSummaryReport = {
  gross_sales: number;
  net_sales: number;
  tax_total: number;
  invoices_count: number;
  average_invoice: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
};

export type ReportSeriesGrain = "day" | "week" | "month";

export type SalesSummarySeriesPoint = {
  period: string;
  period_start: string;
  period_end: string;
  gross_sales: number;
  net_sales: number;
  tax_total: number;
  amount_paid: number;
  balance_due: number;
  invoices_count: number;
  average_invoice: number;
};

export type PurchasesSummaryReport = {
  gross_purchases: number;
  net_purchases: number;
  tax_total: number;
  purchases_count: number;
  average_purchase: number;
  currency: string;
};

export type PurchasesSummarySeriesPoint = {
  period: string;
  period_start: string;
  period_end: string;
  gross_purchases: number;
  net_purchases: number;
  tax_total: number;
  purchases_count: number;
  average_purchase: number;
};

export type OutstandingInvoiceRow = {
  invoice_id: string;
  invoice_number?: string | null;
  customer_id: string;
  customer_name: string;
  issue_date?: string | null;
  due_date?: string | null;
  total: number;
  amount_paid: number;
  amount_due: number;
  overdue_days: number;
  status: string;
};

export type TopProductRow = {
  product_id: string;
  name: string;
  sku?: string | null;
  hsn?: string | null;
  quantity: number;
  amount: number;
};

export type ProfitSnapshotReport = {
  revenue: number;
  cogs: number;
  gross_profit: number;
  net_profit: number;
  currency: string;
  is_estimate?: boolean;
  note?: string;
};

export type ProfitSnapshotSeriesPoint = {
  period: string;
  period_start: string;
  period_end: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  net_profit: number;
  gross_margin_percent: number;
  net_margin_percent: number;
  is_estimate: boolean;
};

export type SalespersonSalesRow = {
  salesperson_user_id: string | null;
  salesperson_name: string;
  salesperson_email?: string | null;
  invoices_count: number;
  gross_sales: number;
  amount_paid: number;
  amount_due: number;
};

export type SalespersonCollectionsRow = {
  salesperson_user_id: string | null;
  salesperson_name: string;
  salesperson_email?: string | null;
  payments_count: number;
  collections_amount: number;
};

export type SalespersonOutstandingRow = {
  salesperson_user_id: string | null;
  salesperson_name: string;
  salesperson_email?: string | null;
  invoices_count: number;
  outstanding_amount: number;
};

export type CustomerOutstandingRow = {
  customer_id: string;
  customer_name: string;
  salesperson_user_id?: string | null;
  salesperson_name: string;
  salesperson_email?: string | null;
  invoices_count: number;
  outstanding_amount: number;
  oldest_due_date?: string | null;
};

export type WarehouseStockRow = {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  is_default: boolean;
  sku_count: number;
  total_quantity: number;
  stock_value: number;
  low_stock_lines: number;
};

export type ProductMovementRow = {
  product_id: string;
  product_name: string;
  sku?: string | null;
  sold_quantity: number;
  sales_amount: number;
  current_stock: number;
};

export type DistributorDashboardReport = {
  totals: {
    gross_sales: number;
    collections: number;
    outstanding: number;
    stock_value: number;
  };
  top_salespeople: SalespersonSalesRow[];
  top_collectors: SalespersonCollectionsRow[];
  top_due_customers: CustomerOutstandingRow[];
  warehouse_snapshot: WarehouseStockRow[];
  fast_moving: ProductMovementRow[];
  slow_moving: ProductMovementRow[];
};

export type DispatchOperationsRow = {
  sales_order_id?: string;
  order_number?: string | null;
  pending_dispatch_quantity?: number;
  challans_count?: number;
  latest_challan_status?: string | null;
  open_challans?: number;
  status?: string | null;
  expected_dispatch_date?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
  };
};

export type DispatchOperationsChallanRow = {
  id: string;
  challan_number?: string | null;
  status?: string | null;
  challan_date?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  requested_quantity: number;
  dispatched_quantity: number;
  delivered_quantity: number;
  short_supply_quantity: number;
  transporter_name?: string | null;
  vehicle_number?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
  };
  warehouse?: {
    id: string;
    name?: string | null;
    code?: string | null;
  };
  sales_order?: {
    id: string;
    orderNumber?: string | null;
    status?: string | null;
  };
  invoice?: {
    id: string;
    invoiceNumber?: string | null;
    status?: string | null;
  } | null;
};

export type DispatchOperationsReport = {
  totals: {
    pending_dispatch_orders: number;
    pending_dispatch_quantity: number;
    partial_orders: number;
    open_challans: number;
    dispatched_not_delivered: number;
    delivered_not_invoiced: number;
  };
  pending_dispatch: DispatchOperationsRow[];
  partial_orders: DispatchOperationsRow[];
  dispatched_not_delivered: DispatchOperationsChallanRow[];
  delivered_not_invoiced: DispatchOperationsChallanRow[];
};

export type RouteCoverageRow = {
  route_id: string | null;
  route_code?: string | null;
  route_name: string;
  planned_visits: number;
  completed_visits: number;
  missed_visits: number;
  productive_visits: number;
  completion_percent: number;
};

export type RepVisitProductivityRow = {
  salesperson_user_id: string | null;
  salesperson_name: string;
  salesperson_email?: string | null;
  visits_count: number;
  productive_visits: number;
  non_productive_visits: number;
  orders_booked: number;
  order_value: number;
  promise_to_pay_count: number;
};

export type MissedVisitRow = {
  visit_plan_id: string;
  customer?: { id: string; name: string; phone?: string | null };
  salesperson?: { id: string; name?: string | null; email?: string | null } | null;
  route?: { id: string; code: string; name: string } | null;
  beat?: { id: string; code: string; name: string; dayOfWeek?: string | null; day_of_week?: string | null } | null;
  notes?: string | null;
  next_follow_up_date?: string | null;
};

export type RouteOutstandingRow = {
  route_id: string | null;
  route_code?: string | null;
  route_name: string;
  outstanding_amount: number;
  invoices_count: number;
};

export type DcrRegisterRow = {
  id: string;
  report_date: string;
  status: string;
  salesperson?: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
  planned_visits_count: number;
  completed_visits_count: number;
  missed_visits_count: number;
  productive_visits_count: number;
  sales_orders_count: number;
  sales_order_value: number;
  collection_updates_count: number;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: { id: string; name?: string | null; email?: string | null } | null;
};

export type CommercialAuditSeriesPoint = {
  period: string;
  period_start: string;
  period_end: string;
  total_events: number;
  manual_override_events: number;
  warning_events: number;
  customer_override_events: number;
  price_list_events: number;
  product_price_events: number;
  unique_documents: number;
};

export type SchemeUsageRow = {
  scheme_code: string;
  scheme_name: string;
  scheme_type: string;
  line_count: number;
  discount_amount: number;
  free_quantity: number;
};

export type DiscountLeakageReport = {
  totals: {
    resolved_discount: number;
    entered_discount: number;
    manual_discount: number;
    override_lines: number;
  };
  top_override_products: Array<{
    product_id: string;
    product_name: string;
    sku?: string | null;
    manual_discount: number;
    overrides: number;
  }>;
};

export type PriceCoverageReport = {
  total_products: number;
  products_with_price_lists: number;
  price_list_coverage_percent: number;
  customer_special_rates: number;
  active_schemes: number;
};

export type CommercialAuditReportRow = {
  id: string;
  document_type: string;
  document_id: string;
  action: string;
  pricing_source?: string | null;
  override_reason?: string | null;
  created_at: string;
  actor?: { id?: string; name?: string | null; email?: string | null } | null;
  customer?: { id: string; name: string } | null;
  product?: { id: string; name: string; sku?: string | null } | null;
  warnings?: unknown;
  snapshot?: Record<string, unknown> | null;
};

export type ReceivableAgingRow = {
  customer_id: string;
  customer_name: string;
  current: number;
  bucket_1_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_due: number;
  invoices_count: number;
  credit_limit: number;
  credit_hold: boolean;
};

export type PayableAgingRow = {
  supplier_id: string;
  supplier_name: string;
  current: number;
  bucket_1_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_due: number;
  purchases_count: number;
};

export type CreditControlDashboardReport = {
  totals: {
    total_due: number;
    overdue_90_plus: number;
    open_collection_tasks: number;
    pending_instruments: number;
    bounced_instruments: number;
    unmatched_bank_lines: number;
  };
  high_risk_customers: Array<ReceivableAgingRow & { exposure_percent: number }>;
};

export type BankingReconciliationSummaryReport = {
  matched_lines: number;
  unmatched_lines: number;
  unreconciled_payments: number;
  pending_instruments: number;
  bounced_instruments: number;
};

export function useSalesSummary(args: { companyId: string; from?: string; to?: string; enabled?: boolean }) {
  const { companyId, from, to, enabled = true } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "sales", "summary", { from, to }],
    queryFn: async () =>
      apiClient.get<SalesSummaryReport>(companyPath(companyId, `/reports/sales/summary?${qs.toString()}`)),
  });
}

export function useSalesSummarySeries(args: {
  companyId: string;
  from?: string;
  to?: string;
  grain?: ReportSeriesGrain;
  enabled?: boolean;
}) {
  const { companyId, from, to, grain = "day", enabled = true } = args;
  const qs = new URLSearchParams();
  qs.set("grain", grain);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "sales", "summary-series", { from, to, grain }],
    queryFn: async () =>
      apiClient.get<{
        data: SalesSummarySeriesPoint[];
        meta: { from?: string | null; to?: string | null; grain: ReportSeriesGrain; currency: string };
      }>(companyPath(companyId, `/reports/sales/summary-series?${qs.toString()}`)),
  });
}

export function usePurchasesSummary(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "purchases", "summary", { from, to }],
    queryFn: async () =>
      apiClient.get<PurchasesSummaryReport>(companyPath(companyId, `/reports/purchases/summary?${qs.toString()}`)),
  });
}

export function usePurchasesSummarySeries(args: {
  companyId: string;
  from?: string;
  to?: string;
  grain?: ReportSeriesGrain;
  enabled?: boolean;
}) {
  const { companyId, from, to, grain = "day", enabled = true } = args;
  const qs = new URLSearchParams();
  qs.set("grain", grain);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "purchases", "summary-series", { from, to, grain }],
    queryFn: async () =>
      apiClient.get<{
        data: PurchasesSummarySeriesPoint[];
        meta: { from?: string | null; to?: string | null; grain: ReportSeriesGrain; currency: string };
      }>(companyPath(companyId, `/reports/purchases/summary-series?${qs.toString()}`)),
  });
}

export function useOutstandingInvoices(args: { companyId: string; q?: string; page?: number; limit?: number; enabled?: boolean }) {
  const { companyId, q, page = 1, limit = 20, enabled = true } = args;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "sales", "outstanding", { q, page, limit }],
    queryFn: async () =>
      apiClient.get<{ data: OutstandingInvoiceRow[]; meta: { page: number; limit: number; total: number } }>(
        companyPath(companyId, `/reports/sales/outstanding?${qs.toString()}`),
      ),
  });
}

export function useTopProducts(args: { companyId: string; from?: string; to?: string; limit?: number; sort_by?: "amount" | "quantity" }) {
  const { companyId, from, to, limit = 10, sort_by } = args;
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (sort_by) qs.set("sort_by", sort_by);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "sales", "top-products", { from, to, limit, sort_by }],
    queryFn: async () =>
      apiClient.get<{ data: TopProductRow[]; meta: { limit: number; sort_by: "amount" | "quantity" } }>(
        companyPath(companyId, `/reports/sales/top-products?${qs.toString()}`),
      ),
  });
}

export function useProfitSnapshot(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "profit", "snapshot", { from, to }],
    queryFn: async () =>
      apiClient.get<ProfitSnapshotReport>(companyPath(companyId, `/reports/profit/snapshot?${qs.toString()}`)),
  });
}

export function useProfitSnapshotSeries(args: {
  companyId: string;
  from?: string;
  to?: string;
  grain?: ReportSeriesGrain;
  enabled?: boolean;
}) {
  const { companyId, from, to, grain = "day", enabled = true } = args;
  const qs = new URLSearchParams();
  qs.set("grain", grain);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "profit", "snapshot-series", { from, to, grain }],
    queryFn: async () =>
      apiClient.get<{
        data: ProfitSnapshotSeriesPoint[];
        meta: {
          from?: string | null;
          to?: string | null;
          grain: ReportSeriesGrain;
          currency: string;
          is_estimate: boolean;
          note?: string;
        };
      }>(companyPath(companyId, `/reports/profit/snapshot-series?${qs.toString()}`)),
  });
}

export function useReceivableAging(args: { companyId: string; as_of?: string }) {
  const { companyId, as_of } = args;
  const qs = new URLSearchParams();
  if (as_of) qs.set("as_of", as_of);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "receivables", "aging", { as_of }],
    queryFn: async () =>
      apiClient.get<{
        data: ReceivableAgingRow[];
        meta: {
          as_of: string;
          totals: {
            current: number;
            bucket_1_30: number;
            bucket_31_60: number;
            bucket_61_90: number;
            bucket_90_plus: number;
            total_due: number;
          };
        };
      }>(companyPath(companyId, `/reports/receivables/aging?${qs.toString()}`)),
  });
}

export function usePayableAging(args: { companyId: string; as_of?: string }) {
  const { companyId, as_of } = args;
  const qs = new URLSearchParams();
  if (as_of) qs.set("as_of", as_of);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "payables", "aging", { as_of }],
    queryFn: async () =>
      apiClient.get<{
        data: PayableAgingRow[];
        meta: { as_of: string; totals: { total_due: number } };
      }>(companyPath(companyId, `/reports/payables/aging?${qs.toString()}`)),
  });
}

export function useCreditControlDashboard(args: { companyId: string; as_of?: string }) {
  const { companyId, as_of } = args;
  const qs = new URLSearchParams();
  if (as_of) qs.set("as_of", as_of);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "credit-control", "dashboard", { as_of }],
    queryFn: async () =>
      apiClient.get<{ data: CreditControlDashboardReport; meta: { as_of: string; currency: string } }>(
        companyPath(companyId, `/reports/credit-control/dashboard?${qs.toString()}`),
      ),
  });
}

export function useBankingReconciliationSummary(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "reports", "banking", "reconciliation-summary"],
    queryFn: async () =>
      apiClient.get<BankingReconciliationSummaryReport>(
        companyPath(companyId, "/reports/banking/reconciliation-summary"),
      ),
  });
}

export function useSalesBySalesperson(args: {
  companyId: string;
  from?: string;
  to?: string;
}) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "sales-by-salesperson", { from, to }],
    queryFn: async () =>
      apiClient.get<{ data: SalespersonSalesRow[]; meta: { from?: string | null; to?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/sales-by-salesperson?${qs.toString()}`),
      ),
  });
}

export function useCollectionsBySalesperson(args: {
  companyId: string;
  from?: string;
  to?: string;
}) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "collections-by-salesperson", { from, to }],
    queryFn: async () =>
      apiClient.get<{ data: SalespersonCollectionsRow[]; meta: { from?: string | null; to?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/collections-by-salesperson?${qs.toString()}`),
      ),
  });
}

export function useOutstandingBySalesperson(args: {
  companyId: string;
  asOf?: string;
}) {
  const { companyId, asOf } = args;
  const qs = new URLSearchParams();
  if (asOf) qs.set("as_of", asOf);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "outstanding-by-salesperson", { asOf }],
    queryFn: async () =>
      apiClient.get<{ data: SalespersonOutstandingRow[]; meta: { as_of?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/outstanding-by-salesperson?${qs.toString()}`),
      ),
  });
}

export function useOutstandingByCustomer(args: {
  companyId: string;
  asOf?: string;
}) {
  const { companyId, asOf } = args;
  const qs = new URLSearchParams();
  if (asOf) qs.set("as_of", asOf);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "outstanding-by-customer", { asOf }],
    queryFn: async () =>
      apiClient.get<{ data: CustomerOutstandingRow[]; meta: { as_of?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/outstanding-by-customer?${qs.toString()}`),
      ),
  });
}

export function useSchemeUsage(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "commercial", "scheme-usage", { from, to }],
    queryFn: async () =>
      apiClient.get<{ data: SchemeUsageRow[]; meta: { from?: string | null; to?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/commercial/scheme-usage?${qs.toString()}`),
      ),
  });
}

export function useDiscountLeakage(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "commercial", "discount-leakage", { from, to }],
    queryFn: async () =>
      apiClient.get<{ data: DiscountLeakageReport; meta: { from?: string | null; to?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/commercial/discount-leakage?${qs.toString()}`),
      ),
  });
}

export function usePriceCoverage(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "commercial", "price-coverage"],
    queryFn: async () =>
      apiClient.get<PriceCoverageReport>(companyPath(companyId, `/reports/distributor/commercial/price-coverage`)),
  });
}

export function useCommercialAuditReport(args: { companyId: string; limit?: number }) {
  const { companyId, limit = 50 } = args;
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "commercial", "audit", { limit }],
    queryFn: async () =>
      apiClient.get<{ data: CommercialAuditReportRow[]; meta: { limit: number } }>(
        companyPath(companyId, `/reports/distributor/commercial/audit?${qs.toString()}`),
      ),
  });
}

export function useCommercialAuditSeries(args: {
  companyId: string;
  from?: string;
  to?: string;
  grain?: ReportSeriesGrain;
  enabled?: boolean;
}) {
  const { companyId, from, to, grain = "day", enabled = true } = args;
  const qs = new URLSearchParams();
  qs.set("grain", grain);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "distributor", "commercial", "audit-series", { from, to, grain }],
    queryFn: async () =>
      apiClient.get<{
        data: CommercialAuditSeriesPoint[];
        meta: { from?: string | null; to?: string | null; grain: ReportSeriesGrain };
      }>(companyPath(companyId, `/reports/distributor/commercial/audit-series?${qs.toString()}`)),
  });
}

export function useStockByWarehouse(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "stock-by-warehouse"],
    queryFn: async () =>
      apiClient.get<{ data: WarehouseStockRow[]; meta: { currency: string } }>(
        companyPath(companyId, "/reports/distributor/stock-by-warehouse"),
      ),
  });
}

export function useProductMovement(args: {
  companyId: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const { companyId, from, to, limit = 10 } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  qs.set("limit", String(limit));
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "product-movement", { from, to, limit }],
    queryFn: async () =>
      apiClient.get<{ data: { fast_moving: ProductMovementRow[]; slow_moving: ProductMovementRow[] }; meta: { from?: string | null; to?: string | null; limit: number; currency: string } }>(
        companyPath(companyId, `/reports/distributor/product-movement?${qs.toString()}`),
      ),
  });
}

export function useDistributorDashboard(args: {
  companyId: string;
  from?: string;
  to?: string;
  asOf?: string;
  enabled?: boolean;
}) {
  const { companyId, from, to, asOf, enabled = true } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (asOf) qs.set("as_of", asOf);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "reports", "distributor", "dashboard", { from, to, asOf }],
    queryFn: async () =>
      apiClient.get<DistributorDashboardReport>(
        companyPath(companyId, `/reports/distributor/dashboard?${qs.toString()}`),
      ),
  });
}

export function useDispatchOperationsReport(args: {
  companyId: string;
  q?: string;
  warehouse_id?: string;
}) {
  const { companyId, q, warehouse_id } = args;
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (warehouse_id) qs.set("warehouse_id", warehouse_id);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "dispatch-operations", { q, warehouse_id }],
    queryFn: async () =>
      apiClient.get<{ data: DispatchOperationsReport; meta: { warehouse_id?: string | null; q?: string | null } }>(
        companyPath(companyId, `/reports/distributor/dispatch-operations?${qs.toString()}`),
      ),
  });
}

export function useRouteCoverage(args: {
  companyId: string;
  from?: string;
  to?: string;
  route_id?: string;
}) {
  const { companyId, from, to, route_id } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (route_id) qs.set("route_id", route_id);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "route-coverage", { from, to, route_id }],
    queryFn: async () =>
      apiClient.get<{ data: RouteCoverageRow[]; meta: { from?: string | null; to?: string | null } }>(
        companyPath(companyId, `/reports/distributor/route-coverage?${qs.toString()}`),
      ),
  });
}

export function useRepVisitProductivity(args: {
  companyId: string;
  from?: string;
  to?: string;
  salesperson_user_id?: string;
}) {
  const { companyId, from, to, salesperson_user_id } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (salesperson_user_id) qs.set("salesperson_user_id", salesperson_user_id);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "rep-visit-productivity", { from, to, salesperson_user_id }],
    queryFn: async () =>
      apiClient.get<{ data: RepVisitProductivityRow[]; meta: { from?: string | null; to?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/rep-visit-productivity?${qs.toString()}`),
      ),
  });
}

export function useMissedVisits(args: { companyId: string; date?: string; enabled?: boolean }) {
  const { companyId, date, enabled = true } = args;
  const qs = new URLSearchParams();
  if (date) qs.set("date", date);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "missed-visits", { date }],
    enabled: enabled && Boolean(date),
    queryFn: async () =>
      apiClient.get<{ data: MissedVisitRow[]; meta: { date: string } }>(
        companyPath(companyId, `/reports/distributor/missed-visits?${qs.toString()}`),
      ),
  });
}

export function useRouteOutstanding(args: { companyId: string; asOf?: string }) {
  const { companyId, asOf } = args;
  const qs = new URLSearchParams();
  if (asOf) qs.set("as_of", asOf);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "route-outstanding", { asOf }],
    queryFn: async () =>
      apiClient.get<{ data: RouteOutstandingRow[]; meta: { as_of?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/route-outstanding?${qs.toString()}`),
      ),
  });
}

export function useDcrRegister(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "distributor", "dcr-register", { from, to }],
    queryFn: async () =>
      apiClient.get<{ data: DcrRegisterRow[]; meta: { from?: string | null; to?: string | null; currency: string } }>(
        companyPath(companyId, `/reports/distributor/dcr-register?${qs.toString()}`),
      ),
  });
}

type GstReportKey = "gstr1" | "gstr3b" | "hsn-summary" | "itc";

export function useGstReport(args: {
  companyId: string;
  report: GstReportKey;
  from?: string;
  to?: string;
  enabled?: boolean;
}) {
  const { companyId, report, from, to, enabled = true } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "gst", report, { from, to }],
    queryFn: async () => apiClient.get(companyPath(companyId, `/gst/${report}?${qs.toString()}`)),
  });
}

export function useCreateGstExport(args: { companyId: string }) {
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "gst", "export", "create"],
    mutationFn: async (body: {
      report: "gstr1" | "gstr3b" | "hsn" | "itc";
      format?: "json" | "csv" | "excel";
      from?: string;
      to?: string;
    }) => apiClient.post(companyPath(companyId, `/gst/export`), body),
  });
}

export function useGstExportJob(args: { companyId: string; jobId: string; enabled?: boolean }) {
  const { companyId, jobId, enabled = true } = args;
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "gst", "exports", "job", jobId],
    queryFn: async () => apiClient.get(companyPath(companyId, `/gst/exports/${jobId}`)),
    refetchInterval: 2000,
  });
}

export function gstExportDownloadUrl(companyId: string, jobId: string) {
  return apiClient.resolveUrl(companyPath(companyId, `/gst/exports/${jobId}/download`));
}
