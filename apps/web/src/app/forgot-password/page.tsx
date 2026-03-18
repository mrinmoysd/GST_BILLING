"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NormalizedApiError } from "@/lib/api/types";
import { useForgotPassword } from "@/lib/auth/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [devResetPath, setDevResetPath] = React.useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,95,140,0.08),transparent_28%),var(--app-bg)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-xl">
        <PageHeader
          eyebrow="Auth"
          title="Forgot password"
          subtitle="Request a password reset link for your account."
          actions={<Link className="text-sm underline" href="/login">Back to login</Link>}
        />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Reset access</CardTitle>
            <CardDescription>Enter your email address and the app will prepare a reset link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField label="Email" value={email} onChange={setEmail} type="email" />
            {error ? <InlineError message={error} /> : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div> : null}
            {devResetPath ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                <div className="font-medium text-[var(--foreground)]">Dev reset link</div>
                <Link className="mt-2 inline-block text-[var(--accent)] underline" href={devResetPath}>
                  {devResetPath}
                </Link>
              </div>
            ) : null}
            <PrimaryButton
              type="button"
              disabled={forgotPassword.isPending}
              onClick={async () => {
                setError(null);
                setMessage(null);
                setDevResetPath(null);
                if (!email.trim()) return setError("Email is required.");
                try {
                  const data = await forgotPassword.mutateAsync({ email: email.trim() });
                  setMessage(data.message);
                  setDevResetPath(data.dev?.reset_path ?? null);
                } catch (err: unknown) {
                  const apiError = err as NormalizedApiError;
                  setError(apiError.message ?? "Failed to prepare reset link");
                }
              }}
            >
              {forgotPassword.isPending ? "Preparing…" : "Request reset"}
            </PrimaryButton>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
