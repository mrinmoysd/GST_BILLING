"use client";

import Link from "next/link";
import * as React from "react";

import { useJournal } from "@/lib/billing/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: { companyId: string; journalId: string } };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function JournalDetailPage({ params }: Props) {
  const query = useJournal({ companyId: params.companyId, journalId: params.journalId });

  const data = query.data?.data as unknown as {
    id?: string;
    date?: string;
    narration?: string | null;
    lines?: Array<{
      id?: string;
      amount?: number;
      debit_ledger_name?: string | null;
      credit_ledger_name?: string | null;
      debit_ledger_id?: string | null;
      credit_ledger_id?: string | null;
    }>;
  };

  const lines = data?.lines ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Journal" subtitle="Drill-down view." />

      <div className="text-sm">
        <Link className="text-blue-700 hover:underline" href={`/c/${params.companyId}/accounting/journals`}>
          ← Back to journals
        </Link>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading journal…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load journal")} /> : null}

      {query.data ? (
        <div className="rounded-xl border bg-white p-4 space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="text-sm text-neutral-600">Journal ID</div>
              <div className="font-mono text-sm break-all">{data?.id ?? params.journalId}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600">Date</div>
              <div className="text-sm">{data?.date ?? "—"}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-600">Narration</div>
            <div className="text-sm">{data?.narration || "—"}</div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Debit</th>
                  <th className="text-left px-3 py-2 font-medium">Credit</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={l.id ?? idx} className="border-t">
                    <td className="px-3 py-2">{l.debit_ledger_name ?? l.debit_ledger_id ?? "—"}</td>
                    <td className="px-3 py-2">{l.credit_ledger_name ?? l.credit_ledger_id ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{typeof l.amount === "number" ? l.amount.toFixed(2) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
