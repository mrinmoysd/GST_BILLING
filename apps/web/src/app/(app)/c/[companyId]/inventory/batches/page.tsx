"use client";

import Link from "next/link";
import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBatchStock, useWarehouses } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

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

  const warehouses = useWarehouses({ companyId, activeOnly: true, limit: 100 });
  const query = useBatchStock({
    companyId,
    warehouseId: warehouseId || undefined,
    nearExpiryDays: nearExpiryDays ? Number(nearExpiryDays) : undefined,
    page: 1,
    limit: 100,
  });

  const rows = query.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inventory"
        title="Batch stock"
        subtitle="Track batch-level on-hand quantity and quickly surface near-expiry inventory."
        actions={<Link href={`/c/${companyId}/inventory`} className="text-sm underline">Back</Link>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Batch filters</CardTitle>
          <CardDescription>Use warehouse and near-expiry filters to focus on the stock that needs action.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading batch stock…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load batch stock")} /> : null}
      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState title="No batch stock found" hint="Receive a batch-tracked purchase or widen the filters." />
      ) : null}

      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Batch inventory</CardTitle>
            <CardDescription>Current batch-wise stock by warehouse, with expiry visibility baked in.</CardDescription>
          </CardHeader>
          <CardContent>
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
                  {rows.map((row) => (
                    <DataTr
                      key={`${row.warehouse?.id ?? "company"}_${row.productBatch?.id ?? "batch"}`}
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
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
