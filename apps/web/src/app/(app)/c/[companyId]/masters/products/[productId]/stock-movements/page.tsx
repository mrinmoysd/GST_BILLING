"use client";

import * as React from "react";

import { useStockMovements } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { getErrorMessage } from "@/lib/errors";


type Props = { params: Promise<{ companyId: string; productId: string }> };

export default function ProductStockMovementsPage({ params }: Props) {
  const { companyId, productId } = React.use(params);
  const query = useStockMovements({ companyId, productId });

  return (
    <div className="space-y-6">
      <PageHeader title="Stock movements" subtitle={<code>{productId}</code>} />

      {query.isLoading ? <LoadingBlock label="Loading movements…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load movements")} />
      ) : null}

      {query.data && query.data.data.data.length === 0 ? <EmptyState title="No movements" /> : null}

      {query.data && query.data.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">When</th>
                <th className="text-left px-4 py-3 font-medium">Change</th>
                <th className="text-left px-4 py-3 font-medium">Balance</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {query.data.data.data.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{m.changeQty}</td>
                  <td className="px-4 py-3">{m.balanceQty}</td>
                  <td className="px-4 py-3">{m.sourceType}</td>
                  <td className="px-4 py-3">{m.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
