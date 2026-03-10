"use client";

import * as React from "react";

import { useProfitSnapshot } from "@/lib/reports/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function ProfitSnapshotPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useProfitSnapshot({ companyId: companyId, from: from || undefined, to: to || undefined });

  const data = query.data?.data as unknown as Record<string, unknown>;
  const revenue = typeof data?.revenue === "number" ? (data.revenue as number) : null;
  const cogs = typeof data?.cogs === "number" ? (data.cogs as number) : null;
  const grossProfit = typeof data?.gross_profit === "number" ? (data.gross_profit as number) : null;
  const netProfit = typeof data?.net_profit === "number" ? (data.net_profit as number) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Profit snapshot" subtitle="Report" />
      <div className="rounded-xl border bg-white p-4 grid gap-4 md:grid-cols-2">
        <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
        <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}

      {query.data && (revenue != null || cogs != null || grossProfit != null || netProfit != null) ? (
        <div className="grid gap-4 md:grid-cols-4">
          {revenue != null ? <StatCard label="Revenue" value={revenue.toFixed(2)} /> : null}
          {cogs != null ? <StatCard label="COGS" value={cogs.toFixed(2)} /> : null}
          {grossProfit != null ? <StatCard label="Gross profit" value={grossProfit.toFixed(2)} /> : null}
          {netProfit != null ? <StatCard label="Net profit" value={netProfit.toFixed(2)} /> : null}
        </div>
      ) : null}

      {query.data && revenue == null && cogs == null && grossProfit == null && netProfit == null ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-neutral-600">Raw response (temporary)</div>
          <pre className="mt-3 text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
