import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApiClient } from "@/lib/admin/api-client";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => adminApiClient.get(`/admin/dashboard`),
    refetchInterval: 30000,
  });
}

export function useAdminCompanies(args: { page?: number; limit?: number; q?: string }) {
  const { page = 1, limit = 20, q } = args;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  return useQuery({
    queryKey: ["admin", "companies", { page, limit, q }],
    queryFn: async () => adminApiClient.get(`/admin/companies?${qs.toString()}`),
  });
}

export function useAdminCompany(companyId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["admin", "companies", companyId],
    enabled: enabled && Boolean(companyId),
    queryFn: async () => adminApiClient.get(`/admin/companies/${companyId}`),
  });
}

export function useCreateAdminCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "companies", "create"],
    mutationFn: async (body: {
      company_name: string;
      owner_name: string;
      email: string;
      password: string;
      gstin?: string;
      pan?: string;
      business_type?: string;
      state?: string;
      state_code?: string;
      timezone?: string;
      invoice_prefix?: string;
      allow_negative_stock?: boolean;
    }) => {
      const res = await adminApiClient.post(`/admin/companies`, body);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    },
  });
}

export function useUpdateAdminCompanyLifecycle(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "companies", companyId, "lifecycle"],
    mutationFn: async (body: { action: "suspend" | "reactivate"; note?: string }) => {
      const res = await adminApiClient.patch(`/admin/companies/${companyId}/lifecycle`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "companies"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "companies", companyId] }),
      ]);
    },
  });
}

export function useAdminSubscriptions(args: { page?: number; limit?: number; status?: string }) {
  const { page = 1, limit = 20, status } = args;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (status) qs.set("status", status);
  return useQuery({
    queryKey: ["admin", "subscriptions", { page, limit, status }],
    queryFn: async () => adminApiClient.get(`/admin/subscriptions?${qs.toString()}`),
  });
}

export function useAdminSubscription(subscriptionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["admin", "subscriptions", subscriptionId],
    enabled: enabled && Boolean(subscriptionId),
    queryFn: async () => adminApiClient.get(`/admin/subscriptions/${subscriptionId}`),
  });
}

export function useAdminSubscriptionPlans() {
  return useQuery({
    queryKey: ["admin", "subscriptions", "plans"],
    queryFn: async () => adminApiClient.get(`/admin/subscriptions/plans`),
  });
}

export function useCreateAdminSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "subscriptions", "plans", "create"],
    mutationFn: async (body: {
      code: string;
      name: string;
      price_inr: number;
      billing_interval?: "month" | "year";
      limits?: Record<string, unknown>;
      is_public?: boolean;
      display_order?: number;
      trial_days?: number;
      allow_add_ons?: boolean;
      is_active?: boolean;
    }) => {
      const res = await adminApiClient.post(`/admin/subscriptions/plans`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "plans"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
      ]);
    },
  });
}

export function useUpdateAdminSubscriptionPlan(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "subscriptions", "plans", planId, "update"],
    mutationFn: async (body: {
      name?: string;
      price_inr?: number;
      billing_interval?: "month" | "year";
      limits?: Record<string, unknown>;
      is_public?: boolean;
      display_order?: number;
      trial_days?: number;
      allow_add_ons?: boolean;
      is_active?: boolean;
    }) => {
      const res = await adminApiClient.patch(`/admin/subscriptions/plans/${planId}`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "plans"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
      ]);
    },
  });
}

export function useUpdateAdminSubscription(subscriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "subscriptions", subscriptionId, "update"],
    mutationFn: async (body: {
      action:
        | "cancel"
        | "reactivate"
        | "mark_past_due"
        | "mark_active"
        | "change_plan"
        | "reconcile"
        | "extend_trial"
        | "end_trial";
      plan_code?: string;
      note?: string;
      trial_days?: number;
    }) => {
      const res = await adminApiClient.patch(`/admin/subscriptions/${subscriptionId}`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", subscriptionId] }),
      ]);
    },
  });
}

export function useUpdateAdminSubscriptionOverrides(subscriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "subscriptions", subscriptionId, "overrides"],
    mutationFn: async (body: {
      extra_full_seats?: number;
      extra_view_only_seats?: number;
      invoice_uplift_per_month?: number;
      company_uplift?: number;
      enforcement_mode?: "hard_block" | "wallet_overage" | "warn_only";
      note?: string;
    }) => {
      const res = await adminApiClient.post(`/admin/subscriptions/${subscriptionId}/overrides`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", subscriptionId] }),
      ]);
    },
  });
}

export function useAdminUsage(args: { from?: string; to?: string }) {
  const { from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["admin", "usage", { from, to }],
    queryFn: async () => adminApiClient.get(`/admin/usage?${qs.toString()}`),
  });
}

export function useAdminSupportTickets(args?: { status?: string; page?: number; limit?: number }) {
  const status = args?.status;
  const page = args?.page ?? 1;
  const limit = args?.limit ?? 20;
  return useQuery({
    queryKey: ["admin", "support-tickets", { status, page, limit }],
    queryFn: async () => adminApiClient.get(adminSupportTicketsUrl({ status, page, limit })),
  });
}

export function adminSupportTicketsUrl(args: { status?: string; page?: number; limit?: number }) {
  const { status, page = 1, limit = 20 } = args;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (status) qs.set("status", status);
  return `/admin/support-tickets?${qs.toString()}`;
}

export function useAdminQueueMetrics() {
  return useQuery({
    queryKey: ["admin", "queues", "metrics"],
    queryFn: async () => adminApiClient.get(`/admin/queues/metrics`),
    refetchInterval: 5000,
  });
}

export function useAdminInternalRoles() {
  return useQuery({
    queryKey: ["admin", "internal-users", "roles"],
    queryFn: async () => adminApiClient.get(`/admin/internal-users/roles`),
  });
}

export function useAdminInternalUsers(args?: { page?: number; limit?: number; q?: string }) {
  const page = args?.page ?? 1;
  const limit = args?.limit ?? 20;
  const q = args?.q;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  return useQuery({
    queryKey: ["admin", "internal-users", { page, limit, q }],
    queryFn: async () => adminApiClient.get(`/admin/internal-users?${qs.toString()}`),
  });
}

export function useCreateAdminInternalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "internal-users", "create"],
    mutationFn: async (body: {
      email: string;
      password: string;
      role: string;
      name?: string;
    }) => {
      const res = await adminApiClient.post(`/admin/internal-users`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "internal-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] }),
      ]);
    },
  });
}

export function useUpdateAdminInternalUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "internal-users", userId, "update"],
    mutationFn: async (body: {
      name?: string;
      role?: string;
      is_active?: boolean;
      password?: string;
    }) => {
      const res = await adminApiClient.patch(`/admin/internal-users/${userId}`, body);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "internal-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] }),
      ]);
    },
  });
}

export function useAdminAuditLogs(args?: {
  page?: number;
  limit?: number;
  q?: string;
  action?: string;
  actor_user_id?: string;
  company_id?: string;
}) {
  const page = args?.page ?? 1;
  const limit = args?.limit ?? 20;
  const q = args?.q;
  const action = args?.action;
  const actorUserId = args?.actor_user_id;
  const companyId = args?.company_id;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  if (action) qs.set("action", action);
  if (actorUserId) qs.set("actor_user_id", actorUserId);
  if (companyId) qs.set("company_id", companyId);
  return useQuery({
    queryKey: ["admin", "audit-logs", { page, limit, q, action, actorUserId, companyId }],
    queryFn: async () => adminApiClient.get(`/admin/audit-logs?${qs.toString()}`),
  });
}
