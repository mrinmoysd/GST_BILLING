import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/lib/ui/page-header";
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
    <PageHeader
      eyebrow={props.eyebrow}
      title={props.title}
      subtitle={props.subtitle}
      actions={props.actions}
      badges={props.badges}
      aside={props.aside}
      tone={admin ? "admin" : "tenant"}
      size="hero"
    />
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
    <PageHeader
      eyebrow={props.eyebrow}
      title={props.title}
      subtitle={props.subtitle}
      badges={props.badges}
      actions={props.actions}
      metrics={props.metrics}
      size="hero"
    />
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
    <PageHeader
      eyebrow={props.eyebrow}
      title={props.title}
      subtitle={props.subtitle}
      badges={props.badges}
      aside={props.aside}
      size="hero"
    />
  );
}
