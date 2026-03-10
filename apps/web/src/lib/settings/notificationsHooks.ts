import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type NotificationTemplate = {
  id: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  created_at?: string;
  updated_at?: string;
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
    mutationFn: async (body: { name: string; channel: string; subject?: string; body: string }) =>
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
    mutationFn: async (body: { channel: string; to: string; subject?: string; body: string }) =>
      apiClient.post<{ ok: true; data: unknown }>(companyPath(companyId, `/notifications/test`), body),
  });
}
