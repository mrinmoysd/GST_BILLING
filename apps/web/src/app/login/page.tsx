"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import type { NormalizedApiError } from "@/lib/api/types";
import { useLogin } from "@/lib/auth/hooks";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Please enter a valid email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login.mutateAsync(parsed.data);

      const target = new URLSearchParams(window.location.search).get("next");
      const nextPath = target || `/c/${data.user.company_id}/dashboard`;
      React.startTransition(() => {
        router.replace(nextPath);
      });
    } catch (e: unknown) {
      const err = e as NormalizedApiError;
      setError(err.message ?? "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Login</h1>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Sign in with your email and password. Your refresh session is stored in an httpOnly cookie.
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 20 }}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Password</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: "#fee2e2",
              color: "#7f1d1d",
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: 16,
            padding: "10px 14px",
            borderRadius: 10,
            background: "black",
            color: "white",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
