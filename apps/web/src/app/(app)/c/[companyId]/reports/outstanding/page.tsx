"use client";

import * as React from "react";

import { useOutstandingInvoices } from "@/lib/reports/hooks";
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

export default function OutstandingInvoicesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const query = useOutstandingInvoices({ companyId: companyId, q: q || undefined, page: 1, limit: 50 });

  const rows = (query.data?.data as unknown as { data?: Array<{ invoice_id?: string; customer_name?: string; amount_due?: string }> })?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Outstanding invoices" subtitle="Report" />

      <div className="rounded-xl border bg-white p-4 max-w-xl">
        <TextField label="Search" value={q} onChange={setQ} placeholder="Customer / invoice" />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No results" hint="Try a different query." /> : null}

      {query.data && rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-right px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3">{r.invoice_id ?? "—"}</td>
                  <td className="px-4 py-3">{r.customer_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.amount_due ?? "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
