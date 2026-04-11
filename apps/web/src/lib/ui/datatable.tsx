import * as React from "react";

import { cn } from "@/lib/utils";

export function DataTableShell(props: {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]",
        props.dense ? "rounded-[16px]" : "",
        props.className,
      )}
    >
      <div className="overflow-x-auto">
        {props.children}
      </div>
    </div>
  );
}

export function DataTable(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} className={cn("min-w-full text-sm", props.className)} />;
}

export function DataThead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={cn("sticky top-0 z-[1] [background-image:var(--table-header-highlight)] text-[var(--muted-strong)]", props.className)} />;
}

export function DataTh(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={cn("text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]", props.className)} />;
}

export function DataTd(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn("px-4 py-3.5 align-top first:pl-5 last:pr-5", props.className)} />;
}

export function DataTr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cn("border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-muted)]/70", props.className)} />;
}

export function DataEmptyRow(props: { colSpan: number; title: string; hint?: string }) {
  return (
    <tr className="border-t">
      <td colSpan={props.colSpan} className="px-4 py-6">
        <div className="font-semibold text-[var(--foreground)]">{props.title}</div>
        {props.hint ? <div className="mt-1 text-sm text-[var(--muted)]">{props.hint}</div> : null}
      </td>
    </tr>
  );
}

export function DataTableToolbar(props: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  if (!props.title && !props.description && !props.actions) return null;

  return (
    <div className={cn("flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between", props.className)}>
      <div className="space-y-1">
        {props.title ? <div className="text-sm font-semibold text-[var(--foreground)]">{props.title}</div> : null}
        {props.description ? <div className="text-sm text-[var(--muted)]">{props.description}</div> : null}
      </div>
      {props.actions ? <div className="flex flex-wrap items-center gap-2">{props.actions}</div> : null}
    </div>
  );
}
