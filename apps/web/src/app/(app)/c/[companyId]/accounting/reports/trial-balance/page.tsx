"use client";

import * as React from "react";

import { useTrialBalance } from "@/lib/billing/hooks";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function TrialBalancePage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useTrialBalance({ companyId, as_of: asOf || undefined });

  const report = query.data?.data;
  const rows = report?.rows ?? [];

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
          <DataTableShell>
            <DataTable className="min-w-[780px]">
              <DataThead>
                <tr>
                  <DataTh>Ledger</DataTh>
                  <DataTh>Class</DataTh>
                  <DataTh className="text-right">Debit</DataTh>
                  <DataTh className="text-right">Credit</DataTh>
                  <DataTh className="text-right">Net</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {rows.length === 0 ? (
                  <DataEmptyRow colSpan={5} title="No ledgers posted as of this date." />
                ) : (
                  rows.map((row, index) => (
                    <DataTr key={`${row.ledger_name ?? "ledger"}-${index}`}>
                      <DataTd>{row.ledger_name ?? "—"}</DataTd>
                      <DataTd>{row.top_level ?? "unknown"}</DataTd>
                      <DataTd className="text-right">{Number(row.debit ?? 0).toFixed(2)}</DataTd>
                      <DataTd className="text-right">{Number(row.credit ?? 0).toFixed(2)}</DataTd>
                      <DataTd className="text-right">{Number(row.net_balance ?? 0).toFixed(2)}</DataTd>
                    </DataTr>
                  ))
                )}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
