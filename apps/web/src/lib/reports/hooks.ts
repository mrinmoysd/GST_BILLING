import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export function useSalesSummary(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "sales", "summary", { from, to }],
    queryFn: async () => apiClient.get(companyPath(companyId, `/reports/sales/summary?${qs.toString()}`)),
  });
}

export function usePurchasesSummary(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "purchases", "summary", { from, to }],
    queryFn: async () => apiClient.get(companyPath(companyId, `/reports/purchases/summary?${qs.toString()}`)),
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
    queryFn: async () => apiClient.get(companyPath(companyId, `/reports/sales/outstanding?${qs.toString()}`)),
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
    queryFn: async () => apiClient.get(companyPath(companyId, `/reports/sales/top-products?${qs.toString()}`)),
  });
}

export function useProfitSnapshot(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["companies", companyId, "reports", "profit", "snapshot", { from, to }],
    queryFn: async () => apiClient.get(companyPath(companyId, `/reports/profit/snapshot?${qs.toString()}`)),
  });
}

export function useCreateGstr1Export(args: { companyId: string }) {
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "exports", "gstr1", "create"],
    mutationFn: async (body: { from?: string; to?: string }) => {
      const qs = new URLSearchParams();
      if (body.from) qs.set("from", body.from);
      if (body.to) qs.set("to", body.to);
      return apiClient.post(companyPath(companyId, `/exports/gstr1?${qs.toString()}`), {});
    },
  });
}

export function useExportJob(args: { companyId: string; jobId: string; enabled?: boolean }) {
  const { companyId, jobId, enabled = true } = args;
  return useQuery({
    enabled,
    queryKey: ["companies", companyId, "exports", "job", jobId],
    queryFn: async () => apiClient.get(companyPath(companyId, `/exports/${jobId}`)),
    refetchInterval: 2000,
  });
}

export function exportDownloadUrl(companyId: string, jobId: string) {
  return apiClient.resolveUrl(companyPath(companyId, `/exports/${jobId}/download`));
}
