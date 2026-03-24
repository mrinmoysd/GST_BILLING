"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfitLoss } from "@/lib/billing/hooks";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
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

export default function ProfitLossPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useProfitLoss({ companyId: companyId, from: from || undefined, to: to || undefined });

  const report = query.data?.data;
  const summary = report?.summary ?? { income: 0, expense: 0, profit: 0 };
  const incomeRows = report?.income ?? [];
  const expenseRows = report?.expenses ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Profit & loss"
        subtitle="Inspect income, expense, and profit in a finance-oriented summary layout."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Select the period for the current P&amp;L snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading P&L…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load profit & loss")} /> : null}

      {report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Income" value={summary.income.toFixed(2)} />
          <StatCard label="Expense" value={summary.expense.toFixed(2)} />
          <StatCard label="Profit" value={summary.profit.toFixed(2)} />
        </div>
      ) : null}

      {report ? (
        <Card>
          <CardHeader>
            <CardTitle>Statement window</CardTitle>
            <CardDescription>
              {report.period.from} to {report.period.to}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {report ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income ledgers</CardTitle>
              <CardDescription>Revenue recognized in the selected reporting window.</CardDescription>
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
                    {incomeRows.length === 0 ? (
                      <DataEmptyRow colSpan={2} title="No income activity in this period." />
                    ) : (
                      incomeRows.map((row) => (
                        <DataTr key={row.ledger_id}>
                          <DataTd>
                            <Link className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]" href={`/c/${companyId}/accounting/ledgers`}>
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

          <Card>
            <CardHeader>
              <CardTitle>Expense ledgers</CardTitle>
              <CardDescription>Cost and operating expenses hitting the selected period.</CardDescription>
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
                    {expenseRows.length === 0 ? (
                      <DataEmptyRow colSpan={2} title="No expense activity in this period." />
                    ) : (
                      expenseRows.map((row) => (
                        <DataTr key={row.ledger_id}>
                          <DataTd>
                            <Link className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]" href={`/c/${companyId}/accounting/ledgers`}>
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
        </div>
      ) : null}
    </div>
  );
}
