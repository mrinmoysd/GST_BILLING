"use client";

import * as React from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLowStock } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function InventoryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const low = useLowStock({ companyId: companyId, threshold: 0 });
  const items = Array.isArray(low.data?.data) ? low.data.data : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inventory"
        title="Stock watch"
        subtitle="Track low-stock exposure and jump directly into the products that need replenishment."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))] md:col-span-2">
          <CardHeader>
            <CardTitle>Inventory pulse</CardTitle>
            <CardDescription>
              This workspace currently highlights products at or below the configured reorder threshold.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">{items.length} flagged item{items.length === 1 ? "" : "s"}</Badge>
            <Badge variant="outline">Threshold 0</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>Use dedicated movements and adjustments pages to work inventory issues faster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link className="block font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/inventory/movements`}>
              View all stock movements
            </Link>
            <Link className="block font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/inventory/adjustments`}>
              Open stock adjustments
            </Link>
          </CardContent>
        </Card>
      </div>

      {low.isLoading ? <LoadingBlock label="Loading low stock…" /> : null}
      {low.isError ? <InlineError message={getErrorMessage(low.error, "Failed to load")} /> : null}
      {!low.isLoading && !low.isError && items.length === 0 ? (
        <EmptyState title="No low stock items" hint="All products are above reorder level." />
      ) : null}

      {items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Low stock items</CardTitle>
            <CardDescription>These products are the current replenishment queue for the business.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Product</DataTh>
                    <DataTh>Stock</DataTh>
                    <DataTh>Reorder level</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {items.map((p) => (
                    <DataTr key={p.id}>
                      <DataTd>
                        <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/masters/products/${p.id}`}>
                          {p.name}
                        </Link>
                      </DataTd>
                      <DataTd>{p.stock ?? "—"}</DataTd>
                      <DataTd>{p.reorderLevel ?? "—"}</DataTd>
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
