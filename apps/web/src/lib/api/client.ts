import { config } from "@/lib/config";
import type { ApiEnvelope, ApiErrorEnvelope, NormalizedApiError } from "@/lib/api/types";
import { normalizeError } from "@/lib/errors";

function toErrorPayload(error: ReturnType<typeof normalizeError>): NormalizedApiError {
  return {
    status: error.status,
    code: error.code,
    message: error.userMessage,
    details: error.details,
  };
}

async function tryParseJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class ApiClient {
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
      const res = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
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
    try {
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
        const json = await tryParseJson<ApiErrorEnvelope>(res);
        const normalized = normalizeError(
          {
            status: res.status,
            code: json?.error?.code,
            message: json?.error?.message ?? `Request failed (${res.status})`,
            details: json?.error?.details,
          },
          {
            fallback: `Request failed (${res.status})`,
          },
        );
        throw toErrorPayload(normalized);
      }

      const json = await tryParseJson<ApiEnvelope<T>>(res);
      if (!json) {
        throw toErrorPayload(
          normalizeError(
            {
              status: res.status,
              message: "The server returned an invalid response.",
            },
            {
              fallback: "The server returned an invalid response.",
            },
          ),
        );
      }

      return json;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as NormalizedApiError).message === "string"
      ) {
        throw error;
      }

      throw toErrorPayload(normalizeError(error));
    }
  }

  private async requestBlob(
    path: string,
    init: RequestInit & { retryOnAuth?: boolean } = {},
  ): Promise<Blob> {
    try {
      const url = `${config.apiBaseUrl}${path}`;
      const headers = new Headers(init.headers);

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
          return this.requestBlob(path, { ...init, retryOnAuth: false });
        }
      }

      if (!res.ok) {
        const json = await tryParseJson<ApiErrorEnvelope>(res);
        const normalized = normalizeError(
          {
            status: res.status,
            code: json?.error?.code,
            message: json?.error?.message ?? `Request failed (${res.status})`,
            details: json?.error?.details,
          },
          {
            fallback: `Request failed (${res.status})`,
          },
        );
        throw toErrorPayload(normalized);
      }

      return await res.blob();
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as NormalizedApiError).message === "string"
      ) {
        throw error;
      }

      throw toErrorPayload(normalizeError(error));
    }
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { method: "GET", ...(init ?? {}) });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit & { retryOnAuth?: boolean }) {
    return this.request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(init ?? {}),
    });
  }

  postForm<T>(path: string, form: FormData) {
    // NOTE: Don't set content-type for FormData; the browser will set boundary.
    return this.request<T>(path, {
      method: "POST",
      body: form,
      headers: {},
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit & { retryOnAuth?: boolean }) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(init ?? {}),
    });
  }

  put<T>(path: string, body?: unknown, init?: RequestInit & { retryOnAuth?: boolean }) {
    return this.request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(init ?? {}),
    });
  }

  del<T>(path: string, init?: RequestInit & { retryOnAuth?: boolean }) {
    return this.request<T>(path, { method: "DELETE", ...(init ?? {}) });
  }

  async openAuthenticatedFile(path: string) {
    const popup =
      typeof window !== "undefined"
        ? window.open("", "_blank", "noopener,noreferrer")
        : null;

    try {
      const blob = await this.requestBlob(path, { method: "GET" });
      const objectUrl = URL.createObjectURL(blob);
      if (popup && !popup.closed) {
        popup.location.href = objectUrl;
      } else if (typeof window !== "undefined") {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      if (popup && !popup.closed) {
        popup.close();
      }
      throw error;
    }
  }

  /**
   * Convert an API-relative path (e.g. "/companies/:id/invoices/x/pdf") into a full URL.
   * Useful for file downloads that should be opened in a new tab.
   */
  resolveUrl(path: string) {
    return `${config.apiBaseUrl}${path}`;
  }
}

export const apiClient = new ApiClient();
