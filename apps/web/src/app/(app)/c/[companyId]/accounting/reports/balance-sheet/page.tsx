"use client";

import * as React from "react";

import { useBalanceSheet } from "@/lib/billing/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function BalanceSheetPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useBalanceSheet({ companyId: companyId, as_of: asOf || undefined });

  const data = query.data?.data as unknown as { assets?: number; liabilities?: number; equity?: number };
  const assets = typeof data?.assets === "number" ? data.assets : null;
  const liabilities = typeof data?.liabilities === "number" ? data.liabilities : null;
  const equity = typeof data?.equity === "number" ? data.equity : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Balance sheet" subtitle="Report view." />

      <div className="rounded-xl border bg-white p-4 max-w-xl">
        <TextField label="As of (YYYY-MM-DD)" value={asOf} onChange={setAsOf} />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading balance sheet…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load balance sheet")} /> : null}

      {query.data && assets != null && liabilities != null && equity != null ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-600">Assets</div>
            <div className="mt-1 text-2xl font-semibold">{assets.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-600">Liabilities</div>
            <div className="mt-1 text-2xl font-semibold">{liabilities.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-600">Equity</div>
            <div className="mt-1 text-2xl font-semibold">{equity.toFixed(2)}</div>
          </div>
        </div>
      ) : null}

      {query.data && (assets == null || liabilities == null || equity == null) ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-neutral-600">Unexpected response (debug)</div>
          <pre className="mt-3 text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
