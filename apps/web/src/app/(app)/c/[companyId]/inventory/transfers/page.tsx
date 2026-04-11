"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import {
  useCancelStockTransfer,
  useCreateStockTransfer,
  useDispatchStockTransfer,
  useProducts,
  useReceiveStockTransfer,
  useStockTransfers,
  useWarehouses,
} from "@/lib/masters/hooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueRowStateBadge,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

type TransferLine = {
  id: string;
  productId: string;
  quantity: string;
};

type TransferRow = {
  id: string;
  transferNumber?: string | null;
  transfer_number?: string | null;
  status?: string | null;
  fromWarehouse?: { id?: string | null; name?: string | null } | null;
  toWarehouse?: { id?: string | null; name?: string | null } | null;
  items?: Array<{
    id: string;
    quantity: string | number;
    product?: { name?: string | null };
    batchAllocations?: Array<{
      quantity: string | number;
      productBatch?: { batchNumber?: string | null; batch_number?: string | null } | null;
    }>;
  }>;
};

export default function TransfersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const warehouses = useWarehouses({ companyId, activeOnly: true, limit: 100 });
  const products = useProducts({ companyId, limit: 100 });
  const transfers = useStockTransfers({ companyId, limit: 100 });
  const create = useCreateStockTransfer({ companyId });

  const [fromWarehouseId, setFromWarehouseId] = React.useState("");
  const [toWarehouseId, setToWarehouseId] = React.useState("");
  const [transferDate, setTransferDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedTransferId, setSelectedTransferId] = React.useState("");
  const [lines, setLines] = React.useState<TransferLine[]>([
    { id: "tr-1", productId: "", quantity: "1" },
  ]);

  const warehouseRows = React.useMemo(
    () => (Array.isArray(warehouses.data?.data) ? warehouses.data.data : []),
    [warehouses.data],
  );
  const productRows = React.useMemo(
    () => (Array.isArray(products.data?.data) ? products.data.data : []),
    [products.data],
  );
  const transferRows = React.useMemo<TransferRow[]>(
    () => (Array.isArray(transfers.data?.data) ? (transfers.data.data as TransferRow[]) : []),
    [transfers.data],
  );

  const counts = React.useMemo(() => {
    const requested = transferRows.filter((row) => String(row.status ?? "").toUpperCase() === "REQUESTED").length;
    const dispatched = transferRows.filter((row) => String(row.status ?? "").toUpperCase() === "DISPATCHED").length;
    const received = transferRows.filter((row) => String(row.status ?? "").toUpperCase() === "RECEIVED").length;
    const cancelled = transferRows.filter((row) => String(row.status ?? "").toUpperCase() === "CANCELLED").length;
    return { all: transferRows.length, requested, dispatched, received, cancelled };
  }, [transferRows]);

  const filteredRows = React.useMemo(() => {
    return transferRows.filter((row) => {
      const status = String(row.status ?? "").toUpperCase();
      if (segment === "requested") return status === "REQUESTED";
      if (segment === "dispatched") return status === "DISPATCHED";
      if (segment === "received") return status === "RECEIVED";
      if (segment === "cancelled") return status === "CANCELLED";
      return true;
    });
  }, [segment, transferRows]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedTransferId("");
      return;
    }
    if (!selectedTransferId || !filteredRows.some((row) => row.id === selectedTransferId)) {
      setSelectedTransferId(filteredRows[0]?.id ?? "");
    }
  }, [filteredRows, selectedTransferId]);

  const selectedTransfer = filteredRows.find((row) => row.id === selectedTransferId) ?? filteredRows[0] ?? null;

  const columns = React.useMemo<ColumnDef<TransferRow>[]>(
    () => [
      {
        id: "transfer",
        header: "Transfer",
        accessorFn: (transfer) => transfer.transferNumber ?? transfer.transfer_number ?? transfer.id,
        meta: { label: "Transfer" },
        cell: ({ row }) => (
          <div className="font-medium text-[var(--foreground)]">
            {row.original.transferNumber ?? row.original.transfer_number ?? row.original.id}
          </div>
        ),
      },
      {
        id: "route",
        header: "Route",
        accessorFn: (transfer) => `${transfer.fromWarehouse?.name ?? "—"} → ${transfer.toWarehouse?.name ?? "—"}`,
        meta: { label: "Route" },
        cell: ({ row }) => `${row.original.fromWarehouse?.name ?? "—"} → ${row.original.toWarehouse?.name ?? "—"}`,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (transfer) => transfer.status ?? "",
        meta: { label: "Status" },
        cell: ({ row }) => <QueueRowStateBadge label={row.original.status ?? "—"} />,
      },
      {
        id: "items",
        header: "Items",
        accessorFn: (transfer) => (transfer.items ?? []).length,
        meta: { label: "Items" },
        cell: ({ row }) => summarizeTransferItems(row.original),
      },
    ],
    [],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Inventory"
        title="Stock transfers"
        subtitle="Move stock between warehouses with a clear request, dispatch, and receive control loop instead of scattered warehouse actions."
        badges={[
          <WorkspaceStatBadge key="transfers" label="Transfers" value={transferRows.length} />,
          <WorkspaceStatBadge key="open" label="Open" value={counts.requested + counts.dispatched} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/inventory`}>
            <SecondaryButton type="button">Back to inventory</SecondaryButton>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <WorkspacePanel
          title="Create stock transfer"
          subtitle="Request movement between godowns while keeping source, destination, and item quantity visible in one transfer composer."
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="From warehouse"
                value={fromWarehouseId}
                onChange={setFromWarehouseId}
                options={[
                  { value: "", label: "Select…" },
                  ...warehouseRows.map((warehouse: { id: string; name: string }) => ({
                    value: warehouse.id,
                    label: warehouse.name,
                  })),
                ]}
              />
              <SelectField
                label="To warehouse"
                value={toWarehouseId}
                onChange={setToWarehouseId}
                options={[
                  { value: "", label: "Select…" },
                  ...warehouseRows.map((warehouse: { id: string; name: string }) => ({
                    value: warehouse.id,
                    label: warehouse.name,
                  })),
                ]}
              />
            </div>
            <DateField label="Transfer date" value={transferDate} onChange={setTransferDate} />
            <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={line.id} className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[1fr_160px_110px]">
                  <SelectField
                    label={`Product ${index + 1}`}
                    value={line.productId}
                    onChange={(value) =>
                      setLines((prev) =>
                        prev.map((current) =>
                          current.id === line.id ? { ...current, productId: value } : current,
                        ),
                      )
                    }
                    options={[
                      { value: "", label: "Select…" },
                      ...productRows.map((product) => ({
                        value: product.id,
                        label: product.name,
                      })),
                    ]}
                  />
                  <TextField
                    label="Quantity"
                    value={line.quantity}
                    onChange={(value) =>
                      setLines((prev) =>
                        prev.map((current) =>
                          current.id === line.id ? { ...current, quantity: value } : current,
                        ),
                      )
                    }
                  />
                  <div className="flex items-end">
                    <SecondaryButton
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => setLines((prev) => prev.filter((current) => current.id !== line.id))}
                    >
                      Remove
                    </SecondaryButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <SecondaryButton
                type="button"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    { id: `tr-${prev.length + 1}-${Date.now()}`, productId: "", quantity: "1" },
                  ])
                }
              >
                Add line
              </SecondaryButton>
              <PrimaryButton
                type="button"
                disabled={create.isPending}
                onClick={async () => {
                  setError(null);
                  if (!fromWarehouseId) return setError("Select source warehouse.");
                  if (!toWarehouseId) return setError("Select destination warehouse.");
                  if (fromWarehouseId === toWarehouseId) return setError("Source and destination must be different.");

                  const clean = lines
                    .map((line) => ({ product_id: line.productId, quantity: line.quantity }))
                    .filter((line) => line.product_id);

                  if (clean.length === 0) return setError("Add at least one transfer line.");

                  try {
                    await create.mutateAsync({
                      from_warehouse_id: fromWarehouseId,
                      to_warehouse_id: toWarehouseId,
                      transfer_date: transferDate || undefined,
                      notes: notes || undefined,
                      items: clean,
                    });
                    toastSuccess("Transfer created.");
                    setFromWarehouseId("");
                    setToWarehouseId("");
                    setTransferDate("");
                    setNotes("");
                    setLines([{ id: "tr-1", productId: "", quantity: "1" }]);
                  } catch (err: unknown) {
                    const message = getErrorMessage(err, "Failed to create transfer.");
                    setError(message);
                    toastError(err, {
                      fallback: "Failed to create transfer.",
                      title: message,
                      context: "inventory-transfer-create",
                      metadata: { companyId, fromWarehouseId, toWarehouseId },
                    });
                  }
                }}
              >
                {create.isPending ? "Creating…" : "Create transfer"}
              </PrimaryButton>
            </div>
            {error ? <InlineError message={error} /> : null}
          </div>
        </WorkspacePanel>

        <div className="space-y-6">
          <QueueSegmentBar
            items={[
              { id: "all", label: "All transfers", count: counts.all },
              { id: "requested", label: "Requested", count: counts.requested },
              { id: "dispatched", label: "Dispatched", count: counts.dispatched },
              { id: "received", label: "Received", count: counts.received },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
            ]}
            value={segment}
            onValueChange={setSegment}
            trailing={
              <QueueSavedViews
                items={[
                  { id: "all", label: "Full queue" },
                  { id: "requested", label: "Ready to dispatch" },
                  { id: "dispatched", label: "Receiving desk" },
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
            filters={<></>}
            summary={
              <>
                <Badge variant="secondary">{filteredRows.length} in view</Badge>
                <Badge variant="outline">{counts.dispatched} dispatched</Badge>
              </>
            }
          />

          {transfers.isLoading ? <LoadingBlock label="Loading transfers…" /> : null}
          {transfers.isError ? <InlineError message={getErrorMessage(transfers.error, "Failed to load transfers")} /> : null}
          {!transfers.isLoading && !transfers.isError && filteredRows.length === 0 ? (
            <EmptyState title="No transfers" hint="Create the first stock transfer to start warehouse movement control." />
          ) : null}

          {filteredRows.length > 0 ? (
            <QueueShell
              inspector={
                <QueueInspector
                  eyebrow="Selected transfer"
                  title={selectedTransfer ? (selectedTransfer.transferNumber ?? selectedTransfer.transfer_number ?? selectedTransfer.id) : "Select transfer"}
                  subtitle="Keep route, item scope, and movement action state visible beside the transfer queue."
                  footer={
                    selectedTransfer ? (
                      <QueueQuickActions>
                        <TransferActionBar companyId={companyId} transfer={selectedTransfer} />
                      </QueueQuickActions>
                    ) : null
                  }
                >
                  {selectedTransfer ? (
                    <>
                      <QueueQuickActions>
                        <QueueRowStateBadge label={selectedTransfer.status ?? "—"} />
                        <Badge variant="outline">
                          {(selectedTransfer.fromWarehouse?.name ?? "—") + " → " + (selectedTransfer.toWarehouse?.name ?? "—")}
                        </Badge>
                      </QueueQuickActions>
                      <QueueMetaList
                        items={[
                          { label: "From", value: selectedTransfer.fromWarehouse?.name ?? "—" },
                          { label: "To", value: selectedTransfer.toWarehouse?.name ?? "—" },
                          { label: "Items", value: (selectedTransfer.items ?? []).length },
                          { label: "Summary", value: summarizeTransferItems(selectedTransfer) },
                        ]}
                      />
                    </>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">Select a transfer to inspect route, movement scope, and next action.</div>
                  )}
                </QueueInspector>
              }
            >
              <DataGrid
                data={filteredRows}
                columns={columns}
                getRowId={(row) => row.id}
                onRowClick={(row) => setSelectedTransferId(row.id)}
                rowClassName={(row) =>
                  selectedTransfer?.id === row.original.id
                    ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                    : "hover:bg-[var(--surface-secondary)]"
                }
                initialSorting={[{ id: "transfer", desc: true }]}
                toolbarTitle="Transfer queue"
                toolbarDescription="Sort and trim visible columns while keeping the selected route and its next action beside the queue."
              />
            </QueueShell>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function summarizeTransferItems(transfer: TransferRow) {
  return (
    transfer.items
      ?.map((item) => {
        const batchSummary =
          item.batchAllocations && item.batchAllocations.length > 0
            ? ` (${item.batchAllocations
                .map(
                  (allocation) =>
                    `${allocation.productBatch?.batchNumber ?? allocation.productBatch?.batch_number ?? "Batch"} × ${allocation.quantity}`,
                )
                .join(", ")})`
            : "";
        return `${item.product?.name ?? "Item"} × ${item.quantity}${batchSummary}`;
      })
      .join(", ") ?? "—"
  );
}

function TransferActionBar(props: { companyId: string; transfer: TransferRow }) {
  const transferId = props.transfer.id;
  const dispatch = useDispatchStockTransfer({ companyId: props.companyId, transferId });
  const receive = useReceiveStockTransfer({ companyId: props.companyId, transferId });
  const cancel = useCancelStockTransfer({ companyId: props.companyId, transferId });
  const status = String(props.transfer.status ?? "requested").toLowerCase();

  return (
    <>
      {status === "requested" ? (
        <>
          <SecondaryButton
            type="button"
            disabled={dispatch.isPending}
            onClick={async () => {
              await dispatch.mutateAsync();
              toastSuccess("Transfer dispatched.");
            }}
          >
            {dispatch.isPending ? "Dispatching…" : "Dispatch"}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={cancel.isPending}
            onClick={async () => {
              await cancel.mutateAsync();
              toastSuccess("Transfer cancelled.");
            }}
          >
            {cancel.isPending ? "Cancelling…" : "Cancel"}
          </SecondaryButton>
        </>
      ) : null}
      {status === "dispatched" ? (
        <PrimaryButton
          type="button"
          disabled={receive.isPending}
          onClick={async () => {
            await receive.mutateAsync();
            toastSuccess("Transfer received.");
          }}
        >
          {receive.isPending ? "Receiving…" : "Receive"}
        </PrimaryButton>
      ) : null}
    </>
  );
}
