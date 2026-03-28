"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/public/auth-shell";
import { getErrorMessage, logError } from "@/lib/errors";
import { useResetPassword } from "@/lib/auth/hooks";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPassword = useResetPassword();

  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  return (
    <AuthShell
      eyebrow="Credential recovery"
      title="Set a new password and return to the workspace."
      subtitle="Use the reset token from the recovery flow to establish a new password and hand the user back into the secure login path."
      asideTitle="Recovery flow"
      asideBody="This route is part of the tenant authentication journey. It should feel controlled, quiet, and explicit about the next step."
      asidePoints={[
        "The reset token is read from the URL query string",
        "A successful reset returns the user to standard login",
        "This route is for credential recovery, not onboarding",
      ]}
      footer={
        <>
          Back to{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            login
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Reset password</div>
          <h1 className="font-display text-4xl leading-none font-semibold tracking-[-0.04em] text-[var(--foreground)]">Choose a new password</h1>
          <p className="text-sm leading-6 text-[var(--muted)]">Set the new password, confirm it, then return to the workspace login.</p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">New password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.9)] px-4 text-sm shadow-sm"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted-strong)]">Confirm password</div>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.9)] px-4 text-sm shadow-sm"
            />
          </label>

          {error ? (
            <div className="rounded-[22px] border border-red-200 bg-[#fff6f3] px-4 py-3 text-sm text-[#7e3128]">
              {error}
            </div>
          ) : null}
          {ok ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {ok}
            </div>
          ) : null}

          <button
            type="button"
            disabled={resetPassword.isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-94 disabled:opacity-70"
            onClick={async () => {
              setError(null);
              setOk(null);
              if (!token) return setError("Missing reset token.");
              if (!password.trim() || password.length < 6) return setError("Password must be at least 6 characters.");
              if (password !== confirmPassword) return setError("Passwords do not match.");
              try {
                const data = await resetPassword.mutateAsync({ token, password });
                setOk(data.message);
                window.setTimeout(() => router.replace("/login"), 900);
              } catch (err: unknown) {
                logError(err, "reset-password-submit");
                setError(getErrorMessage(err, "Failed to reset password."));
              }
            }}
          >
            {resetPassword.isPending ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-10">Loading…</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
