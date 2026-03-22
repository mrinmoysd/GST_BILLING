"use client";

import { useMutation } from "@tanstack/react-query";

import { adminApiClient } from "@/lib/admin/api-client";
import { useAdminAuth } from "@/lib/admin/session";
import type { AdminSessionUser } from "@/lib/admin/types";

export function useAdminLogin() {
  const { setSessionFromLogin } = useAdminAuth();
  return useMutation({
    mutationKey: ["admin", "auth", "login"],
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await adminApiClient.post<{
        access_token: string;
        user: AdminSessionUser;
      }>("/admin/auth/login", body);
      setSessionFromLogin(res.data);
      return res.data;
    },
  });
}

export function useAdminLogout() {
  const { clearSession } = useAdminAuth();
  return useMutation({
    mutationKey: ["admin", "auth", "logout"],
    mutationFn: async () => {
      await adminApiClient.post<{ ok: true }>("/admin/auth/logout");
    },
    onSettled: () => {
      clearSession();
    },
  });
}
