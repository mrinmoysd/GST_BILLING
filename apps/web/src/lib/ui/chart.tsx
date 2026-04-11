"use client";

import * as React from "react";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ResponsiveContainer, Tooltip } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { WorkspacePanel } from "@/lib/ui/workspace";
import { cn } from "@/lib/utils";

export type ChartSeriesTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "accent";

const seriesToneColorMap: Record<ChartSeriesTone, string> = {
  primary: "var(--accent)",
  secondary: "var(--secondary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--muted)",
  accent: "#6d28d9",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function getChartSeriesColor(tone: ChartSeriesTone = "primary") {
  return seriesToneColorMap[tone];
}

export function formatChartCurrency(value: number | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatChartNumber(value: number | null | undefined) {
  return numberFormatter.format(Number(value ?? 0));
}

export function formatChartCompactNumber(value: number | null | undefined) {
  return compactNumberFormatter.format(Number(value ?? 0));
}

export function formatChartPercent(value: number | null | undefined) {
  return percentFormatter.format(Number(value ?? 0));
}

export function formatChartDateTick(value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", options ?? { day: "2-digit", month: "short" }).format(date);
}

export function formatChartMonthTick(value: string | number | Date | null | undefined) {
  return formatChartDateTick(value, { month: "short", year: "2-digit" });
}

export function getChartGridColor() {
  return "color-mix(in oklab, var(--border) 74%, transparent)";
}

export function getChartAxisColor() {
  return "var(--muted)";
}

export function getChartCursorColor() {
  return "color-mix(in oklab, var(--accent) 14%, transparent)";
}

export function ChartShell(props: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <WorkspacePanel
      title={props.title}
      subtitle={props.subtitle}
      className={cn("overflow-hidden", props.className)}
    >
      {props.actions ? <div className="mb-4 flex flex-wrap items-center justify-end gap-2">{props.actions}</div> : null}
      {props.children}
      {props.footer ? <div className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">{props.footer}</div> : null}
    </WorkspacePanel>
  );
}

export function ChartFrame(props: {
  children: React.ReactNode;
  height?: number;
  className?: string;
}) {
  const areaRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = areaRef.current;
    if (!element) return;

    const measure = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = element.clientHeight;
      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) return current;
        return { width: nextWidth, height: nextHeight };
      });
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={cn(
        "min-h-0 min-w-0 w-full rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)]",
        props.className,
      )}
      style={{ height: props.height ?? 320 }}
    >
      <div ref={areaRef} className="h-full min-h-0 min-w-0 w-full">
        {size.width > 0 && size.height > 0 ? (
          <ResponsiveContainer width={size.width} height={size.height}>
            {props.children as React.ReactElement}
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}

export function ChartLoadingState(props: { title?: string; subtitle?: string; className?: string }) {
  return (
    <ChartShell title={props.title ?? "Loading chart"} subtitle={props.subtitle} className={props.className}>
      <div className="space-y-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-[220px] w-full" />
      </div>
    </ChartShell>
  );
}

export function ChartEmptyState(props: {
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <ChartShell title={props.title} className={props.className}>
      <div className="flex h-[280px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] px-6 text-center shadow-[var(--shadow-soft)]">
        <div className="text-base font-semibold tracking-[-0.02em] text-[var(--foreground)]">{props.title}</div>
        {props.hint ? <div className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">{props.hint}</div> : null}
      </div>
    </ChartShell>
  );
}

export function ChartLegend(props: {
  items: Array<{ label: string; tone?: ChartSeriesTone; value?: React.ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm", props.className)}>
      {props.items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 text-[var(--muted-strong)]">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: getChartSeriesColor(item.tone ?? "primary") }}
            aria-hidden="true"
          />
          <span>{item.label}</span>
          {item.value ? <span className="font-medium text-[var(--foreground)]">{item.value}</span> : null}
        </div>
      ))}
    </div>
  );
}

type TooltipValueFormatter = (value: number) => string;

function defaultTooltipFormatter(value: ValueType | undefined) {
  if (typeof value === "number") return formatChartNumber(value);
  return String(value ?? "—");
}

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string | number;
    name?: string | number;
    value?: ValueType;
  }>;
  label?: NameType;
  valueFormatter?: TooltipValueFormatter;
  labelFormatter?: (label: NameType) => React.ReactNode;
};

function ChartTooltipContent(props: ChartTooltipContentProps) {
  const { active, payload, label, valueFormatter, labelFormatter } = props;

  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 shadow-[var(--shadow-overlay)]">
      {label !== undefined ? (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {labelFormatter ? labelFormatter(label) : String(label)}
        </div>
      ) : null}
      <div className="space-y-2">
        {payload.map((entry) => {
          const raw = entry.value;
          const numeric = typeof raw === "number" ? raw : Number(raw ?? 0);
          return (
            <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 text-[var(--muted-strong)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? "var(--accent)" }} aria-hidden="true" />
                <span>{String(entry.name ?? entry.dataKey ?? "Series")}</span>
              </div>
              <span className="font-semibold text-[var(--foreground)]">
                {valueFormatter ? valueFormatter(numeric) : defaultTooltipFormatter(raw)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartTooltip(props: {
  valueFormatter?: TooltipValueFormatter;
  labelFormatter?: (label: NameType) => React.ReactNode;
}) {
  return (
    <Tooltip
      cursor={{ fill: getChartCursorColor() }}
      content={<ChartTooltipContent valueFormatter={props.valueFormatter} labelFormatter={props.labelFormatter} />}
    />
  );
}
