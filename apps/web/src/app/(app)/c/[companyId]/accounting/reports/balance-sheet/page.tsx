"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBalanceSheet } from "@/lib/billing/hooks";
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

export default function BalanceSheetPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useBalanceSheet({ companyId: companyId, as_of: asOf || undefined });

  const data = query.data?.data as unknown as { assets?: number; liabilities?: number; equity?: number };
  const assets = typeof data?.assets === "number" ? data.assets : null;
  const liabilities = typeof data?.liabilities === "number" ? data.liabilities : null;
  const equity = typeof data?.equity === "number" ? data.equity : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Balance sheet"
        subtitle="Review assets, liabilities, and equity from a clearer statement layout."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>As-of date</CardTitle>
          <CardDescription>Select the date for the current balance sheet snapshot.</CardDescription>
        </CardHeader>
        <CardContent>
          <TextField label="As of (YYYY-MM-DD)" value={asOf} onChange={setAsOf} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading balance sheet…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load balance sheet")} /> : null}

      {query.data && assets != null && liabilities != null && equity != null ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Assets" value={assets.toFixed(2)} />
          <StatCard label="Liabilities" value={liabilities.toFixed(2)} />
          <StatCard label="Equity" value={equity.toFixed(2)} />
        </div>
      ) : null}

      {query.data && (assets == null || liabilities == null || equity == null) ? (
        <Card>
          <CardHeader>
            <CardTitle>Raw response</CardTitle>
            <CardDescription>The API payload does not yet map to the expected balance-sheet summary contract.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{JSON.stringify(query.data.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
