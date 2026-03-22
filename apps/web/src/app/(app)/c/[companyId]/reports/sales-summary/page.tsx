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

  const data = query.data?.data;
  const grossSales = data?.gross_sales ?? null;
  const netSales = data?.net_sales ?? null;
  const invoicesCount = data?.invoices_count ?? null;
  const averageInvoice = data?.average_invoice ?? null;
  const taxTotal = data?.tax_total ?? null;
  const amountPaid = data?.amount_paid ?? null;
  const balanceDue = data?.balance_due ?? null;

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {grossSales != null ? <StatCard label="Gross sales" value={grossSales.toFixed(2)} /> : null}
          {netSales != null ? <StatCard label="Net sales" value={netSales.toFixed(2)} /> : null}
          {invoicesCount != null ? <StatCard label="Invoices" value={invoicesCount} /> : null}
          {averageInvoice != null ? <StatCard label="Avg invoice" value={averageInvoice.toFixed(2)} /> : null}
        </div>
      ) : null}

      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Collection performance</CardTitle>
            <CardDescription>Track tax, collections, and open receivables for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard label="Tax total" value={taxTotal != null ? taxTotal.toFixed(2) : "0.00"} />
            <StatCard label="Amount paid" value={amountPaid != null ? amountPaid.toFixed(2) : "0.00"} />
            <StatCard label="Balance due" value={balanceDue != null ? balanceDue.toFixed(2) : "0.00"} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
