"use client";

import * as React from "react";

import { useTrialBalance } from "@/lib/billing/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function TrialBalancePage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useTrialBalance({ companyId: companyId, as_of: asOf || undefined });

  const rows = (query.data?.data as unknown as Array<{ ledger_name?: string; debit?: string; credit?: string }>) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Trial balance" subtitle="Report view." />

      <div className="rounded-xl border bg-white p-4">
  <TextField label="As of (YYYY-MM-DD)" value={asOf} onChange={setAsOf} />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading trial balance…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load trial balance")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No data" hint="Try a different date range." /> : null}

      {query.data && rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Ledger</th>
                <th className="text-right px-4 py-3 font-medium">Debit</th>
                <th className="text-right px-4 py-3 font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3">{r.ledger_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.debit ?? "0"}</td>
                  <td className="px-4 py-3 text-right">{r.credit ?? "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
