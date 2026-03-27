import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type DetailTabItem = {
  id: string;
  label: string;
  badge?: React.ReactNode;
};

export function DetailTabs(props: {
  defaultValue: string;
  items: DetailTabItem[];
  children: React.ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <Tabs defaultValue={props.defaultValue} className={cn("space-y-5", props.className)}>
      <div className="sticky top-[5.75rem] z-20">
        <div className="rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.9)] p-2 shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <TabsList
            className={cn(
              "flex h-auto w-full flex-wrap justify-start gap-2 rounded-[18px] bg-transparent p-0 text-[var(--muted-strong)]",
              props.listClassName,
            )}
          >
            {props.items.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="inline-flex h-auto items-center gap-2 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium data-[state=active]:border-[var(--accent-soft)] data-[state=active]:bg-[rgba(180,104,44,0.1)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-none"
              >
                <span>{item.label}</span>
                {item.badge ? <span className="rounded-full bg-[rgba(23,32,51,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">{item.badge}</span> : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      {props.children}
    </Tabs>
  );
}

export function DetailTabPanel(props: {
  value: string;
  children: React.ReactNode;
  rail?: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContent value={props.value} className={cn("mt-0", props.className)}>
      <div className={cn("grid gap-6", props.rail ? "xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start" : "")}>
        <div className="min-w-0 space-y-6">{props.children}</div>
        {props.rail ? <div className="space-y-4 xl:sticky xl:top-[10.5rem]">{props.rail}</div> : null}
      </div>
    </TabsContent>
  );
}

export function DetailRail(props: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
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
      {props.eyebrow || props.title || props.subtitle ? (
        <div className="space-y-3">
          {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{props.eyebrow}</div> : null}
          {props.title ? <div className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.title}</div> : null}
          {props.subtitle ? <div className="text-sm leading-6 text-[var(--muted)]">{props.subtitle}</div> : null}
        </div>
      ) : null}
      <div className={cn(props.eyebrow || props.title || props.subtitle ? "mt-5 space-y-4" : "space-y-4")}>{props.children}</div>
      {props.footer ? <div className="mt-5 border-t border-[var(--border)] pt-4">{props.footer}</div> : null}
    </aside>
  );
}

export function DetailInfoList(props: {
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
