import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type CompanyUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  assigned_roles: string[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
};

export type PermissionDefinition = {
  code: string;
  group: string;
  description: string;
};

export type BuiltInRole = {
  id: string;
  name: string;
  builtin: true;
  permissions: string[];
  user_count: number;
};

export type CustomRole = {
  id: string;
  companyId: string;
  name: string;
  permissions: string[];
  user_count: number;
  createdAt: string;
};

export type AdminAuditEntry = {
  id: string;
  action: string;
  actor_user_id: string;
  actor_email?: string | null;
  target_type: string;
  target_id?: string | null;
  summary: string;
  created_at: string;
};

export type RolesResponse = {
  built_in: BuiltInRole[];
  roles: CustomRole[];
  permissions: PermissionDefinition[];
  audit: AdminAuditEntry[];
};

export function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "users"],
    queryFn: async () => apiClient.get<CompanyUser[]>(companyPath(companyId, "/users")),
  });
}

export function useInviteCompanyUser(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "users", "invite"],
    mutationFn: async (body: {
      email: string;
      name?: string;
      primary_role?: string;
      role_ids?: string[];
      is_active?: boolean;
      temp_password?: string;
    }) =>
      apiClient.post<{ user: CompanyUser; dev?: { temporary_password?: string } }>(
        companyPath(companyId, "/users"),
        body,
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "roles"] });
    },
  });
}

export function usePatchCompanyUser(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "users", "patch"],
    mutationFn: async (args: {
      userId: string;
      patch: { name?: string; primary_role?: string; role_ids?: string[]; is_active?: boolean };
    }) => apiClient.patch<CompanyUser>(companyPath(companyId, `/users/${args.userId}`), args.patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "roles"] });
    },
  });
}

export function useCompanyRoles(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "roles"],
    queryFn: async () => apiClient.get<RolesResponse>(companyPath(companyId, "/roles")),
  });
}

export function useCreateCompanyRole(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "roles", "create"],
    mutationFn: async (body: { name: string; permission_codes: string[] }) =>
      apiClient.post<CustomRole>(companyPath(companyId, "/roles"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "roles"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] });
    },
  });
}

export function usePatchCompanyRole(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "roles", "patch"],
    mutationFn: async (args: { roleId: string; patch: { name?: string; permission_codes?: string[] } }) =>
      apiClient.patch<CustomRole>(companyPath(companyId, `/roles/${args.roleId}`), args.patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "roles"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] });
    },
  });
}

export function useDeleteCompanyRole(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "roles", "delete"],
    mutationFn: async (roleId: string) =>
      apiClient.del<{ deleted: true }>(companyPath(companyId, `/roles/${roleId}`)),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "roles"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "users"] });
    },
  });
}
