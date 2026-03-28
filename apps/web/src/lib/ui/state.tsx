"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageActionGroup, PageContextStrip, PageHeader } from "@/lib/ui/page-header";
import { cn } from "@/lib/utils";

export { PageActionGroup, PageContextStrip, PageHeader };

export function InlineError({ title, message }: { title?: string; message: string }) {
  return (
    <div className="rounded-2xl border border-[color:color-mix(in_oklab,var(--danger)_36%,var(--border))] bg-[color:color-mix(in_oklab,var(--danger)_12%,var(--surface))] p-4 text-sm text-[var(--foreground)] shadow-sm">
      <div className="font-semibold">{title ?? "Something went wrong"}</div>
      <div className="mt-1 leading-6 text-[var(--muted-strong)]">{message}</div>
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
