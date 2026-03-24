"use client";

import * as React from "react";

import { useCashBook } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspaceSection } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function CashBookPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const query = useCashBook({
    companyId,
    from: from || undefined,
    to: to || undefined,
  });

  const items = (query.data?.data as Array<{ date: string; narration: string | null; amount: number }> | undefined) ?? [];
  const totals = items.reduce(
    (acc, item) => {
      if (item.amount >= 0) acc.receipts += item.amount;
      else acc.payments += Math.abs(item.amount);
      acc.balance += item.amount;
      return acc;
    },
    { receipts: 0, payments: 0, balance: 0 },
  );
  const rows = items.map((item, index) => {
    const priorBalance = items.slice(0, index + 1).reduce((sum, current) => sum + current.amount, 0);
    return { ...item, runningBalance: priorBalance };
  });

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Cash book"
        subtitle="Review cash movement as a book, not a raw payload, with receipts, payments, and running balance visible immediately."
      />

      <WorkspaceFilterBar>
        <div className="grid gap-3 md:grid-cols-2">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading cash book…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load cash book")} /> : null}

      {!query.isLoading && !query.isError && items.length === 0 ? <EmptyState title="No entries" hint="Try adjusting the date range." /> : null}

      {!query.isLoading && !query.isError && rows.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Receipts" value={totals.receipts.toFixed(2)} tone="quiet" />
            <StatCard label="Payments" value={totals.payments.toFixed(2)} tone="quiet" />
            <StatCard label="Net cash movement" value={totals.balance.toFixed(2)} tone="strong" />
          </div>

          <WorkspaceSection eyebrow="Book" title="Cash entries" subtitle="Chronological cash movement with running balance.">
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Date</DataTh>
                    <DataTh>Narration</DataTh>
                    <DataTh className="text-right">Receipt</DataTh>
                    <DataTh className="text-right">Payment</DataTh>
                    <DataTh className="text-right">Running balance</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((item, index) => {
                    return (
                      <DataTr key={`${item.date}-${index}`}>
                        <DataTd>{item.date}</DataTd>
                        <DataTd>{item.narration ?? "—"}</DataTd>
                        <DataTd className="text-right">{item.amount >= 0 ? item.amount.toFixed(2) : "—"}</DataTd>
                        <DataTd className="text-right">{item.amount < 0 ? Math.abs(item.amount).toFixed(2) : "—"}</DataTd>
                        <DataTd className="text-right">{item.runningBalance.toFixed(2)}</DataTd>
                      </DataTr>
                    );
                  })}
                </tbody>
              </DataTable>
            </DataTableShell>
          </WorkspaceSection>
        </>
      ) : null}
    </div>
  );
}
