"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const data = query.data?.data;
  const revenue = data?.revenue ?? null;
  const cogs = data?.cogs ?? null;
  const grossProfit = data?.gross_profit ?? null;
  const netProfit = data?.net_profit ?? null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Profit snapshot"
        subtitle="Review revenue, cost of goods, and margin in a clearer executive summary layout."
      />
      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Select the period you want to compare for gross and net performance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>

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

      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Estimation note</CardTitle>
            <CardDescription>Current profitability is derived from an interim costing approach.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
              {data?.note ?? "Profitability notes are unavailable for the selected range."}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
