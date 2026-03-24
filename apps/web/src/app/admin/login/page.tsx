"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { AuthShell } from "@/components/public/auth-shell";
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
    <AuthShell
      mode="admin"
      eyebrow="Platform control"
      title="Enter the internal control plane."
      subtitle="Use this route for platform operations, tenant governance, subscription handling, support workflows, and internal administrative oversight."
      asideTitle="Operator access"
      asideBody="This is deliberately separate from tenant login. It is for super-admin and internal operator roles managing the SaaS platform itself."
      asidePoints={[
        "Manage companies, subscriptions, usage, queues, and support",
        "Access internal governance and audit surfaces",
        "Use tenant login instead if you are entering a customer workspace",
      ]}
      footer={
        <>
          Need tenant access instead?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Go to workspace login
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Internal admin</div>
          <h1 className="font-display text-4xl leading-none font-semibold tracking-[-0.04em] text-[var(--foreground)]">Admin sign-in</h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Restricted route for platform operators. This session controls the SaaS surface, not a tenant workspace.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.9)] px-4 text-sm shadow-sm"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.9)] px-4 text-sm shadow-sm"
            />
          </label>

          {error ? (
            <div className="rounded-[22px] border border-red-200 bg-[#fff6f3] px-4 py-3 text-sm text-[#7e3128]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-94 disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in to admin"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
