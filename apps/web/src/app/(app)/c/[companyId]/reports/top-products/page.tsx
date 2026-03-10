"use client";

import * as React from "react";

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

  return (
    <div className="space-y-6">
      <PageHeader title="Top products" subtitle="Report" />

      <div className="rounded-xl border bg-white p-4 grid gap-4 md:grid-cols-4 md:items-end">
        <TextField label="From" value={from} onChange={setFrom} />
        <TextField label="To" value={to} onChange={setTo} />
        <TextField label="Limit" value={limit} onChange={setLimit} type="number" />
        <div>
          <label className="block text-sm font-medium">Sort by</label>
          <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value === "quantity" ? "quantity" : "amount")}>
            <option value="amount">Amount</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}
      {query.data ? (
        <div className="rounded-xl border bg-white p-4">
          <pre className="text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
