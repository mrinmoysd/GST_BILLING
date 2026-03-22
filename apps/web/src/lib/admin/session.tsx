"use client";

import * as React from "react";

import { config } from "@/lib/config";
import type { ApiEnvelope } from "@/lib/api/types";
import { adminApiClient } from "@/lib/admin/api-client";
import type { AdminSessionState, AdminSessionUser } from "@/lib/admin/types";

type AdminAuthContextValue = {
  session: AdminSessionState;
  bootstrapped: boolean;
  setAccessToken: (token: string | null) => void;
  setSessionFromLogin: (payload: { access_token: string; user: AdminSessionUser }) => void;
  clearSession: () => void;
  refreshMe: () => Promise<void>;
};

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null);

const emptySession: AdminSessionState = {
  accessToken: null,
  user: null,
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AdminSessionState>(emptySession);
  const [bootstrapped, setBootstrapped] = React.useState(false);

  const setAccessToken = React.useCallback((token: string | null) => {
    adminApiClient.setAccessToken(token);
    setSession((s) => ({ ...s, accessToken: token }));
  }, []);

  const setSessionFromLogin = React.useCallback((payload: { access_token: string; user: AdminSessionUser }) => {
    adminApiClient.setAccessToken(payload.access_token);
    setSession({
      accessToken: payload.access_token,
      user: payload.user,
    });
  }, []);

  const clearSession = React.useCallback(() => {
    adminApiClient.setAccessToken(null);
    setSession(emptySession);
  }, []);

  const refreshMe = React.useCallback(async () => {
    const me = await adminApiClient.get<{ user: AdminSessionUser }>("/admin/auth/me");
    setSession((s) => ({ ...s, user: me.data.user }));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await fetch(`${config.apiBaseUrl}/admin/auth/refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
        });
        if (!refreshed.ok) return;

        const json = (await refreshed.json()) as ApiEnvelope<{ access_token: string }>;
        if (cancelled) return;

        setAccessToken(json.data.access_token);
        await refreshMe();
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshMe, setAccessToken]);

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        bootstrapped,
        setAccessToken,
        setSessionFromLogin,
        clearSession,
        refreshMe,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = React.useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
