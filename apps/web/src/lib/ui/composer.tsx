"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ComposerStep = {
  id: string;
  label: string;
  description?: string;
  meta?: React.ReactNode;
};

function getStepState(items: ComposerStep[], activeId: string, id: string) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const index = items.findIndex((item) => item.id === id);

  if (index === -1 || activeIndex === -1) return "upcoming" as const;
  if (index < activeIndex) return "complete" as const;
  if (index === activeIndex) return "current" as const;
  return "upcoming" as const;
}

export function ComposerStepBar(props: {
  steps: ComposerStep[];
  activeId: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,244,238,0.94))] p-4 shadow-[var(--shadow-soft)] md:p-5",
        props.className,
      )}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {props.steps.map((step, index) => {
          const state = getStepState(props.steps, props.activeId, step.id);
          return (
            <div
              key={step.id}
              className={cn(
                "rounded-[24px] border px-4 py-4 transition",
                state === "current"
                  ? "border-[rgba(180,104,44,0.28)] bg-[rgba(180,104,44,0.12)]"
                  : state === "complete"
                    ? "border-[rgba(32,88,62,0.14)] bg-[rgba(32,88,62,0.08)]"
                    : "border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.78)]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    state === "current"
                      ? "bg-[var(--accent)] text-white"
                      : state === "complete"
                        ? "bg-[rgba(32,88,62,0.12)] text-[#20583e]"
                        : "bg-[rgba(23,32,51,0.08)] text-[var(--muted-strong)]",
                  )}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{step.label}</div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        state === "current"
                          ? "bg-[rgba(180,104,44,0.16)] text-[var(--accent)]"
                          : state === "complete"
                            ? "bg-[rgba(32,88,62,0.12)] text-[#20583e]"
                            : "bg-[rgba(23,32,51,0.08)] text-[var(--muted)]",
                      )}
                    >
                      {state === "current" ? "In focus" : state === "complete" ? "Ready" : "Upcoming"}
                    </span>
                  </div>
                  {step.description ? <div className="text-sm leading-6 text-[var(--muted)]">{step.description}</div> : null}
                  {step.meta ? <div className="text-xs font-medium text-[var(--muted-strong)]">{step.meta}</div> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ComposerBody(props: {
  children: React.ReactNode;
  rail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_360px] xl:items-start", props.className)}>
      <div className="min-w-0 space-y-6">{props.children}</div>
      {props.rail ? <div className="space-y-4 xl:sticky xl:top-[8rem]">{props.rail}</div> : null}
    </div>
  );
}

export function ComposerSection(props: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "muted";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[30px] border p-5 shadow-[var(--shadow-soft)] md:p-6",
        props.tone === "muted"
          ? "border-[rgba(23,32,51,0.08)] bg-[rgba(248,246,242,0.92)]"
          : "border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.92)]",
        props.className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{props.eyebrow}</div> : null}
          <div className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.title}</div>
          {props.description ? <div className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{props.description}</div> : null}
        </div>
        {props.actions ? <div className="shrink-0">{props.actions}</div> : null}
      </div>
      <div className={cn(props.eyebrow || props.description || props.actions ? "mt-5" : "", "space-y-4")}>{props.children}</div>
    </section>
  );
}

export function ComposerSummaryRail(props: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-[30px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.96)] p-5 shadow-[var(--shadow-soft)] md:p-6",
        props.className,
      )}
    >
      <div className="space-y-2">
        {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{props.eyebrow}</div> : null}
        <div className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.title}</div>
        {props.description ? <div className="text-sm leading-6 text-[var(--muted)]">{props.description}</div> : null}
      </div>
      <div className="mt-5 space-y-4">{props.children}</div>
    </aside>
  );
}

export function ComposerMetricCard(props: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-4 py-4",
        props.strong
          ? "border-[rgba(180,104,44,0.18)] bg-[rgba(180,104,44,0.08)]"
          : "border-[var(--border)] bg-[var(--surface-muted)]",
        props.className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{props.label}</div>
      <div className={cn("mt-2 font-semibold tracking-[-0.03em] text-[var(--foreground)]", props.strong ? "text-3xl" : "text-2xl")}>
        {props.value}
      </div>
      {props.hint ? <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{props.hint}</div> : null}
    </div>
  );
}

export function ComposerMiniList(props: {
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", props.className)}>
      {props.items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
          <span className="text-[var(--muted)]">{item.label}</span>
          <span className="font-medium text-[var(--foreground)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ComposerWarningStack(props: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!props.children) return null;
  return <div className={cn("space-y-3", props.className)}>{props.children}</div>;
}

export function ComposerStickyActions(props: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-4 rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.96)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm",
        props.className,
      )}
    >
      {props.aside ? <div className="mb-3 text-sm leading-6 text-[var(--muted)]">{props.aside}</div> : null}
      <div className="flex flex-col gap-3">
        {props.primary}
        {props.secondary}
      </div>
    </div>
  );
}
