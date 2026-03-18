"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfitLoss } from "@/lib/billing/hooks";
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

export default function ProfitLossPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useProfitLoss({ companyId: companyId, from: from || undefined, to: to || undefined });

  const data = query.data?.data as unknown as { income?: number; expense?: number; profit?: number };
  const income = typeof data?.income === "number" ? data.income : null;
  const expense = typeof data?.expense === "number" ? data.expense : null;
  const profit = typeof data?.profit === "number" ? data.profit : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Profit & loss"
        subtitle="Inspect income, expense, and profit in a finance-oriented summary layout."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Select the period for the current P&amp;L snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading P&L…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load profit & loss")} /> : null}

      {query.data && income != null && expense != null && profit != null ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Income" value={income.toFixed(2)} />
          <StatCard label="Expense" value={expense.toFixed(2)} />
          <StatCard label="Profit" value={profit.toFixed(2)} />
        </div>
      ) : null}

      {query.data && (income == null || expense == null || profit == null) ? (
        <Card>
          <CardHeader>
            <CardTitle>Raw response</CardTitle>
            <CardDescription>The API payload does not yet map to the expected P&amp;L summary contract.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{JSON.stringify(query.data.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
