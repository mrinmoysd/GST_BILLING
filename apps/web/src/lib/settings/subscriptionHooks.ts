import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type Subscription = {
  id: string;
  companyId: string;
  planId?: string | null;
  plan?: string | null;
  status?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  provider?: string | null;
  createdAt: string;
  metadata?: unknown | null;
};

export function useSubscription(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "subscription"],
    queryFn: async () => apiClient.get<{ ok: true; data: Subscription | null }>(companyPath(companyId, "/subscription")),
  });
}

export function useCheckoutSubscription(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "subscription", "checkout"],
    mutationFn: async (body: { provider: "stripe" | "razorpay"; plan_code?: string; success_url?: string; cancel_url?: string }) =>
      apiClient.post<{ ok: true; data: { status: string; checkout_url: string | null; subscription_id: string } }>(
        companyPath(companyId, "/subscription/checkout"),
        body,
      ),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "subscription"] }),
  });
}
