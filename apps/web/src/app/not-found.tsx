import Link from "next/link";

import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Not found
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          That page is not available.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          The link may be outdated, the record may have been removed, or you may not have access to this route anymore.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login">
            <PrimaryButton type="button">Go to login</PrimaryButton>
          </Link>
          <Link href="/">
            <SecondaryButton type="button">Open home</SecondaryButton>
          </Link>
        </div>
      </div>
    </main>
  );
}
