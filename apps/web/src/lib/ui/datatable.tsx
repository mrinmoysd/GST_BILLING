import * as React from "react";

import { cn } from "@/lib/utils";

export function DataTableShell(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-xl border border-neutral-200 bg-white overflow-hidden", props.className)}>{props.children}</div>;
}

export function DataTable(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} className={cn("w-full text-sm", props.className)} />;
}

export function DataThead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={cn("bg-neutral-50 text-neutral-600", props.className)} />;
}

export function DataTh(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={cn("text-left px-4 py-3 font-medium", props.className)} />;
}

export function DataTd(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn("px-4 py-3", props.className)} />;
}

export function DataTr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cn("border-t", props.className)} />;
}

export function DataEmptyRow(props: { colSpan: number; title: string; hint?: string }) {
  return (
    <tr className="border-t">
      <td colSpan={props.colSpan} className="px-4 py-6">
        <div className="font-medium">{props.title}</div>
        {props.hint ? <div className="mt-1 text-sm text-neutral-500">{props.hint}</div> : null}
      </td>
    </tr>
  );
}
