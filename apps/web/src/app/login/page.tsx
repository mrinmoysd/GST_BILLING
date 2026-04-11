"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/public/auth-shell";
import { getErrorMessage, logError } from "@/lib/errors";
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
      logError(e, "tenant-login-submit", { email: parsed.data.email });
      setError(getErrorMessage(e, "Login failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Workspace access"
      title="Enter the operating surface."
      subtitle="Sign in to continue into your company workspace, where billing, stock, GST, payments, and books stay connected."
      asideTitle="What happens after sign-in"
      asideBody="This is the tenant entry path. Use it when you are moving into day-to-day operations rather than public evaluation or internal platform administration."
      asidePoints={[
        "Resume a protected tenant route if you were redirected here",
        "Use one login to move across billing, GST, accounting, inventory, and POS",
        "Password recovery stays inside the same secure session flow",
      ]}
      footer={
        <>
          New here?{" "}
          <Link href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
            Create your company
          </Link>
          {" · "}
          Forgot your password?{" "}
          <Link href="/forgot-password" className="font-medium text-[var(--accent)] hover:underline">
            Reset it
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Tenant login</div>
          <h1 className="font-display text-3xl leading-none font-semibold tracking-[-0.035em] text-[var(--foreground)]">Sign in</h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Your refresh session is stored in an httpOnly cookie so the workspace can restore state securely.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Email</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Password</div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="rounded-[12px] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--foreground)]">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
