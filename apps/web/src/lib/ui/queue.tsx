import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QueueSegmentItem = {
  id: string;
  label: string;
  count?: React.ReactNode;
};

export function QueueSegmentBar(props: {
  items: QueueSegmentItem[];
  value: string;
  onValueChange: (value: string) => void;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.9)] p-3 shadow-[var(--shadow-soft)] md:flex-row md:items-center md:justify-between",
        props.className,
      )}
    >
      <div className="flex flex-wrap gap-2">
        {props.items.map((item) => {
          const active = item.id === props.value;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => props.onValueChange(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
                active
                  ? "border-[var(--accent)] bg-[rgba(180,104,44,0.12)] text-[var(--foreground)] shadow-sm"
                  : "border-transparent bg-[var(--surface-muted)] text-[var(--muted-strong)] hover:border-[var(--border)] hover:bg-[var(--surface)]",
              )}
            >
              <span>{item.label}</span>
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    active ? "bg-[rgba(180,104,44,0.18)] text-[var(--foreground)]" : "bg-[rgba(23,32,51,0.08)] text-[var(--muted)]",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {props.trailing ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{props.trailing}</div> : null}
    </section>
  );
}

export function QueueSavedViews(props: {
  items: Array<{ id: string; label: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  if (!props.items.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", props.className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Saved views</span>
      {props.items.map((item) => {
        const active = item.id === props.value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => props.onValueChange?.(item.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-[var(--accent)] bg-[rgba(180,104,44,0.12)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function QueueToolbar(props: {
  filters: React.ReactNode;
  summary?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.9)] p-4 shadow-[var(--shadow-soft)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end",
        props.className,
      )}
    >
      <div className="grid gap-4">{props.filters}</div>
      {props.summary ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{props.summary}</div> : null}
    </section>
  );
}

export function QueueShell(props: {
  children: React.ReactNode;
  inspector?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start", props.className)}>
      <div className="min-w-0 space-y-4">{props.children}</div>
      {props.inspector ? <div className="space-y-4 xl:sticky xl:top-28">{props.inspector}</div> : null}
    </section>
  );
}

export function QueueInspector(props: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-[28px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)] md:p-6",
        props.className,
      )}
    >
      <div className="space-y-3">
        {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{props.eyebrow}</div> : null}
        <div className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.title}</div>
        {props.subtitle ? <div className="text-sm leading-6 text-[var(--muted)]">{props.subtitle}</div> : null}
      </div>
      <div className="mt-5 space-y-4">{props.children}</div>
      {props.footer ? <div className="mt-5 border-t border-[var(--border)] pt-4">{props.footer}</div> : null}
    </aside>
  );
}

export function QueueMetaList(props: {
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", props.className)}>
      {props.items.map((item) => (
        <div key={item.label} className="grid gap-1 rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</div>
          <div className="text-sm font-medium text-[var(--foreground)]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function QueueQuickActions(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap items-center gap-2", props.className)}>{props.children}</div>;
}

export function QueueRowStateBadge(props: {
  label: React.ReactNode;
  variant?: "secondary" | "outline";
}) {
  return <Badge variant={props.variant ?? "secondary"}>{props.label}</Badge>;
}

export function QueueGhostAction(props: React.ComponentProps<typeof Button>) {
  return <Button variant="ghost" size="sm" {...props} />;
}
