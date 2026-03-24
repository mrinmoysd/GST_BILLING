import * as React from "react";

import { cn } from "@/lib/utils";

export function DataTableShell(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]",
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
  return <thead {...props} className={cn("bg-[var(--surface-muted)] text-[var(--muted-strong)]", props.className)} />;
}

export function DataTh(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={cn("text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em]", props.className)} />;
}

export function DataTd(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn("px-4 py-3.5 align-top", props.className)} />;
}

export function DataTr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cn("border-t border-[var(--border)]", props.className)} />;
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
