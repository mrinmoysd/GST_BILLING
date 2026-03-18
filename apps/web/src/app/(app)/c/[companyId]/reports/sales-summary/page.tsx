"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesSummary } from "@/lib/reports/hooks";
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

export default function SalesSummaryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useSalesSummary({ companyId: companyId, from: from || undefined, to: to || undefined });

  const data = query.data?.data as unknown as Record<string, unknown>;
  const grossSales = typeof data?.gross_sales === "number" ? (data.gross_sales as number) : null;
  const netSales = typeof data?.net_sales === "number" ? (data.net_sales as number) : null;
  const invoicesCount = typeof data?.invoices_count === "number" ? (data.invoices_count as number) : null;
  const averageInvoice = typeof data?.average_invoice === "number" ? (data.average_invoice as number) : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Sales summary"
        subtitle="Track topline sales performance, invoice count, and average invoice value for a selected period."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Leave both fields empty to inspect the backend default range.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}

      {query.data && (grossSales != null || netSales != null || invoicesCount != null || averageInvoice != null) ? (
        <div className="grid gap-4 md:grid-cols-4">
          {grossSales != null ? <StatCard label="Gross sales" value={grossSales.toFixed(2)} /> : null}
          {netSales != null ? <StatCard label="Net sales" value={netSales.toFixed(2)} /> : null}
          {invoicesCount != null ? <StatCard label="Invoices" value={invoicesCount} /> : null}
          {averageInvoice != null ? <StatCard label="Avg invoice" value={averageInvoice.toFixed(2)} /> : null}
        </div>
      ) : null}

      {query.data && grossSales == null && netSales == null && invoicesCount == null && averageInvoice == null ? (
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
