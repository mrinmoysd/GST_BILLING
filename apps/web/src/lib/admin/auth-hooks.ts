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
      // Avoid refresh-retry loops on logout; 401/403 means already logged out.
      try {
        await adminApiClient.post<{ ok: true }>("/admin/auth/logout", undefined, {
          retryOnAuth: false,
        });
      } catch (error) {
        const status =
          error && typeof error === "object" && "status" in error
            ? Number((error as { status?: unknown }).status)
            : undefined;
        if (status !== 401 && status !== 403) {
          throw error;
        }
      }
    },
    onSettled: () => {
      clearSession();
    },
  });
}
