"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Purchases summary"
        subtitle="Track purchasing volume, spend, and average bill size for the selected reporting window."
      />
      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Use this range to inspect supplier spend and purchase throughput.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>

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
        <Card>
          <CardHeader>
            <CardTitle>Raw response</CardTitle>
            <CardDescription>The response shape does not yet match the expected summary contract for this screen.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{JSON.stringify(query.data.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
