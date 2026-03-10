import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type CompanyUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
};

export type RolesResponse = {
  built_in: { id: string; name: string; builtin: true }[];
  roles: { id: string; companyId: string; name: string; createdAt: string }[];
};

export function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "users"],
    queryFn: async () => apiClient.get<{ ok: true; data: CompanyUser[] }>(companyPath(companyId, "/users")),
  });
}

export function useInviteCompanyUser(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "users", "invite"],
    mutationFn: async (body: { email: string; name?: string; role?: string; is_active?: boolean; temp_password?: string }) =>
      apiClient.post<{ ok: true; data: { user: CompanyUser; dev?: { temporary_password?: string } } }>(
        companyPath(companyId, "/users"),
        body,
      ),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] }),
  });
}

export function usePatchCompanyUser(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "users", "patch"],
    mutationFn: async (args: { userId: string; patch: { name?: string; role?: string; is_active?: boolean } }) =>
      apiClient.patch<{ ok: true; data: CompanyUser }>(companyPath(companyId, `/users/${args.userId}`), args.patch),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] }),
  });
}

export function useCompanyRoles(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "roles"],
    queryFn: async () => apiClient.get<{ ok: true; data: RolesResponse }>(companyPath(companyId, "/roles")),
  });
}
