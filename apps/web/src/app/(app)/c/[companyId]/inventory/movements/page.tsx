"use client";

import Link from "next/link";
import * as React from "react";

import { formatDateTimeLabel } from "@/lib/format/date";
import { useStockMovements, useWarehouses } from "@/lib/masters/hooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SelectField, TextField } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function InventoryMovementsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedMovementId, setSelectedMovementId] = React.useState("");
  const warehouses = useWarehouses({ companyId, activeOnly: true });
  const query = useStockMovements({ companyId, warehouseId: warehouseId || undefined, from: from || undefined, to: to || undefined, page: 1, limit: 50 });
  const rows = React.useMemo(() => query.data?.data.data ?? [], [query.data]);
  const counts = React.useMemo(() => {
    const inbound = rows.filter((row) => Number(row.changeQty ?? 0) > 0).length;
    const outbound = rows.filter((row) => Number(row.changeQty ?? 0) < 0).length;
    return { all: rows.length, inbound, outbound };
  }, [rows]);
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (segment === "inbound") return Number(row.changeQty ?? 0) > 0;
      if (segment === "outbound") return Number(row.changeQty ?? 0) < 0;
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedMovementId("");
      return;
    }
    if (!selectedMovementId || !filteredRows.some((row) => row.id === selectedMovementId)) {
      setSelectedMovementId(filteredRows[0]?.id ?? "");
    }
  }, [filteredRows, selectedMovementId]);

  const selectedRow = filteredRows.find((row) => row.id === selectedMovementId) ?? filteredRows[0] ?? null;

  const columns = React.useMemo<ColumnDef<(typeof filteredRows)[number]>[]>(
    () => [
      {
        id: "when",
        header: "When",
        accessorFn: (row) => row.createdAt,
        meta: { label: "When" },
        cell: ({ row }) => formatDateTimeLabel(row.original.createdAt),
      },
      {
        id: "product",
        header: "Product",
        accessorFn: (row) => row.product?.name ?? row.productId,
        meta: { label: "Product" },
        cell: ({ row }) => (
          <Link href={`/c/${companyId}/masters/products/${row.original.productId}`} className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]">
            {row.original.product?.name ?? row.original.productId.slice(0, 8)}
          </Link>
        ),
      },
      {
        id: "warehouse",
        header: "Warehouse",
        accessorFn: (row) => row.warehouse?.name ?? "Company",
        meta: { label: "Warehouse" },
        cell: ({ row }) => row.original.warehouse?.name ?? "Company",
      },
      {
        id: "change",
        header: "Change",
        accessorFn: (row) => Number(row.changeQty ?? 0),
        meta: { label: "Change", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.changeQty,
      },
      {
        id: "balance",
        header: "Balance",
        accessorFn: (row) => Number(row.balanceQty ?? 0),
        meta: { label: "Balance", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.balanceQty,
      },
      {
        id: "source",
        header: "Source",
        accessorFn: (row) => row.sourceType,
        meta: { label: "Source" },
        cell: ({ row }) => row.original.sourceType,
      },
      {
        id: "note",
        header: "Note",
        accessorFn: (row) => row.note ?? "",
        meta: { label: "Note" },
        cell: ({ row }) => row.original.note ?? "—",
      },
    ],
    [companyId],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Inventory"
        title="Stock movements"
        subtitle="Use one movement explorer for inbound, outbound, and warehouse-filtered stock history without dropping into raw ledger screens."
        badges={[
          <WorkspaceStatBadge key="all" label="Movements" value={rows.length} />,
          <WorkspaceStatBadge key="outbound" label="Outbound" value={counts.outbound} variant="outline" />,
        ]}
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All movement", count: counts.all },
          { id: "inbound", label: "Inbound", count: counts.inbound },
          { id: "outbound", label: "Outbound", count: counts.outbound },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full ledger" },
              { id: "outbound", label: "Stock depletion" },
              { id: "inbound", label: "Replenishment" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
            <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
            <SelectField
              label="Warehouse"
              value={warehouseId}
              onChange={setWarehouseId}
              options={[
                { value: "", label: "All warehouses" },
                ...((Array.isArray(warehouses.data?.data.data) ? warehouses.data.data.data : []).map((warehouse: { id: string; name: string }) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                }))),
              ]}
            />
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading stock movements…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load stock movements")} /> : null}
      {!query.isLoading && !query.isError && filteredRows.length === 0 ? <EmptyState title="No movements" hint="Try adjusting the date range." /> : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected movement"
              title={selectedRow?.product?.name ?? selectedRow?.productId?.slice?.(0, 8) ?? "Select movement"}
              subtitle="Keep the source and balance context beside the ledger instead of burying it in dense rows."
            >
              {selectedRow ? (
                <QueueMetaList
                  items={[
                    { label: "When", value: formatDateTimeLabel(selectedRow.createdAt) },
                    { label: "Warehouse", value: selectedRow.warehouse?.name ?? "Company" },
                    { label: "Change", value: selectedRow.changeQty },
                    { label: "Balance", value: selectedRow.balanceQty },
                    { label: "Source", value: selectedRow.sourceType },
                    { label: "Note", value: selectedRow.note ?? "—" },
                  ]}
                />
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a movement row to inspect the source and balance context.</div>
              )}
            </QueueInspector>
          }
        >
          <DataGrid
            data={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={(row) => setSelectedMovementId(row.id)}
            rowClassName={(row) =>
              selectedRow?.id === row.original.id
                ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                : "hover:bg-[var(--surface-secondary)]"
            }
            initialSorting={[{ id: "when", desc: true }]}
            toolbarTitle="Movement ledger"
            toolbarDescription="Sort and trim visible columns while keeping the selected inventory event and its balance context beside the ledger."
          />
        </QueueShell>
      ) : null}
    </div>
  );
}
