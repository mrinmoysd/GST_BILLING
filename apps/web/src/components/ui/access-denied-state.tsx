"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AccessDeniedState(props: {
  title?: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-panel)] p-8 [background-image:var(--panel-highlight)] shadow-[var(--shadow-soft)]">
      <div className="max-w-2xl space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Access control</div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          {props.title ?? "You do not have access to this page."}
        </h1>
        <p className="text-sm leading-6 text-[var(--muted-strong)]">{props.description}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={props.primaryHref}>{props.primaryLabel}</Link>
        </Button>
        {props.secondaryHref && props.secondaryLabel ? (
          <Button asChild variant="outline">
            <Link href={props.secondaryHref}>{props.secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
