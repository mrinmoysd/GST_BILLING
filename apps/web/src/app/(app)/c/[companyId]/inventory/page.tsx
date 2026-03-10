"use client";

import * as React from "react";

import Link from "next/link";

import { useLowStock } from "@/lib/masters/hooks";
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
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Low stock overview." />

      {low.isLoading ? <LoadingBlock label="Loading low stock…" /> : null}
  {low.isError ? <InlineError message={getErrorMessage(low.error, "Failed to load")} /> : null}
  {!low.isLoading && !low.isError && items.length === 0 ? (
        <EmptyState title="No low stock items" hint="All products are above reorder level." />
      ) : null}

  {items.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Stock</th>
                <th className="text-left px-4 py-3 font-medium">Reorder level</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/c/${companyId}/masters/products/${p.id}`}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.stock ?? "—"}</td>
                  <td className="px-4 py-3">{p.reorderLevel ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
