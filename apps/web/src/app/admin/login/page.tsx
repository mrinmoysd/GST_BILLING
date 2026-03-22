"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";

import type { NormalizedApiError } from "@/lib/api/types";
import { useAdminLogin } from "@/lib/admin/auth-hooks";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminLogin();

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
      await login.mutateAsync(parsed.data);
      const target = new URLSearchParams(window.location.search).get("next");
      const nextPath = target && target.startsWith("/admin/") ? target : "/admin/dashboard";
      React.startTransition(() => {
        router.replace(nextPath);
      });
    } catch (e: unknown) {
      const err = e as NormalizedApiError;
      setError(err.message ?? "Admin login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,95,140,0.08),transparent_28%),var(--app-bg)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Internal Admin</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">Admin login</h1>

        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Sign in with your super-admin credentials to access platform operations.
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)] disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in to admin"}
          </button>

          <div className="mt-5 text-sm text-[var(--muted)]">
            Need tenant access instead?{" "}
            <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
              Go to workspace login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
