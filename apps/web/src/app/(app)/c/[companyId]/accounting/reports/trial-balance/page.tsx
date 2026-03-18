"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialBalance } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

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

  const rows = (query.data?.data as unknown as Array<{ ledger_name?: string; debit?: string; credit?: string }>) ?? [];

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
          <TextField label="As of (YYYY-MM-DD)" value={asOf} onChange={setAsOf} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading trial balance…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load trial balance")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No data" hint="Try a different date range." /> : null}

      {query.data && rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>Debit and credit balances by ledger.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Ledger</DataTh>
                    <DataTh className="text-right">Debit</DataTh>
                    <DataTh className="text-right">Credit</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((r, idx) => (
                    <DataTr key={`${r.ledger_name ?? "ledger"}-${idx}`}>
                      <DataTd>{r.ledger_name ?? "—"}</DataTd>
                      <DataTd className="text-right">{r.debit ?? "0"}</DataTd>
                      <DataTd className="text-right">{r.credit ?? "0"}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
