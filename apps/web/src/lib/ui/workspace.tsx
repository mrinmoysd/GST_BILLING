import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function WorkspaceHero(props: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  badges?: React.ReactNode[];
  aside?: React.ReactNode;
  tone?: "tenant" | "admin";
}) {
  const admin = props.tone === "admin";

  return (
    <section
      className={cn(
        "grid gap-6 overflow-hidden rounded-[32px] border p-6 shadow-[var(--shadow-soft)] md:p-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-end",
        admin
          ? "border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,246,249,0.96))]"
          : "border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))]",
      )}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div> : null}
          <h1 className="max-w-4xl font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)] md:text-5xl">
            {props.title}
          </h1>
          {props.subtitle ? <div className="max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">{props.subtitle}</div> : null}
        </div>
        {props.badges?.length ? <div className="flex flex-wrap gap-2">{props.badges.map((badge, index) => <React.Fragment key={index}>{badge}</React.Fragment>)}</div> : null}
        {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
      </div>
      {props.aside ? <div className="xl:justify-self-end xl:max-w-[440px]">{props.aside}</div> : null}
    </section>
  );
}

export function WorkspaceSection(props: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", props.className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{props.eyebrow}</div> : null}
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.title}</h2>
          {props.subtitle ? <div className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{props.subtitle}</div> : null}
        </div>
        {props.actions ? <div className="shrink-0">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}

export function WorkspacePanel(props: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "muted" | "strong";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border p-5 shadow-[var(--shadow-soft)] md:p-6",
        props.tone === "strong"
          ? "border-[rgba(23,32,51,0.08)] bg-[rgba(23,32,51,0.96)] text-white"
          : props.tone === "muted"
            ? "border-[rgba(23,32,51,0.08)] bg-[rgba(248,246,242,0.92)]"
            : "border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.9)]",
        props.className,
      )}
    >
      {props.title || props.subtitle ? (
        <div className="mb-4 space-y-1.5">
          {props.title ? (
            <div className={cn("text-lg font-semibold tracking-[-0.02em]", props.tone === "strong" ? "text-white" : "text-[var(--foreground)]")}>
              {props.title}
            </div>
          ) : null}
          {props.subtitle ? (
            <div className={cn("text-sm leading-6", props.tone === "strong" ? "text-white/72" : "text-[var(--muted)]")}>
              {props.subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
      {props.children}
    </section>
  );
}

export function WorkspaceStatBadge(props: { label: string; value: React.ReactNode; variant?: "secondary" | "outline" }) {
  return (
    <Badge variant={props.variant ?? "secondary"}>
      {props.label}: {props.value}
    </Badge>
  );
}

export function WorkspaceFilterBar(props: {
  children: React.ReactNode;
  summary?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-[28px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.9)] p-5 shadow-[var(--shadow-soft)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end",
        props.className,
      )}
    >
      <div className="grid gap-4">{props.children}</div>
      {props.summary ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{props.summary}</div> : null}
    </section>
  );
}

export function WorkspaceDetailHero(props: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode[];
  actions?: React.ReactNode;
  metrics?: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <section className="space-y-4 rounded-[32px] border border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))] p-6 shadow-[var(--shadow-soft)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div> : null}
          <h1 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)] md:text-5xl">{props.title}</h1>
          {props.subtitle ? <div className="max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">{props.subtitle}</div> : null}
          {props.badges?.length ? <div className="flex flex-wrap gap-2">{props.badges.map((badge, index) => <React.Fragment key={index}>{badge}</React.Fragment>)}</div> : null}
        </div>
        {props.actions ? <div className="shrink-0">{props.actions}</div> : null}
      </div>
      {props.metrics?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {props.metrics.map((metric) => (
            <div key={String(metric.label)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{metric.label}</div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{metric.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function WorkspaceConfigHero(props: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode[];
  aside?: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[32px] border border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,242,0.94))] p-6 shadow-[var(--shadow-soft)] md:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
      <div className="space-y-4">
        {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div> : null}
        <h1 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)] md:text-5xl">{props.title}</h1>
        {props.subtitle ? <div className="max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">{props.subtitle}</div> : null}
        {props.badges?.length ? <div className="flex flex-wrap gap-2">{props.badges.map((badge, index) => <React.Fragment key={index}>{badge}</React.Fragment>)}</div> : null}
      </div>
      {props.aside ? <div>{props.aside}</div> : null}
    </section>
  );
}
