"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";

export type DataGridColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

type DataGridProps<TData> = {
  data: TData[];
  columns: Array<ColumnDef<TData, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: Row<TData>) => string | undefined;
  initialSorting?: SortingState;
  emptyTitle?: string;
  emptyHint?: string;
  toolbarTitle?: React.ReactNode;
  toolbarDescription?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  className?: string;
};

export function DataGrid<TData>(props: DataGridProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(props.initialSorting ?? []);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    state: {
      sorting,
      columnVisibility,
    },
    getRowId: props.getRowId,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const visibleColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());

  return (
    <DataTableShell className={props.className}>
      {(props.toolbarTitle || props.toolbarDescription || props.toolbarActions || visibleColumns.length > 0) ? (
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {props.toolbarTitle ? <div className="text-sm font-semibold text-[var(--foreground)]">{props.toolbarTitle}</div> : null}
            {props.toolbarDescription ? <div className="text-sm text-[var(--muted)]">{props.toolbarDescription}</div> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {props.toolbarActions}
            {visibleColumns.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {visibleColumns.map((column) => {
                    const header = column.columnDef.header;
                    const label =
                      typeof header === "string"
                        ? header
                        : typeof column.columnDef.meta === "object" && column.columnDef.meta && "label" in column.columnDef.meta
                          ? String((column.columnDef.meta as { label?: string }).label ?? column.id)
                          : column.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      ) : null}

      <DataTable>
        <DataThead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = (header.column.columnDef.meta as DataGridColumnMeta | undefined) ?? undefined;
                const canSort = header.column.getCanSort();
                const sortState = header.column.getIsSorted();

                return (
                  <DataTh
                    key={header.id}
                    className={cn(meta?.headerClassName)}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-inherit"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {sortState === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : null}
                        {sortState === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </DataTh>
                );
              })}
            </tr>
          ))}
        </DataThead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <DataEmptyRow colSpan={table.getAllLeafColumns().length} title={props.emptyTitle ?? "No rows"} hint={props.emptyHint} />
          ) : (
            table.getRowModel().rows.map((row) => (
              <DataTr
                key={row.id}
                className={cn(
                  props.onRowClick ? "cursor-pointer" : "",
                  props.rowClassName?.(row),
                )}
                onClick={() => props.onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = (cell.column.columnDef.meta as DataGridColumnMeta | undefined) ?? undefined;
                  return (
                    <DataTd key={cell.id} className={cn(meta?.cellClassName)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </DataTd>
                  );
                })}
              </DataTr>
            ))
          )}
        </tbody>
      </DataTable>
    </DataTableShell>
  );
}

export type { ColumnDef };
