"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryAdjustment, useLowStock, useProducts, useStockMovements, useWarehouses } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


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

  const productRows = (productsQuery.data?.data ?? []) as Array<{ id: string; name: string; stock?: string | number | null }>;
  const lowStockRows = Array.isArray(lowStockQuery.data?.data) ? lowStockQuery.data.data : [];
  const movementRows = movementsQuery.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inventory"
        title="Stock adjustments"
        subtitle="Apply manual stock corrections from a dedicated adjustment workspace and review the latest inventory activity."
        actions={<Link href={`/c/${companyId}/inventory`}><SecondaryButton type="button">Back</SecondaryButton></Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{lowStockRows.length} low-stock item{lowStockRows.length === 1 ? "" : "s"}</Badge>
              <Badge variant="outline">Manual correction</Badge>
            </div>
            <CardTitle>Apply adjustment</CardTitle>
            <CardDescription>Use positive quantities to add stock and negative quantities to reduce stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
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
            </div>
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
                  await adjust.mutateAsync({ productId, changeQty: qty, note: note || undefined, warehouseId: warehouseId || undefined });
                  setChangeQty("");
                  setNote("");
                } catch (err: unknown) {
                  setError(getErrorMessage(err, "Failed to apply stock adjustment"));
                }
              }}
            >
              {adjust.isPending ? "Applying…" : "Apply adjustment"}
            </PrimaryButton>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="[background-image:var(--surface-highlight)]">
            <CardHeader>
              <CardTitle>Low stock watch</CardTitle>
              <CardDescription>Products currently at or below reorder level.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockRows.length > 0 ? (
                lowStockRows.map((product) => (
                  <Link
                    key={product.id}
                    href={`/c/${companyId}/masters/products/${product.id}`}
                    className="block rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)] transition hover:border-[var(--border-strong)]"
                  >
                    <div className="font-medium text-[var(--foreground)]">{product.name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">Stock {product.stock ?? "—"} | Reorder {product.reorderLevel ?? "—"}</div>
                  </Link>
                ))
              ) : (
                <EmptyState title="No low-stock items" hint="Current stock levels are above reorder thresholds." className="p-6" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {productsQuery.isLoading || movementsQuery.isLoading ? <LoadingBlock label="Loading inventory workspace…" /> : null}
      {productsQuery.isError ? <InlineError message={getErrorMessage(productsQuery.error, "Failed to load products")} /> : null}
      {movementsQuery.isError ? <InlineError message={getErrorMessage(movementsQuery.error, "Failed to load movements")} /> : null}

      {movementRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent stock movements</CardTitle>
            <CardDescription>The latest movement records after purchases, invoice issues, or manual adjustments.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>When</DataTh>
                    <DataTh>Product</DataTh>
                    <DataTh>Warehouse</DataTh>
                    <DataTh>Change</DataTh>
                    <DataTh>Balance</DataTh>
                    <DataTh>Source</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {movementRows.map((row) => (
                    <DataTr key={row.id}>
                      <DataTd>{new Date(row.createdAt).toLocaleString()}</DataTd>
                      <DataTd>
                        <Link href={`/c/${companyId}/masters/products/${row.productId}`} className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]">
                          {row.product?.name ?? row.productId.slice(0, 8)}
                        </Link>
                      </DataTd>
                      <DataTd>{row.warehouse?.name ?? "Company"}</DataTd>
                      <DataTd>{row.changeQty}</DataTd>
                      <DataTd>{row.balanceQty}</DataTd>
                      <DataTd>{row.sourceType}</DataTd>
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
