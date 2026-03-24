"use client";

import * as React from "react";
import Link from "next/link";

import { AuthShell } from "@/components/public/auth-shell";
import type { NormalizedApiError } from "@/lib/api/types";
import { useForgotPassword } from "@/lib/auth/hooks";
import { InlineError } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [devResetPath, setDevResetPath] = React.useState<string | null>(null);

  return (
    <AuthShell
      mode="tenant"
      eyebrow="Recovery path"
      title="Recover access without leaving the operating surface."
      subtitle="Use the reset flow when the account exists but the user needs a clean way back in. In development, the app also exposes the prepared reset path directly."
      asideTitle="What happens next"
      asideBody="The reset request prepares a tokenized recovery path. In a production environment this would route through your mail delivery setup."
      asidePoints={[
        "The email address must already belong to an existing account.",
        "The same reset path supports owner and tenant users.",
        "Development environments expose the generated link directly for faster validation.",
      ]}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span>Remembered your password?</span>
          <Link className="font-medium text-[var(--accent)] underline underline-offset-4" href="/login">
            Back to login
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Reset access</div>
          <div className="font-display text-3xl leading-[0.94] font-semibold tracking-[-0.04em] text-[var(--foreground)]">Prepare a reset link</div>
          <div className="text-sm leading-6 text-[var(--muted)]">Enter the account email and the app will prepare the recovery route.</div>
        </div>
        <div className="space-y-4">
            <TextField label="Email" value={email} onChange={setEmail} type="email" />
            {error ? <InlineError message={error} /> : null}
            {message ? <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800">{message}</div> : null}
            {devResetPath ? (
              <div className="rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(245,247,250,0.9)] p-4 text-sm">
                <div className="font-medium text-[var(--foreground)]">Development reset link</div>
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
        </div>
      </div>
    </AuthShell>
  );
}
