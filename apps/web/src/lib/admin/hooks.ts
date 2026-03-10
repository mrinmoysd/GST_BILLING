import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export function useAdminCompanies(args: { page?: number; limit?: number; q?: string }) {
  const { page = 1, limit = 20, q } = args;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  return useQuery({
    queryKey: ["admin", "companies", { page, limit, q }],
    queryFn: async () => apiClient.get(`/admin/companies?${qs.toString()}`),
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
    queryFn: async () => apiClient.get(`/admin/subscriptions?${qs.toString()}`),
  });
}

export function useAdminUsage(args: { from?: string; to?: string }) {
  const { from, to } = args;
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return useQuery({
    queryKey: ["admin", "usage", { from, to }],
    queryFn: async () => apiClient.get(`/admin/usage?${qs.toString()}`),
  });
}

export function useAdminSupportTickets(args?: { status?: string; page?: number; limit?: number }) {
  const status = args?.status;
  const page = args?.page ?? 1;
  const limit = args?.limit ?? 20;
  return useQuery({
    queryKey: ["admin", "support-tickets", { status, page, limit }],
    queryFn: async () => apiClient.get(adminSupportTicketsUrl({ status, page, limit })),
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
    queryFn: async () => apiClient.get(`/admin/queues/metrics`),
    refetchInterval: 5000,
  });
}
