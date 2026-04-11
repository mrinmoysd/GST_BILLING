"use client";

import Link from "next/link";
import * as React from "react";

import { useDispatchQueue } from "@/lib/billing/hooks";
import type { DispatchQueueRow } from "@/lib/billing/types";
import { formatDateLabel } from "@/lib/format/date";
import { useWarehouses } from "@/lib/masters/hooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function DispatchQueuePage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const queue = useDispatchQueue({
    companyId,
    q: q || undefined,
    warehouse_id: warehouseId || undefined,
  });
  const warehouses = useWarehouses({ companyId, activeOnly: true });
  const rows = React.useMemo(() => {
    const payload = queue.data?.data as unknown;
    if (Array.isArray(payload)) return payload as DispatchQueueRow[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
      return (payload as { data: DispatchQueueRow[] }).data;
    }
    return [];
  }, [queue.data?.data]);
  const warehouseRows = React.useMemo(() => {
    const payload = warehouses.data?.data as unknown;
    if (Array.isArray(payload)) {
      return payload as Array<{ id: string; name?: string; code?: string }>;
    }
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
      return (payload as { data: Array<{ id: string; name?: string; code?: string }> }).data;
    }
    return [];
  }, [warehouses.data?.data]);

  const pendingTotal = rows.reduce(
    (sum, row) => sum + Number(row.pending_dispatch_quantity ?? 0),
    0,
  );
  const today = new Date().toISOString().slice(0, 10);

  const counts = React.useMemo(() => {
    const due = rows.filter((row) => String(row.expected_dispatch_date ?? "") === today).length;
    const overdue = rows.filter((row) => {
      const date = String(row.expected_dispatch_date ?? "");
      return date !== "" && date < today;
    }).length;
    const heavy = rows.filter((row) => Number(row.pending_dispatch_quantity ?? 0) >= 10).length;
    return { all: rows.length, due, overdue, heavy };
  }, [rows, today]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const dispatchDate = String(row.expected_dispatch_date ?? "");
      if (segment === "due") return dispatchDate === today;
      if (segment === "overdue") return dispatchDate !== "" && dispatchDate < today;
      if (segment === "heavy") return Number(row.pending_dispatch_quantity ?? 0) >= 10;
      return true;
    });
  }, [rows, segment, today]);

  const columns = React.useMemo<ColumnDef<DispatchQueueRow>[]>(
    () => [
      {
        id: "order",
        header: "Order",
        accessorFn: (row) => String(row.order_number ?? row.sales_order_id ?? ""),
        meta: { label: "Order" },
        cell: ({ row }) => String(row.original.order_number ?? row.original.sales_order_id),
      },
      {
        id: "customer",
        header: "Customer",
        accessorFn: (row) => String((row.customer as { name?: string } | undefined)?.name ?? ""),
        meta: { label: "Customer" },
        cell: ({ row }) => String((row.original.customer as { name?: string } | undefined)?.name ?? "—"),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => String(row.status ?? ""),
        meta: { label: "Status" },
        cell: ({ row }) => <QueueRowStateBadge label={String(row.original.status ?? "—")} />,
      },
      {
        id: "expectedDispatch",
        header: "Expected dispatch",
        accessorFn: (row) => String(row.expected_dispatch_date ?? ""),
        meta: { label: "Expected dispatch" },
        cell: ({ row }) => formatDateLabel(String(row.original.expected_dispatch_date ?? "")),
      },
      {
        id: "pendingQuantity",
        header: "Pending qty",
        accessorFn: (row) => Number(row.pending_dispatch_quantity ?? 0),
        meta: { label: "Pending qty", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => Number(row.original.pending_dispatch_quantity ?? 0).toFixed(2),
      },
      {
        id: "nextStep",
        header: "Next step",
        accessorFn: (row) => String(row.sales_order_id),
        meta: { label: "Next step" },
        cell: ({ row }) => (
          <Link
            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-1.5 text-sm font-medium text-[var(--secondary)] transition hover:border-[var(--secondary)]/30 hover:bg-[var(--surface-secondary)]"
            href={`/c/${companyId}/sales/orders/${row.original.sales_order_id}`}
            onClick={(event) => event.stopPropagation()}
          >
            Create challan
          </Link>
        ),
      },
    ],
    [companyId],
  );

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !filteredRows.some((row) => row.sales_order_id === selectedOrderId)) {
      setSelectedOrderId(filteredRows[0]?.sales_order_id ?? null);
    }
  }, [filteredRows, selectedOrderId]);

  const selectedRow = filteredRows.find((row) => row.sales_order_id === selectedOrderId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Dispatch operations"
        title="Dispatch queue"
        subtitle="Focus warehouse attention on confirmed order demand that still needs challan creation or staged movement."
        badges={[
          <WorkspaceStatBadge key="orders" label="Orders" value={rows.length} />,
          <WorkspaceStatBadge key="pending" label="Pending qty" value={pendingTotal.toFixed(2)} variant="outline" />,
        ]}
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All orders", count: counts.all },
          { id: "due", label: "Due today", count: counts.due },
          { id: "overdue", label: "Overdue", count: counts.overdue },
          { id: "heavy", label: "Large qty", count: counts.heavy },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full queue" },
              { id: "due", label: "Today focus" },
              { id: "overdue", label: "Late recovery" },
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
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Search orders" value={q} onChange={setQ} placeholder="Order number / customer" />
            <SelectField
              label="Warehouse filter"
              value={warehouseId}
              onChange={setWarehouseId}
              options={[
                { value: "", label: "All warehouses" },
                ...warehouseRows.map((warehouse) => ({
                  value: warehouse.id,
                  label: `${warehouse.name ?? warehouse.id}${warehouse.code ? ` • ${warehouse.code}` : ""}`,
                })),
              ]}
            />
          </div>
        }
        summary={
          <>
            <QueueRowStateBadge label={`${filteredRows.length} orders`} />
            <QueueRowStateBadge label={`${pendingTotal.toFixed(2)} qty pending`} variant="outline" />
          </>
        }
      />

      {queue.isLoading ? <LoadingBlock label="Loading dispatch queue…" /> : null}
      {queue.isError ? <InlineError message={getErrorMessage(queue.error, "Failed to load dispatch queue")} /> : null}

      {!queue.isLoading && !queue.isError && filteredRows.length === 0 ? (
        <EmptyState title="No dispatch work right now" hint="Confirmed orders with remaining dispatch quantity will show up here." />
      ) : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Dispatch inspector"
              title={selectedRow?.order_number ?? selectedRow?.sales_order_id ?? "Select order"}
              subtitle="Review the customer, dispatch date, and quantity pressure before you jump into challan creation."
              footer={
                selectedRow ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/sales/orders/${selectedRow.sales_order_id}`}>
                      <QueueRowActionButton label="Open order" />
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedRow ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={selectedRow.status ?? "—"} />
                    <QueueRowStateBadge label={selectedRow.latest_challan_status ?? "No challan"} variant="outline" />
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "Customer", value: selectedRow.customer?.name ?? "—" },
                      { label: "Expected dispatch", value: formatDateLabel(selectedRow.expected_dispatch_date) },
                      { label: "Pending quantity", value: Number(selectedRow.pending_dispatch_quantity ?? 0).toFixed(2) },
                      { label: "Challans", value: selectedRow.challans_count ?? 0 },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Pick an order from the queue to inspect dispatch pressure and move into challan creation.</div>
              )}
            </QueueInspector>
          }
        >
          <DataGrid
            data={filteredRows}
            columns={columns}
            getRowId={(row) => String(row.sales_order_id)}
            onRowClick={(row) => setSelectedOrderId(String(row.sales_order_id))}
            rowClassName={(row) =>
              selectedRow?.sales_order_id === row.original.sales_order_id
                ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                : "hover:bg-[var(--surface-secondary)]"
            }
            initialSorting={[{ id: "expectedDispatch", desc: false }]}
            toolbarTitle="Dispatch queue"
            toolbarDescription="Sort and trim the queue while keeping the dispatch inspector and warehouse filter in view."
          />
        </QueueShell>
      ) : null}
    </div>
  );
}

function QueueRowActionButton(props: { label: string }) {
  return <div className="inline-flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-3 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]">{props.label}</div>;
}
