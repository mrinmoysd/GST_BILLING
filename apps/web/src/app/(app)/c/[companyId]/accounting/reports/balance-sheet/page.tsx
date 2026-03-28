"use client";

import * as React from "react";
import Link from "next/link";

import { useBalanceSheet } from "@/lib/billing/hooks";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };
type SectionRow = { ledger_id: string; ledger_name: string; amount: number };


function BalanceSheetSectionPanel(props: {
  companyId: string;
  title: string;
  description: string;
  rows: SectionRow[];
}) {
  return (
    <WorkspacePanel title={props.title} subtitle={props.description}>
      <DataTableShell>
        <DataTable>
          <DataThead>
            <tr>
              <DataTh>Ledger</DataTh>
              <DataTh className="text-right">Amount</DataTh>
            </tr>
          </DataThead>
          <tbody>
            {props.rows.length === 0 ? (
              <DataEmptyRow colSpan={2} title={`No ${props.title.toLowerCase()} rows as of this date.`} />
            ) : (
              props.rows.map((row) => (
                <DataTr key={row.ledger_id}>
                  <DataTd>
                    <Link className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]" href={`/c/${props.companyId}/accounting/ledgers`}>
                      {row.ledger_name}
                    </Link>
                  </DataTd>
                  <DataTd className="text-right">{row.amount.toFixed(2)}</DataTd>
                </DataTr>
              ))
            )}
          </tbody>
        </DataTable>
      </DataTableShell>
    </WorkspacePanel>
  );
}

export default function BalanceSheetPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useBalanceSheet({ companyId, as_of: asOf || undefined });

  const report = query.data?.data;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Balance sheet"
        subtitle="Review assets, liabilities, and equity in a statement layout with integrity checks and tighter sectional density."
      />

      <WorkspaceFilterBar>
        <div className="max-w-xl">
          <DateField label="As of" value={asOf} onChange={setAsOf} />
        </div>
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading balance sheet…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load balance sheet")} /> : null}

      {report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Assets" value={report.summary.assets.toFixed(2)} tone="quiet" />
          <StatCard label="Liabilities" value={report.summary.liabilities.toFixed(2)} tone="quiet" />
          <StatCard label="Equity" value={report.summary.equity.toFixed(2)} tone="strong" />
        </div>
      ) : null}

      {report ? (
        <WorkspacePanel
          title="Statement integrity"
          subtitle={`Balance check between assets and liabilities plus equity as of ${report.as_of}.`}
          tone="muted"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Liabilities + equity" value={report.summary.liabilities_and_equity.toFixed(2)} />
            <StatCard label="Difference" value={report.summary.difference.toFixed(2)} />
            <StatCard label="As of" value={report.as_of} />
          </div>
        </WorkspacePanel>
      ) : null}

      {report ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <BalanceSheetSectionPanel companyId={companyId} title="Assets" description="Ledger balances classified as assets." rows={report.assets} />
          <BalanceSheetSectionPanel companyId={companyId} title="Liabilities" description="Outstanding obligations and statutory balances." rows={report.liabilities} />
          <BalanceSheetSectionPanel companyId={companyId} title="Equity" description="Capital and retained ownership balances." rows={report.equity} />
        </div>
      ) : null}
    </div>
  );
}
