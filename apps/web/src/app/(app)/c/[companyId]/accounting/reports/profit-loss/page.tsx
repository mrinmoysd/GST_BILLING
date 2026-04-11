"use client";

import * as React from "react";
import Link from "next/link";

import { useProfitLoss } from "@/lib/billing/hooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };

type StatementRow = { ledger_id: string; ledger_name: string; amount: number };


export default function ProfitLossPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useProfitLoss({ companyId, from: from || undefined, to: to || undefined });

  const report = query.data?.data;
  const summary = report?.summary ?? { income: 0, expense: 0, profit: 0 };
  const incomeRows = (report?.income ?? []) as StatementRow[];
  const expenseRows = (report?.expenses ?? []) as StatementRow[];

  const statementColumns = React.useMemo<ColumnDef<StatementRow>[]>(
    () => [
      {
        id: "ledger",
        header: "Ledger",
        accessorFn: (row) => row.ledger_name,
        meta: { label: "Ledger" },
        cell: ({ row }) => (
          <Link className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]" href={`/c/${companyId}/accounting/ledgers`}>
            {row.original.ledger_name}
          </Link>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        accessorFn: (row) => row.amount,
        meta: { label: "Amount", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.amount.toFixed(2),
      },
    ],
    [companyId],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Profit & loss"
        subtitle="Track operating performance through a tighter statement layout that keeps outcome, period, and ledger drivers in the same field of view."
      />

      <WorkspaceFilterBar>
        <div className="grid gap-4 md:grid-cols-2">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading P&L…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load profit & loss")} /> : null}

      {report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Income" value={summary.income.toFixed(2)} tone="quiet" />
          <StatCard label="Expense" value={summary.expense.toFixed(2)} tone="quiet" />
          <StatCard label="Profit" value={summary.profit.toFixed(2)} tone="strong" />
        </div>
      ) : null}

      {report ? (
        <WorkspacePanel
          title="Statement window"
          subtitle={`${report.period.from} to ${report.period.to}`}
          tone="muted"
        >
          <div className="text-sm text-[var(--muted)]">
            Income and expense ledgers below are scoped to the selected accounting period.
          </div>
        </WorkspacePanel>
      ) : null}

      {report ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <WorkspacePanel title="Income ledgers" subtitle="Revenue recognized in the selected reporting window.">
            <DataGrid
              data={incomeRows}
              columns={statementColumns}
              getRowId={(row) => row.ledger_id}
              initialSorting={[{ id: "amount", desc: true }]}
              emptyTitle="No income activity in this period."
              toolbarTitle="Income statement"
            />
          </WorkspacePanel>

          <WorkspacePanel title="Expense ledgers" subtitle="Cost and operating expenses hitting the selected period.">
            <DataGrid
              data={expenseRows}
              columns={statementColumns}
              getRowId={(row) => row.ledger_id}
              initialSorting={[{ id: "amount", desc: true }]}
              emptyTitle="No expense activity in this period."
              toolbarTitle="Expense statement"
            />
          </WorkspacePanel>
        </div>
      ) : null}
    </div>
  );
}
