import * as React from "react";

import { cn } from "@/lib/utils";

type PageHeaderTone = "tenant" | "admin";
type PageHeaderSize = "compact" | "hero";

function getHeaderToneClasses(tone: PageHeaderTone) {
  if (tone === "admin") {
    return "border-[var(--border)] [background-image:var(--surface-header-admin)]";
  }

  return "border-[var(--border)] [background-image:var(--surface-header-tenant)]";
}

export function PageActionGroup(props: {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  children?: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const content = props.children ?? (
    <>
      {props.secondary}
      {props.primary}
    </>
  );

  if (!content) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        props.align === "start" ? "justify-start" : "justify-start md:justify-end",
        props.className,
      )}
    >
      {content}
    </div>
  );
}

export function PageContextStrip(props: {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel-glass)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--panel-highlight)] backdrop-blur-sm md:p-5",
        props.inset ? "mt-1" : "",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

export function PageHeader(props: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  badges?: React.ReactNode[];
  aside?: React.ReactNode;
  metrics?: Array<{ label: string; value: React.ReactNode }>;
  context?: React.ReactNode;
  tone?: PageHeaderTone;
  size?: PageHeaderSize;
  className?: string;
}) {
  const tone = props.tone ?? "tenant";
  const size = props.size ?? "compact";
  const hasAside = Boolean(props.aside);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[20px] border shadow-[var(--shadow-soft)]",
        getHeaderToneClasses(tone),
        size === "hero" ? "p-6 md:p-8" : "p-5 md:p-6",
        props.className,
      )}
    >
      <div className={cn("grid gap-6", hasAside ? "xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] xl:items-start" : "")}>
        <div className="space-y-5">
          <div className="space-y-3">
            {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div> : null}
            <h1
              className={cn(
                "font-display font-semibold tracking-[-0.045em] text-[var(--foreground)]",
                size === "hero" ? "max-w-4xl text-4xl leading-[0.94] md:text-5xl" : "max-w-3xl text-[1.9rem] leading-[1.02] md:text-[2.35rem]",
              )}
            >
              {props.title}
            </h1>
            {props.subtitle ? (
              <div className={cn("max-w-3xl text-sm text-[var(--muted-strong)]", size === "hero" ? "leading-7" : "leading-6")}>{props.subtitle}</div>
            ) : null}
          </div>

          {props.badges?.length ? <div className="flex flex-wrap gap-2">{props.badges.map((badge, index) => <React.Fragment key={index}>{badge}</React.Fragment>)}</div> : null}
          {props.actions ? <PageActionGroup>{props.actions}</PageActionGroup> : null}
        </div>

        {props.aside ? <div className="xl:justify-self-end xl:max-w-[440px]">{props.aside}</div> : null}
      </div>

      {props.context ? <div className="mt-6">{props.context}</div> : null}

      {props.metrics?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {props.metrics.map((metric) => (
            <div key={String(metric.label)} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{metric.label}</div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{metric.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
