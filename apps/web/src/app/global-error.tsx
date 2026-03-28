"use client";

import * as React from "react";

import "./globals.css";
import { logError } from "@/lib/errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logError(error, "global-error-boundary", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--app-bg)] px-4 py-10 text-[var(--foreground)]">
        <main className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              System fallback
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em]">
              We could not render the app.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              The app ran into an unexpected problem. Refresh and try again. If the issue continues, check the latest deployment or server logs.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] shadow-[var(--shadow-soft)]"
            >
              Reload app
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
