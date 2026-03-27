"use client";

import Link from "next/link";
import * as React from "react";

import { useBatchStock, useWarehouses } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function InventoryBatchesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [warehouseId, setWarehouseId] = React.useState("");
  const [nearExpiryDays, setNearExpiryDays] = React.useState("30");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedKey, setSelectedKey] = React.useState("");
  const [referenceNow] = React.useState(() => Date.now());

  const warehouses = useWarehouses({ companyId, activeOnly: true, limit: 100 });
  const query = useBatchStock({
    companyId,
    warehouseId: warehouseId || undefined,
    nearExpiryDays: nearExpiryDays ? Number(nearExpiryDays) : undefined,
    page: 1,
    limit: 100,
  });

  const rows = React.useMemo(() => query.data?.data.data ?? [], [query.data]);
  const counts = React.useMemo(() => {
    const nearExpiry = rows.filter((row) => {
      const expiry = row.productBatch?.expiryDate ?? row.productBatch?.expiry_date;
      if (!expiry) return false;
      const diff = Math.ceil((new Date(expiry).getTime() - referenceNow) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= Number(nearExpiryDays || 30);
    }).length;
    const expired = rows.filter((row) => {
      const expiry = row.productBatch?.expiryDate ?? row.productBatch?.expiry_date;
      return expiry ? new Date(expiry).getTime() < referenceNow : false;
    }).length;
    return { all: rows.length, nearExpiry, expired };
  }, [nearExpiryDays, referenceNow, rows]);
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const expiry = row.productBatch?.expiryDate ?? row.productBatch?.expiry_date;
      const diff = expiry ? Math.ceil((new Date(expiry).getTime() - referenceNow) / (1000 * 60 * 60 * 24)) : null;
      if (segment === "near-expiry") return diff !== null && diff >= 0 && diff <= Number(nearExpiryDays || 30);
      if (segment === "expired") return diff !== null && diff < 0;
      return true;
    });
  }, [nearExpiryDays, referenceNow, rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedKey("");
      return;
    }
    const firstKey = `${filteredRows[0]?.warehouse?.id ?? "company"}_${filteredRows[0]?.productBatch?.id ?? "batch"}`;
    if (!selectedKey || !filteredRows.some((row) => `${row.warehouse?.id ?? "company"}_${row.productBatch?.id ?? "batch"}` === selectedKey)) {
      setSelectedKey(firstKey);
    }
  }, [filteredRows, selectedKey]);

  const selectedRow =
    filteredRows.find((row) => `${row.warehouse?.id ?? "company"}_${row.productBatch?.id ?? "batch"}` === selectedKey) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Inventory"
        title="Batch stock"
        subtitle="Use one batch explorer for expiry pressure, warehouse posture, and batch-level availability instead of scattered inventory tables."
        badges={[
          <WorkspaceStatBadge key="all" label="Rows" value={rows.length} />,
          <WorkspaceStatBadge key="near" label="Near expiry" value={counts.nearExpiry} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/inventory`}>
            <SecondaryButton type="button">Back to inventory</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All batch rows", count: counts.all },
          { id: "near-expiry", label: "Near expiry", count: counts.nearExpiry },
          { id: "expired", label: "Expired", count: counts.expired },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full explorer" },
              { id: "near-expiry", label: "Expiry watch" },
              { id: "expired", label: "Clearance" },
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
            <SelectField
              label="Warehouse"
              value={warehouseId}
              onChange={setWarehouseId}
              options={[
                { value: "", label: "All warehouses" },
                ...((warehouses.data?.data.data ?? []).map((warehouse: { id: string; name: string }) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                }))),
              ]}
            />
            <TextField
              label="Near expiry days"
              value={nearExpiryDays}
              onChange={setNearExpiryDays}
              type="number"
            />
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading batch stock…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load batch stock")} /> : null}
      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState title="No batch stock found" hint="Receive a batch-tracked purchase or widen the filters." />
      ) : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected batch"
              title={selectedRow?.productBatch?.batchNumber ?? selectedRow?.productBatch?.batch_number ?? "Select batch"}
              subtitle="Keep expiry, warehouse, and quantity posture visible while the explorer stays dense and scan-friendly."
              footer={
                selectedRow ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/inventory/movements`}>
                      <SecondaryButton type="button">Stock movements</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedRow ? (
                <QueueMetaList
                  items={[
                    { label: "Product", value: selectedRow.productBatch?.product?.name ?? "Unknown product" },
                    { label: "Warehouse", value: selectedRow.warehouse?.name ?? "No warehouse" },
                    { label: "Expiry", value: selectedRow.productBatch?.expiryDate ?? selectedRow.productBatch?.expiry_date ?? "—" },
                    { label: "Quantity", value: selectedRow.quantity },
                  ]}
                />
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a batch row to inspect expiry posture.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Product</DataTh>
                  <DataTh>Warehouse</DataTh>
                  <DataTh>Batch</DataTh>
                  <DataTh>Expiry</DataTh>
                  <DataTh>Quantity</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredRows.map((row) => {
                  const key = `${row.warehouse?.id ?? "company"}_${row.productBatch?.id ?? "batch"}`;
                  return (
                    <DataTr
                      key={key}
                      className={selectedKey === key ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                      onClick={() => setSelectedKey(key)}
                    >
                      <DataTd>
                        <div className="font-medium">{row.productBatch?.product?.name ?? "Unknown product"}</div>
                        <div className="text-xs text-[var(--muted)]">{row.productBatch?.product?.sku ?? "No SKU"}</div>
                      </DataTd>
                      <DataTd>{row.warehouse?.name ?? "No warehouse"}</DataTd>
                      <DataTd>{row.productBatch?.batchNumber ?? row.productBatch?.batch_number ?? "—"}</DataTd>
                      <DataTd>{row.productBatch?.expiryDate ?? row.productBatch?.expiry_date ?? "—"}</DataTd>
                      <DataTd>{row.quantity}</DataTd>
                    </DataTr>
                  );
                })}
              </tbody>
            </DataTable>
          </DataTableShell>
        </QueueShell>
      ) : null}
    </div>
  );
}
