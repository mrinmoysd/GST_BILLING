"use client";

import * as React from "react";
import Link from "next/link";

import { logError } from "@/lib/errors";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logError(error, "route-error-boundary", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Unexpected issue
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          This page hit a problem.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          The action did not complete. You can retry the page, go back to the dashboard, or reopen the last workflow.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton type="button" onClick={reset}>
            Try again
          </PrimaryButton>
          <Link href="/login">
            <SecondaryButton type="button">Go to login</SecondaryButton>
          </Link>
        </div>
      </div>
    </main>
  );
}
