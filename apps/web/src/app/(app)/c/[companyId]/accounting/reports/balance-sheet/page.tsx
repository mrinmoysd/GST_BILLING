"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBalanceSheet } from "@/lib/billing/hooks";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";

type Props = { params: Promise<{ companyId: string }> };
type SectionRow = { ledger_id: string; ledger_name: string; amount: number };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function BalanceSheetSectionCard(props: {
  companyId: string;
  title: string;
  description: string;
  rows: SectionRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

export default function BalanceSheetPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const query = useBalanceSheet({ companyId: companyId, as_of: asOf || undefined });

  const report = query.data?.data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Balance sheet"
        subtitle="Review assets, liabilities, and equity from a clearer statement layout."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>As-of date</CardTitle>
          <CardDescription>Select the date for the current balance sheet snapshot.</CardDescription>
        </CardHeader>
        <CardContent>
          <TextField label="As of (YYYY-MM-DD)" value={asOf} onChange={setAsOf} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading balance sheet…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load balance sheet")} /> : null}

      {report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Assets" value={report.summary.assets.toFixed(2)} />
          <StatCard label="Liabilities" value={report.summary.liabilities.toFixed(2)} />
          <StatCard label="Equity" value={report.summary.equity.toFixed(2)} />
        </div>
      ) : null}

      {report ? (
        <Card>
          <CardHeader>
            <CardTitle>Statement integrity</CardTitle>
            <CardDescription>Balance check between assets and liabilities plus equity as of {report.as_of}.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard label="Liabilities + equity" value={report.summary.liabilities_and_equity.toFixed(2)} />
            <StatCard label="Difference" value={report.summary.difference.toFixed(2)} />
            <StatCard label="As of" value={report.as_of} />
          </CardContent>
        </Card>
      ) : null}

      {report ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <BalanceSheetSectionCard companyId={companyId} title="Assets" description="Ledger balances classified as assets." rows={report.assets} />
          <BalanceSheetSectionCard companyId={companyId} title="Liabilities" description="Outstanding obligations and statutory balances." rows={report.liabilities} />
          <BalanceSheetSectionCard companyId={companyId} title="Equity" description="Capital and retained ownership balances." rows={report.equity} />
        </div>
      ) : null}
    </div>
  );
}
