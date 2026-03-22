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

export type PurchasesSummaryReport = {
  gross_purchases: number;
  net_purchases: number;
  tax_total: number;
  purchases_count: number;
  average_purchase: number;
  currency: string;
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

export function useSalesSummary(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "sales", "summary", { from, to }],
    queryFn: async () =>
      apiClient.get<SalesSummaryReport>(companyPath(companyId, `/reports/sales/summary?${qs.toString()}`)),
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

export function useOutstandingInvoices(args: { companyId: string; q?: string; page?: number; limit?: number }) {
  const { companyId, q, page = 1, limit = 20 } = args;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  return useQuery({
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
