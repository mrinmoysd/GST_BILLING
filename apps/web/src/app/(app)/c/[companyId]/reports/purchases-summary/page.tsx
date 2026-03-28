"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePurchasesSummary } from "@/lib/reports/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function PurchasesSummaryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = usePurchasesSummary({ companyId: companyId, from: from || undefined, to: to || undefined });

  const data = query.data?.data;
  const grossPurchases = data?.gross_purchases ?? null;
  const netPurchases = data?.net_purchases ?? null;
  const purchasesCount = data?.purchases_count ?? null;
  const averagePurchase = data?.average_purchase ?? null;
  const taxTotal = data?.tax_total ?? null;

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {grossPurchases != null ? <StatCard label="Gross purchases" value={grossPurchases.toFixed(2)} /> : null}
          {netPurchases != null ? <StatCard label="Net purchases" value={netPurchases.toFixed(2)} /> : null}
          {purchasesCount != null ? <StatCard label="Purchases" value={purchasesCount} /> : null}
          {averagePurchase != null ? <StatCard label="Avg purchase" value={averagePurchase.toFixed(2)} /> : null}
        </div>
      ) : null}

      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Tax overview</CardTitle>
            <CardDescription>Monitor the tax component embedded in the selected purchase range.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-1">
            <StatCard label="Tax total" value={taxTotal != null ? taxTotal.toFixed(2) : "0.00"} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
