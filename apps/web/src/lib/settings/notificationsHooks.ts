import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type NotificationTemplate = {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  is_active?: boolean;
};

export type NotificationOutbox = {
  id: string;
  channel: string;
  to_address?: string | null;
  status: string;
  attempts: number;
  last_error?: string | null;
  sent_at?: string | null;
  created_at: string;
  template_code?: string | null;
};

export function useNotificationTemplates(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "notification-templates"],
    queryFn: async () => apiClient.get<{ ok: true; data: NotificationTemplate[] }>(companyPath(companyId, `/notification-templates`)),
  });
}

export function useCreateNotificationTemplate(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "notification-templates", "create"],
    mutationFn: async (body: { code: string; channel: string; subject?: string; body: string }) =>
      apiClient.post<{ ok: true; data: NotificationTemplate }>(companyPath(companyId, `/notification-templates`), body),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "notification-templates"] }),
  });
}

export function useUpdateNotificationTemplate(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "notification-templates", "update"],
    mutationFn: async (args: { templateId: string; patch: { name?: string; channel?: string; subject?: string; body?: string } }) =>
      apiClient.patch<{ ok: true; data: NotificationTemplate }>(
        companyPath(companyId, `/notification-templates/${args.templateId}`),
        args.patch,
      ),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "notification-templates"] }),
  });
}

export function useTestNotification(companyId: string) {
  return useMutation({
    mutationKey: ["companies", companyId, "notifications", "test"],
    mutationFn: async (body: { template_code: string; channel: string; to_address: string; sample_payload?: Record<string, unknown> }) =>
      apiClient.post<{ ok: true; data: unknown }>(companyPath(companyId, `/notifications/test`), body),
  });
}

export function useNotificationOutbox(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "notifications", "outbox"],
    queryFn: async () => apiClient.get<{ ok: true; data: NotificationOutbox[] }>(companyPath(companyId, `/notifications/outbox`)),
  });
}

export function useProcessNotifications(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "notifications", "process"],
    mutationFn: async () => apiClient.post<{ ok: true; data: unknown }>(companyPath(companyId, `/notifications/process`), {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "notifications", "outbox"] });
    },
  });
}

export function useRetryNotification(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "notifications", "retry"],
    mutationFn: async (outboxId: string) =>
      apiClient.post<{ ok: true; data: unknown }>(companyPath(companyId, `/notifications/outbox/${outboxId}/retry`), {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "notifications", "outbox"] });
    },
  });
}
