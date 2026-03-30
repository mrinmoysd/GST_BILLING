import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { config } from "@/lib/config";
import { normalizeError } from "@/lib/errors";
import type {
  CommercialWarningSummary,
  StructuredPlanLimits,
  StructuredSubscriptionPlan,
} from "@/lib/settings/subscriptionCommerce";

const EMPTY_WARNING_SUMMARY: CommercialWarningSummary = {
  highest_severity: "none",
  items: [],
  counts: {
    info: 0,
    warning: 0,
    critical: 0,
  },
};

export type Subscription = {
  id: string;
  companyId: string;
  planId?: string | null;
  plan?: string | null;
  planName?: string | null;
  status?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  provider?: string | null;
  createdAt: string;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  trialStatus?: string | null;
  trialDaysRemaining?: number;
  accessControl?: {
    operationalWriteBlocked: boolean;
    reason?: string | null;
  } | null;
  usage?: {
    period_start?: string;
    period_end?: string;
    summary?: Record<string, number>;
    meters?: Array<{ id: string; key: string; value: number; updated_at: string }>;
  } | null;
  entitlement?: {
    id: string;
    planCode?: string | null;
    status?: string | null;
    effectiveLimits?: StructuredPlanLimits | null;
    billingPeriodStart?: string | null;
    billingPeriodEnd?: string | null;
    trialStartedAt?: string | null;
    trialEndsAt?: string | null;
    trialStatus?: string | null;
  } | null;
  warnings?: CommercialWarningSummary | null;
  metadata?: unknown | null;
};

type PublicPlansResponse = {
  data?: StructuredSubscriptionPlan[];
  error?: {
    message?: string;
    code?: string;
    details?: string[];
  };
};

async function fetchPublicPlans(): Promise<StructuredSubscriptionPlan[]> {
  const res = await fetch(`${config.apiBaseUrl}/billing/plans`, {
    method: "GET",
    credentials: "include",
  });

  let errorPayload: PublicPlansResponse["error"] | undefined;
  try {
    const parsed = (await res.json()) as PublicPlansResponse;
    if (res.ok) {
      return parsed.data ?? [];
    }
    errorPayload = parsed.error;
  } catch {
    errorPayload = undefined;
  }

  if (!res.ok) {
    throw normalizeError(
      {
        status: res.status,
        code: errorPayload?.code,
        message: errorPayload?.message ?? `Request failed (${res.status})`,
        details: errorPayload?.details,
      },
      { fallback: `Request failed (${res.status})` },
    );
  }

  return [];
}

export function useSubscription(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "subscription"],
    queryFn: async () => {
      const res = await apiClient.get<Subscription | null>(companyPath(companyId, "/subscription"));
      return res.data ?? null;
    },
  });
}

export function useSubscriptionPlans(companyId?: string) {
  return useQuery({
    queryKey: companyId ? ["companies", companyId, "subscription", "plans"] : ["billing", "plans"],
    queryFn: async () => {
      if (companyId) {
        const res = await apiClient.get<StructuredSubscriptionPlan[]>(
          companyPath(companyId, "/subscription/plans"),
        );
        return res.data ?? [];
      }

      return fetchPublicPlans();
    },
  });
}

export function useCheckoutSubscription(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "subscription", "checkout"],
    mutationFn: async (body: { provider: "stripe" | "razorpay"; plan_code?: string; success_url?: string; cancel_url?: string }) => {
      const res = await apiClient.post<{ status: string; checkout_url: string | null; subscription_id: string }>(
        companyPath(companyId, "/subscription/checkout"),
        body,
      );
      return res.data;
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "subscription"] }),
  });
}

export function useCancelSubscription(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "subscription", "cancel"],
    mutationFn: async () => {
      const res = await apiClient.post<Subscription | null>(
        companyPath(companyId, "/subscription/cancel"),
      );
      return res.data ?? null;
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "subscription"] }),
  });
}

export function useInvoiceBillingWarnings(companyId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["companies", companyId, "billing-warnings", "invoices"],
    enabled: enabled && Boolean(companyId),
    queryFn: async () => {
      const res = await apiClient.get<CommercialWarningSummary>(
        companyPath(companyId, "/billing-warnings/invoices"),
      );
      return res.data ?? EMPTY_WARNING_SUMMARY;
    },
  });
}

export function useSeatBillingWarnings(companyId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["companies", companyId, "billing-warnings", "seats"],
    enabled: enabled && Boolean(companyId),
    queryFn: async () => {
      const res = await apiClient.get<CommercialWarningSummary>(
        companyPath(companyId, "/billing-warnings/seats"),
      );
      return res.data ?? EMPTY_WARNING_SUMMARY;
    },
  });
}
