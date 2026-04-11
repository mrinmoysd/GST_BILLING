"use client";

import * as React from "react";

import { useTrialBalance } from "@/lib/billing/hooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { DateField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };

type TrialBalanceRow = {
  ledger_name?: string | null;
  top_level?: string | null;
  debit?: string | number | null;
  credit?: string | number | null;
  net_balance?: string | number | null;
};


export default function TrialBalancePage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useTrialBalance({ companyId, as_of: asOf || undefined });

  const report = query.data?.data;
  const rows = (report?.rows ?? []) as TrialBalanceRow[];

  const columns = React.useMemo<ColumnDef<TrialBalanceRow>[]>(
    () => [
      {
        id: "ledger",
        header: "Ledger",
        accessorFn: (row) => row.ledger_name ?? "",
        meta: { label: "Ledger" },
        cell: ({ row }) => row.original.ledger_name ?? "—",
      },
      {
        id: "class",
        header: "Class",
        accessorFn: (row) => row.top_level ?? "",
        meta: { label: "Class" },
        cell: ({ row }) => row.original.top_level ?? "unknown",
      },
      {
        id: "debit",
        header: "Debit",
        accessorFn: (row) => Number(row.debit ?? 0),
        meta: { label: "Debit", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => Number(row.original.debit ?? 0).toFixed(2),
      },
      {
        id: "credit",
        header: "Credit",
        accessorFn: (row) => Number(row.credit ?? 0),
        meta: { label: "Credit", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => Number(row.original.credit ?? 0).toFixed(2),
      },
      {
        id: "net",
        header: "Net",
        accessorFn: (row) => Number(row.net_balance ?? 0),
        meta: { label: "Net", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => Number(row.original.net_balance ?? 0).toFixed(2),
      },
    ],
    [],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Trial balance"
        subtitle="Review ledger balances in a denser statement view where totals stay visible and the table remains the primary working plane."
        badges={[<WorkspaceStatBadge key="as-of" label="As of" value={report?.as_of ?? "Current"} />]}
      />

      <WorkspaceFilterBar>
        <div className="max-w-xl">
          <DateField label="As of" value={asOf} onChange={setAsOf} />
        </div>
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading trial balance…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load trial balance")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No data" hint="Try a different date range." /> : null}

      {report ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="As of" value={report.as_of} tone="quiet" />
          <StatCard label="Total debit" value={report.totals.debit.toFixed(2)} tone="quiet" />
          <StatCard label="Total credit" value={report.totals.credit.toFixed(2)} tone="quiet" />
          <StatCard label="Difference" value={report.totals.difference.toFixed(2)} tone="strong" />
        </div>
      ) : null}

      {query.data && rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Statement"
          title="Balances"
          subtitle="Debit and credit balances by ledger with classification and net balance."
        >
          <DataGrid
            data={rows}
            columns={columns}
            getRowId={(row, index) => `${row.ledger_name ?? "ledger"}-${index}`}
            initialSorting={[{ id: "ledger", desc: false }]}
            toolbarTitle="Trial balance"
            toolbarDescription="Keep the statement dense and sortable without pushing totals or filters away from the operator."
          />
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
