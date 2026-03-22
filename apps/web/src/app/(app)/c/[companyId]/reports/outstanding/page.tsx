"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutstandingInvoices } from "@/lib/reports/hooks";
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

export default function OutstandingInvoicesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const query = useOutstandingInvoices({ companyId: companyId, q: q || undefined, page: 1, limit: 50 });

  const rows = query.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Outstanding invoices"
        subtitle="Surface receivables and overdue exposure from a cleaner operational report layout."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by invoice identifier or customer name.</CardDescription>
        </CardHeader>
        <CardContent>
          <TextField label="Search" value={q} onChange={setQ} placeholder="Customer / invoice" />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No results" hint="Try a different query." /> : null}

      {query.data && rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Receivables</CardTitle>
            <CardDescription>Current invoice balances that remain open.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Invoice</DataTh>
                    <DataTh>Customer</DataTh>
                    <DataTh>Issue date</DataTh>
                    <DataTh>Due date</DataTh>
                    <DataTh className="text-right">Due</DataTh>
                    <DataTh className="text-right">Overdue days</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((r, idx) => (
                    <DataTr key={`${r.invoice_id ?? "row"}-${idx}`}>
                      <DataTd>
                        {r.invoice_id ? (
                          <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/sales/invoices/${r.invoice_id}`}>
                            {r.invoice_number ?? r.invoice_id}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </DataTd>
                      <DataTd>{r.customer_name ?? "—"}</DataTd>
                      <DataTd>{r.issue_date ?? "—"}</DataTd>
                      <DataTd>{r.due_date ?? "—"}</DataTd>
                      <DataTd className="text-right">{Number(r.amount_due ?? 0).toFixed(2)}</DataTd>
                      <DataTd className="text-right">{r.overdue_days ?? 0}</DataTd>
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
