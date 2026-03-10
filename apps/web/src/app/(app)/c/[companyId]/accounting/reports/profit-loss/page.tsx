"use client";

import * as React from "react";

import { useProfitLoss } from "@/lib/billing/hooks";
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
    <div className="space-y-6">
      <PageHeader title="Profit & loss" subtitle="Report view." />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </div>
      </div>

  {query.isLoading ? <LoadingBlock label="Loading P&L…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load profit & loss")} /> : null}

      {query.data && income != null && expense != null && profit != null ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-600">Income</div>
            <div className="mt-1 text-2xl font-semibold">{income.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-600">Expense</div>
            <div className="mt-1 text-2xl font-semibold">{expense.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-600">Profit</div>
            <div className="mt-1 text-2xl font-semibold">{profit.toFixed(2)}</div>
          </div>
        </div>
      ) : null}

      {query.data && (income == null || expense == null || profit == null) ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-neutral-600">Unexpected response (debug)</div>
          <pre className="mt-3 text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
