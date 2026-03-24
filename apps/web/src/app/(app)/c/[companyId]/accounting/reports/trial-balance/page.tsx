"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialBalance } from "@/lib/billing/hooks";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { DateField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";

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
  const query = useTrialBalance({ companyId: companyId, as_of: asOf || undefined });

  const report = query.data?.data;
  const rows = report?.rows ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Trial balance"
        subtitle="Review ledger balances at a point in time from a cleaner finance report layout."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>As-of date</CardTitle>
          <CardDescription>Set the reporting date for the current trial balance snapshot.</CardDescription>
        </CardHeader>
        <CardContent>
          <DateField label="As of" value={asOf} onChange={setAsOf} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading trial balance…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load trial balance")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No data" hint="Try a different date range." /> : null}

      {report ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="As of" value={report.as_of} />
          <StatCard label="Total debit" value={report.totals.debit.toFixed(2)} />
          <StatCard label="Total credit" value={report.totals.credit.toFixed(2)} />
          <StatCard label="Difference" value={report.totals.difference.toFixed(2)} />
        </div>
      ) : null}

      {query.data && rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>Debit and credit balances by ledger with classification and net balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
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
                    rows.map((r, idx) => (
                      <DataTr key={`${r.ledger_name ?? "ledger"}-${idx}`}>
                        <DataTd>{r.ledger_name ?? "—"}</DataTd>
                        <DataTd>{r.top_level ?? "unknown"}</DataTd>
                        <DataTd className="text-right">{Number(r.debit ?? 0).toFixed(2)}</DataTd>
                        <DataTd className="text-right">{Number(r.credit ?? 0).toFixed(2)}</DataTd>
                        <DataTd className="text-right">{Number(r.net_balance ?? 0).toFixed(2)}</DataTd>
                      </DataTr>
                    ))
                  )}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
