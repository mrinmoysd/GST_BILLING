"use client";

import * as React from "react";

import { usePurchasesSummary } from "@/lib/reports/hooks";
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

export default function PurchasesSummaryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = usePurchasesSummary({ companyId: companyId, from: from || undefined, to: to || undefined });

  const data = query.data?.data as unknown as Record<string, unknown>;
  const grossPurchases = typeof data?.gross_purchases === "number" ? (data.gross_purchases as number) : null;
  const netPurchases = typeof data?.net_purchases === "number" ? (data.net_purchases as number) : null;
  const purchasesCount = typeof data?.purchases_count === "number" ? (data.purchases_count as number) : null;
  const averagePurchase = typeof data?.average_purchase === "number" ? (data.average_purchase as number) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases summary" subtitle="Report" />
      <div className="rounded-xl border bg-white p-4 grid gap-4 md:grid-cols-2">
        <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
        <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}

      {query.data && (grossPurchases != null || netPurchases != null || purchasesCount != null || averagePurchase != null) ? (
        <div className="grid gap-4 md:grid-cols-4">
          {grossPurchases != null ? <StatCard label="Gross purchases" value={grossPurchases.toFixed(2)} /> : null}
          {netPurchases != null ? <StatCard label="Net purchases" value={netPurchases.toFixed(2)} /> : null}
          {purchasesCount != null ? <StatCard label="Purchases" value={purchasesCount} /> : null}
          {averagePurchase != null ? <StatCard label="Avg purchase" value={averagePurchase.toFixed(2)} /> : null}
        </div>
      ) : null}

      {query.data && grossPurchases == null && netPurchases == null && purchasesCount == null && averagePurchase == null ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-neutral-600">Raw response (temporary)</div>
          <pre className="mt-3 text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
