import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type InvoiceSeries = {
  id: string;
  companyId: string;
  code: string;
  prefix?: string | null;
  nextNumber: number;
  isActive: boolean;
  createdAt: string;
};

export function useInvoiceSeries(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "invoice-series"],
    queryFn: async () => apiClient.get<{ ok: true; data: InvoiceSeries[] }>(companyPath(companyId, "/invoice-series")),
  });
}

export function useCreateInvoiceSeries(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "invoice-series", "create"],
    mutationFn: async (body: { code: string; prefix?: string; next_number?: number; is_active?: boolean }) =>
      apiClient.post<{ ok: true; data: InvoiceSeries }>(companyPath(companyId, "/invoice-series"), body),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "invoice-series"] }),
  });
}

export function useUpdateInvoiceSeries(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "invoice-series", "update"],
    mutationFn: async (args: { seriesId: string; patch: { prefix?: string; next_number?: number; is_active?: boolean } }) =>
      apiClient.patch<{ ok: true; data: InvoiceSeries }>(companyPath(companyId, `/invoice-series/${args.seriesId}`), args.patch),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "invoice-series"] }),
  });
}

export function useDeleteInvoiceSeries(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "invoice-series", "delete"],
    mutationFn: async (seriesId: string) => apiClient.del<{ ok: true; data: { deleted: true } }>(companyPath(companyId, `/invoice-series/${seriesId}`)),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "invoice-series"] }),
  });
}
