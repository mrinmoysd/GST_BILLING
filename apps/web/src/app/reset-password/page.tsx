"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NormalizedApiError } from "@/lib/api/types";
import { useResetPassword } from "@/lib/auth/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,95,140,0.08),transparent_28%),var(--app-bg)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-xl">
        <PageHeader
          eyebrow="Auth"
          title="Reset password"
          subtitle="Set a new password using the reset token from the forgot-password flow."
          actions={<Link className="text-sm underline" href="/login">Back to login</Link>}
        />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Choose a new password</CardTitle>
            <CardDescription>The reset token is read from the URL query string.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField label="New password" value={password} onChange={setPassword} type="password" />
            <TextField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
            {error ? <InlineError message={error} /> : null}
            {ok ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{ok}</div> : null}
            <PrimaryButton
              type="button"
              disabled={resetPassword.isPending}
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
                  const apiError = err as NormalizedApiError;
                  setError(apiError.message ?? "Failed to reset password");
                }
              }}
            >
              {resetPassword.isPending ? "Updating…" : "Update password"}
            </PrimaryButton>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-10">Loading…</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
