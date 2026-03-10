"use client";

import { useStockMovements } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type Props = { params: { companyId: string; productId: string } };

export default function ProductStockMovementsPage({ params }: Props) {
  const query = useStockMovements({ companyId: params.companyId, productId: params.productId });

  return (
    <div className="space-y-6">
      <PageHeader title="Stock movements" subtitle={<code>{params.productId}</code>} />

      {query.isLoading ? <LoadingBlock label="Loading movements…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load movements")} />
      ) : null}

      {query.data && query.data.data.data.length === 0 ? <EmptyState title="No movements" /> : null}

      {query.data && query.data.data.data.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
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
