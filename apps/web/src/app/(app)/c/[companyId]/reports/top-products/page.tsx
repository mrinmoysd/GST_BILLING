"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopProducts } from "@/lib/reports/hooks";
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

export default function TopProductsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [limit, setLimit] = React.useState("10");
  const [sortBy, setSortBy] = React.useState<"amount" | "quantity">("amount");
  const query = useTopProducts({
    companyId: companyId,
    from: from || undefined,
    to: to || undefined,
    limit: Number(limit || 10),
    sort_by: sortBy,
  });

  const reportData = query.data?.data;
  const rows = Array.isArray(reportData)
    ? reportData
    : Array.isArray((reportData as { data?: unknown[] } | undefined)?.data)
      ? ((reportData as { data?: unknown[] }).data ?? [])
      : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Top products"
        subtitle="Compare top-performing products by quantity or amount across a selected date range."
      />

      <Card>
        <CardHeader>
          <CardTitle>Ranking controls</CardTitle>
          <CardDescription>Change the window, result count, and ranking basis for this product leaderboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4 md:items-end">
          <TextField label="From" value={from} onChange={setFrom} />
          <TextField label="To" value={to} onChange={setTo} />
          <TextField label="Limit" value={limit} onChange={setLimit} type="number" />
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Sort by</label>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value === "quantity" ? "quantity" : "amount")}
            >
              <option value="amount">Amount</option>
              <option value="quantity">Quantity</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}
      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Result payload</CardTitle>
            <CardDescription>{rows.length > 0 ? `${rows.length} record(s) returned.` : "The API did not return a normalized list shape for this screen yet."}</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{JSON.stringify(query.data.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
