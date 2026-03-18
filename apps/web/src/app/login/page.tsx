"use client";

import * as React from "react";
import Link from "next/link";
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
      const nextPath = target && target.startsWith("/") ? target : `/c/${data.user.company_id}/dashboard`;
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,95,140,0.08),transparent_28%),var(--app-bg)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">Login</h1>

      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Sign in with your email and password. Your refresh session is stored in an httpOnly cookie.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <label className="mb-4 block">
          <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
          />
        </label>

        <label className="mb-4 block">
          <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Password</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
          />
        </label>

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-[#fff6f3] p-4 text-sm text-[#7e3128]">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)] disabled:opacity-70">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-5 text-sm text-[var(--muted)]">
          New here?{" "}
          <Link href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
            Create your company
          </Link>
        </div>
        <div className="mt-2 text-sm text-[var(--muted)]">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="font-medium text-[var(--accent)] hover:underline">
            Reset it
          </Link>
        </div>
      </form>
      </div>
    </main>
  );
}
