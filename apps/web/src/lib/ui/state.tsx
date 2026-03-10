"use client";

import * as React from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <div className="mt-1 text-sm text-neutral-500">{subtitle}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function InlineError({ title, message }: { title?: string; message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <div className="font-medium">{title ?? "Something went wrong"}</div>
      <div className="mt-1 opacity-90">{message}</div>
    </div>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  return <div className="text-sm text-neutral-500">{label ?? "Loading…"}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="font-medium">{title}</div>
      {hint ? <div className="mt-1 text-sm text-neutral-500">{hint}</div> : null}
    </div>
  );
}
