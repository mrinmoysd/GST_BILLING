"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session";
import type { SessionCompany, SessionUser } from "@/lib/auth/types";

export function useMe(enabled: boolean = true) {
  return useQuery({
    queryKey: ["auth", "me"],
    enabled,
    queryFn: async () => {
      const res = await apiClient.get<{ user: SessionUser; company: SessionCompany }>("/auth/me");
      return res.data;
    },
  });
}

export function useRefresh() {
  const { setAccessToken, refreshMe } = useAuth();
  return useMutation({
    mutationKey: ["auth", "refresh"],
    mutationFn: async () => {
      const res = await apiClient.post<{ access_token: string }>("/auth/refresh");
      setAccessToken(res.data.access_token);
      await refreshMe();
      return res.data;
    },
  });
}

export function useLogin() {
  const { setSessionFromLogin } = useAuth();
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await apiClient.post<{
        access_token: string;
        user: SessionUser;
        company: SessionCompany;
      }>("/auth/login", body);
      setSessionFromLogin(res.data);
      return res.data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationKey: ["auth", "forgot-password"],
    mutationFn: async (body: { email: string }) => {
      const res = await apiClient.post<{
        ok: true;
        message: string;
        dev?: { reset_token?: string; reset_path?: string };
      }>("/auth/forgot-password", body);
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationKey: ["auth", "reset-password"],
    mutationFn: async (body: { token: string; password: string }) => {
      const res = await apiClient.post<{ ok: true; message: string }>("/auth/reset-password", body);
      return res.data;
    },
  });
}

export function useLogout() {
  const { clearSession } = useAuth();
  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: async () => {
      // API will revoke session + clear cookie.
      await apiClient.post<{ ok: true }>("/auth/logout");
    },
    onSettled: () => {
      // Always clear client memory even if the network call fails.
      clearSession();
    },
  });
}
