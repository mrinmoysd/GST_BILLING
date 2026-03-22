import { config } from "@/lib/config";
import type { ApiEnvelope, ApiErrorEnvelope, NormalizedApiError } from "@/lib/api/types";

export class AdminApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const res = await fetch(`${config.apiBaseUrl}/admin/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        this.setAccessToken(null);
        return;
      }

      const json = (await res.json()) as ApiEnvelope<{ access_token: string }>;
      this.setAccessToken(json.data.access_token);
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async request<T>(
    path: string,
    init: RequestInit & { retryOnAuth?: boolean } = {},
  ): Promise<ApiEnvelope<T>> {
    const url = `${config.apiBaseUrl}${path}`;
    const headers = new Headers(init.headers);

    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json");
    }

    if (this.accessToken) {
      headers.set("authorization", `Bearer ${this.accessToken}`);
    }

    const res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

    if (res.status === 401 && init.retryOnAuth !== false) {
      await this.refreshAccessToken();
      if (this.accessToken) {
        return this.request<T>(path, { ...init, retryOnAuth: false });
      }
    }

    if (!res.ok) {
      let normalized: NormalizedApiError = {
        status: res.status,
        message: `Request failed (${res.status})`,
      };
      try {
        const json = (await res.json()) as ApiErrorEnvelope;
        normalized = {
          status: res.status,
          code: json.error?.code,
          message: json.error?.message ?? normalized.message,
          details: json.error?.details,
        };
      } catch {
        // ignore parse errors
      }

      throw normalized;
    }

    return (await res.json()) as ApiEnvelope<T>;
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { method: "GET", ...(init ?? {}) });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(init ?? {}),
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(init ?? {}),
    });
  }
}

export const adminApiClient = new AdminApiClient();
