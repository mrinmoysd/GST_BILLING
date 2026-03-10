import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type Company = {
  id: string;
  name: string;
  gstin?: string | null;
  pan?: string | null;
  businessType: string;
  address?: unknown | null;
  state?: string | null;
  stateCode?: string | null;
  contact?: unknown | null;
  bankDetails?: unknown | null;
  invoiceSettings?: unknown | null;
  allowNegativeStock: boolean;
  logoUrl?: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export function useCompany(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "company"],
    queryFn: async () => apiClient.get<{ ok: true; data: Company }>(companyPath(companyId, "")),
  });
}

export function useUpdateCompany(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "company", "update"],
    mutationFn: async (patch: {
      name?: string;
      gstin?: string;
      pan?: string;
      business_type?: string;
      state?: string;
      state_code?: string;
      timezone?: string;
      logo_url?: string;
      allow_negative_stock?: boolean;
    }) => apiClient.patch<{ ok: true; data: Company }>(companyPath(companyId, ""), patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "company"] });
    },
  });
}
