"use client";

import * as React from "react";

import { apiClient } from "@/lib/api/client";
import { config } from "@/lib/config";
import { logError } from "@/lib/errors";
import type { ApiEnvelope } from "@/lib/api/types";
import type { SessionCompany, SessionState, SessionUser } from "@/lib/auth/types";

type AuthContextValue = {
  session: SessionState;
  bootstrapped: boolean;
  setAccessToken: (token: string | null) => void;
  setSessionFromLogin: (payload: {
    access_token: string;
    user: SessionUser;
    company: SessionCompany;
  }) => void;
  clearSession: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);
const AUTH_SESSION_HINT_KEY = "gst_billing.auth.has_session";

const emptySession: SessionState = {
  accessToken: null,
  user: null,
  company: null,
};

function setSessionHint(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) {
    window.localStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
    return;
  }
  window.localStorage.removeItem(AUTH_SESSION_HINT_KEY);
}

function hasSessionHint() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<SessionState>(emptySession);
  const [bootstrapped, setBootstrapped] = React.useState(false);

  const setAccessToken = React.useCallback((token: string | null) => {
    apiClient.setAccessToken(token);
    setSession((s) => ({ ...s, accessToken: token }));
  }, []);

  const setSessionFromLogin = React.useCallback(
    (payload: { access_token: string; user: SessionUser; company: SessionCompany }) => {
      apiClient.setAccessToken(payload.access_token);
      setSessionHint(true);
      setSession({
        accessToken: payload.access_token,
        user: payload.user,
        company: payload.company,
      });
    },
    [],
  );

  const clearSession = React.useCallback(() => {
    apiClient.setAccessToken(null);
    setSessionHint(false);
    setSession(emptySession);
  }, []);

  const refreshMe = React.useCallback(async () => {
    const me = await apiClient.get<{ user: SessionUser; company: SessionCompany }>("/auth/me");
    setSession((s) => ({ ...s, user: me.data.user, company: me.data.company }));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasSessionHint()) {
        if (!cancelled) setBootstrapped(true);
        return;
      }

      try {
        const refreshed = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
        });
        if (!refreshed.ok) {
          setSessionHint(false);
          return;
        }

        const json = (await refreshed.json()) as ApiEnvelope<{ access_token: string }>;
        if (cancelled) return;

        setSessionHint(true);
        setAccessToken(json.data.access_token);
        await refreshMe();
      } catch (error) {
        setSessionHint(false);
        logError(error, "auth-bootstrap-refresh");
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshMe, setAccessToken]);

  const value: AuthContextValue = {
    session,
  bootstrapped,
    setAccessToken,
    setSessionFromLogin,
    clearSession,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
