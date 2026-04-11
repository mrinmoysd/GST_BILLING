"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTimeLabel } from "@/lib/format/date";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { useInventoryAdjustment, useLowStock, useProducts, useStockMovements, useWarehouses } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

type MovementRow = {
  id: string;
  createdAt: string;
  productId: string;
  product?: { name?: string | null };
  warehouse?: { name?: string | null } | null;
  changeQty: string | number;
  balanceQty: string | number;
  sourceType: string;
  note?: string | null;
};

export default function InventoryAdjustmentsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const productsQuery = useProducts({ companyId, page: 1, limit: 100 });
  const lowStockQuery = useLowStock({ companyId, threshold: 0, page: 1, limit: 6 });
  const movementsQuery = useStockMovements({ companyId, page: 1, limit: 10 });
  const warehousesQuery = useWarehouses({ companyId, activeOnly: true });
  const adjust = useInventoryAdjustment({ companyId });

  const [productId, setProductId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [changeQty, setChangeQty] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedMovementId, setSelectedMovementId] = React.useState("");

  const productRows = React.useMemo(
    () => (productsQuery.data?.data ?? []) as Array<{ id: string; name: string; stock?: string | number | null }>,
    [productsQuery.data],
  );
  const lowStockRows = React.useMemo(
    () => (Array.isArray(lowStockQuery.data?.data) ? lowStockQuery.data.data : []),
    [lowStockQuery.data],
  );
  const movementRows = React.useMemo<MovementRow[]>(
    () => (movementsQuery.data?.data.data ?? []) as MovementRow[],
    [movementsQuery.data],
  );

  const counts = React.useMemo(() => {
    const inbound = movementRows.filter((row) => Number(row.changeQty ?? 0) > 0).length;
    const outbound = movementRows.filter((row) => Number(row.changeQty ?? 0) < 0).length;
    const manual = movementRows.filter((row) => String(row.sourceType ?? "").toUpperCase().includes("ADJUST")).length;
    return { all: movementRows.length, inbound, outbound, manual };
  }, [movementRows]);

  const filteredRows = React.useMemo(() => {
    return movementRows.filter((row) => {
      if (segment === "inbound") return Number(row.changeQty ?? 0) > 0;
      if (segment === "outbound") return Number(row.changeQty ?? 0) < 0;
      if (segment === "manual") return String(row.sourceType ?? "").toUpperCase().includes("ADJUST");
      return true;
    });
  }, [movementRows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedMovementId("");
      return;
    }
    if (!selectedMovementId || !filteredRows.some((row) => row.id === selectedMovementId)) {
      setSelectedMovementId(filteredRows[0]?.id ?? "");
    }
  }, [filteredRows, selectedMovementId]);

  const selectedMovement = filteredRows.find((row) => row.id === selectedMovementId) ?? filteredRows[0] ?? null;

  const columns = React.useMemo<ColumnDef<MovementRow>[]>(
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
    ],
    [companyId],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Inventory"
        title="Stock adjustments"
        subtitle="Apply manual stock corrections from a dedicated control point and keep the resulting inventory movements close to the adjustment workspace."
        badges={[
          <WorkspaceStatBadge key="low" label="Low-stock watch" value={lowStockRows.length} />,
          <WorkspaceStatBadge key="manual" label="Manual entries" value={counts.manual} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/inventory`}>
            <SecondaryButton type="button">Back to inventory</SecondaryButton>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <WorkspacePanel
          title="Apply adjustment"
          subtitle="Use positive quantities to add stock, negative quantities to reduce stock, and optionally scope the correction to a warehouse."
        >
          <div className="space-y-4">
            <SelectField
              label="Product"
              value={productId}
              onChange={setProductId}
              options={[
                { value: "", label: "Select…" },
                ...productRows.map((product) => ({
                  value: product.id,
                  label: `${product.name}${product.stock !== undefined && product.stock !== null ? ` (${product.stock})` : ""}`,
                })),
              ]}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="Warehouse"
                value={warehouseId}
                onChange={setWarehouseId}
                options={[
                  { value: "", label: "Company stock" },
                  ...((Array.isArray(warehousesQuery.data?.data.data) ? warehousesQuery.data.data.data : []).map((warehouse: { id: string; name: string }) => ({
                    value: warehouse.id,
                    label: warehouse.name,
                  }))),
                ]}
              />
              <TextField label="Change quantity" value={changeQty} onChange={setChangeQty} type="number" />
              <TextField label="Reason / note" value={note} onChange={setNote} placeholder="Optional" />
            </div>
            {error ? <InlineError message={error} /> : null}
            <PrimaryButton
              type="button"
              disabled={adjust.isPending}
              onClick={async () => {
                setError(null);
                const qty = Number(changeQty);
                if (!productId) return setError("Select a product.");
                if (!Number.isFinite(qty) || qty === 0) return setError("Enter a non-zero quantity.");
                try {
                  await adjust.mutateAsync({
                    productId,
                    changeQty: qty,
                    note: note || undefined,
                    warehouseId: warehouseId || undefined,
                  });
                  setChangeQty("");
                  setNote("");
                } catch (err: unknown) {
                  setError(getErrorMessage(err, "Failed to apply stock adjustment"));
                }
              }}
            >
              {adjust.isPending ? "Applying…" : "Apply adjustment"}
            </PrimaryButton>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Low-stock watch"
          subtitle="Keep a short reorder-pressure watchlist beside the adjustment desk so manual corrections are grounded in current stock posture."
        >
          <div className="space-y-3">
            {lowStockRows.length > 0 ? (
              lowStockRows.map((product) => (
                <Link
                  key={product.id}
                  href={`/c/${companyId}/masters/products/${product.id}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 transition hover:border-[var(--border-strong)]"
                >
                  <div className="font-medium text-[var(--foreground)]">{product.name}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">Stock {product.stock ?? "—"} | Reorder {product.reorderLevel ?? "—"}</div>
                </Link>
              ))
            ) : (
              <EmptyState title="No low-stock items" hint="Current stock levels are above reorder thresholds." className="p-6" />
            )}
          </div>
        </WorkspacePanel>
      </div>

      {productsQuery.isLoading || movementsQuery.isLoading ? <LoadingBlock label="Loading inventory workspace…" /> : null}
      {productsQuery.isError ? <InlineError message={getErrorMessage(productsQuery.error, "Failed to load products")} /> : null}
      {movementsQuery.isError ? <InlineError message={getErrorMessage(movementsQuery.error, "Failed to load movements")} /> : null}

      {filteredRows.length > 0 ? (
        <>
          <QueueSegmentBar
            items={[
              { id: "all", label: "All movement", count: counts.all },
              { id: "manual", label: "Manual adjustments", count: counts.manual },
              { id: "inbound", label: "Inbound", count: counts.inbound },
              { id: "outbound", label: "Outbound", count: counts.outbound },
            ]}
            value={segment}
            onValueChange={setSegment}
            trailing={
              <QueueSavedViews
                items={[
                  { id: "all", label: "Recent ledger" },
                  { id: "manual", label: "Adjustment trail" },
                  { id: "outbound", label: "Stock depletion" },
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
                <Badge variant="outline">{counts.manual} manual</Badge>
              </>
            }
          />

          <QueueShell
            inspector={
              <QueueInspector
                eyebrow="Selected movement"
                title={selectedMovement?.product?.name ?? selectedMovement?.productId?.slice?.(0, 8) ?? "Select movement"}
                subtitle="Keep movement source, balance context, and note history visible while you review recent stock adjustments."
                footer={
                  selectedMovement ? (
                    <QueueQuickActions>
                      <Link href={`/c/${companyId}/masters/products/${selectedMovement.productId}`}>
                        <SecondaryButton type="button">Open product</SecondaryButton>
                      </Link>
                    </QueueQuickActions>
                  ) : null
                }
              >
                {selectedMovement ? (
                  <QueueMetaList
                    items={[
                      { label: "When", value: formatDateTimeLabel(selectedMovement.createdAt) },
                      { label: "Warehouse", value: selectedMovement.warehouse?.name ?? "Company" },
                      { label: "Change", value: selectedMovement.changeQty },
                      { label: "Balance", value: selectedMovement.balanceQty },
                      { label: "Source", value: selectedMovement.sourceType },
                      { label: "Note", value: selectedMovement.note ?? "—" },
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
                selectedMovement?.id === row.original.id
                  ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                  : "hover:bg-[var(--surface-secondary)]"
              }
              initialSorting={[{ id: "when", desc: true }]}
              toolbarTitle="Recent stock movements"
              toolbarDescription="Review the latest inventory ledger while keeping the selected movement and its source context beside the table."
            />
          </QueueShell>
        </>
      ) : null}
    </div>
  );
}
