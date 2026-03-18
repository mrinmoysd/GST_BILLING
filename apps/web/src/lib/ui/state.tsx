"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{eyebrow}</div> : null}
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">{title}</h1>
        {subtitle ? <div className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{subtitle}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function InlineError({ title, message }: { title?: string; message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-[#fff6f3] p-4 text-sm text-[#7e3128] shadow-sm">
      <div className="font-semibold">{title ?? "Something went wrong"}</div>
      <div className="mt-1 leading-6 opacity-90">{message}</div>
    </div>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  return (
    <Card className="border-dashed bg-[var(--surface-elevated)]">
      <CardContent className="space-y-3 p-5">
        <div className="text-sm font-medium text-[var(--muted-strong)]">{label ?? "Loading..."}</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-8 text-center shadow-sm", className)}>
      <div className="font-semibold text-[var(--foreground)]">{title}</div>
      {hint ? <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">{hint}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
