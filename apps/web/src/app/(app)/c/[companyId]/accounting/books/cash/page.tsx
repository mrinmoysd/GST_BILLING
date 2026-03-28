"use client";

import * as React from "react";

import { useCashBook } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function CashBookPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedRowKey, setSelectedRowKey] = React.useState("");

  const query = useCashBook({
    companyId,
    from: from || undefined,
    to: to || undefined,
  });

  const items = React.useMemo(
    () => ((query.data?.data as Array<{ date: string; narration: string | null; amount: number }> | undefined) ?? []),
    [query.data],
  );
  const totals = items.reduce(
    (acc, item) => {
      if (item.amount >= 0) acc.receipts += item.amount;
      else acc.payments += Math.abs(item.amount);
      acc.balance += item.amount;
      return acc;
    },
    { receipts: 0, payments: 0, balance: 0 },
  );
  const rows = React.useMemo(
    () =>
      items.map((item, index) => {
        const priorBalance = items.slice(0, index + 1).reduce((sum, current) => sum + current.amount, 0);
        return { ...item, runningBalance: priorBalance };
      }),
    [items],
  );
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (segment === "receipts") return row.amount >= 0;
      if (segment === "payments") return row.amount < 0;
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedRowKey("");
      return;
    }
    const firstKey = `${filteredRows[0]?.date}-${0}`;
    if (!selectedRowKey) setSelectedRowKey(firstKey);
  }, [filteredRows, selectedRowKey]);

  const selectedRow = filteredRows.find((row, index) => `${row.date}-${index}` === selectedRowKey) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Cash book"
        subtitle="Review cash movement as a book, not a raw payload, with receipts, payments, and running balance visible immediately."
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All entries", count: rows.length },
          { id: "receipts", label: "Receipts", count: rows.filter((row) => row.amount >= 0).length },
          { id: "payments", label: "Payments", count: rows.filter((row) => row.amount < 0).length },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full book" },
              { id: "receipts", label: "Cash in" },
              { id: "payments", label: "Cash out" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={
          <div className="grid gap-3 md:grid-cols-2">
            <DateField label="From" value={from} onChange={setFrom} />
            <DateField label="To" value={to} onChange={setTo} />
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading cash book…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load cash book")} /> : null}

      {!query.isLoading && !query.isError && items.length === 0 ? <EmptyState title="No entries" hint="Try adjusting the date range." /> : null}

      {!query.isLoading && !query.isError && filteredRows.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Receipts" value={totals.receipts.toFixed(2)} tone="quiet" />
            <StatCard label="Payments" value={totals.payments.toFixed(2)} tone="quiet" />
            <StatCard label="Net cash movement" value={totals.balance.toFixed(2)} tone="strong" />
          </div>

          <QueueShell
            inspector={
              <QueueInspector eyebrow="Selected entry" title={selectedRow?.date ?? "Select entry"} subtitle="Keep the movement context close while the book stays readable and dense.">
                {selectedRow ? (
                  <QueueMetaList
                    items={[
                      { label: "Narration", value: selectedRow.narration ?? "—" },
                      { label: "Receipt", value: selectedRow.amount >= 0 ? selectedRow.amount.toFixed(2) : "—" },
                      { label: "Payment", value: selectedRow.amount < 0 ? Math.abs(selectedRow.amount).toFixed(2) : "—" },
                      { label: "Running balance", value: selectedRow.runningBalance.toFixed(2) },
                    ]}
                  />
                ) : null}
              </QueueInspector>
            }
          >
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
                  {filteredRows.map((item, index) => {
                    const key = `${item.date}-${index}`;
                    return (
                      <DataTr
                        key={key}
                        className={selectedRowKey === key ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-secondary)]"}
                        onClick={() => setSelectedRowKey(key)}
                      >
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
          </QueueShell>
        </>
      ) : null}
    </div>
  );
}
