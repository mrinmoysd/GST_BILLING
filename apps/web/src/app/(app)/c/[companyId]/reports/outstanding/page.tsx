"use client";

import * as React from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type OutstandingInvoiceRow, useOutstandingInvoices } from "@/lib/reports/hooks";
import { formatDateLabel } from "@/lib/format/date";
import {
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartCompactNumber,
  formatChartCurrency,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function OutstandingInvoicesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [bucketFilter, setBucketFilter] = React.useState<string>("");
  const [customerFocus, setCustomerFocus] = React.useState<string>("");
  const query = useOutstandingInvoices({ companyId: companyId, q: q || undefined, page: 1, limit: 50 });

  const payload = query.data?.data as OutstandingInvoiceRow[] | { data?: OutstandingInvoiceRow[] } | undefined;
  const rows = Array.isArray(payload)
    ? payload
    : (payload?.data ?? []);
  const bucketMap = [
    { key: "current", label: "Current", amount: 0 },
    { key: "1_30", label: "1-30 days", amount: 0 },
    { key: "31_60", label: "31-60 days", amount: 0 },
    { key: "61_90", label: "61-90 days", amount: 0 },
    { key: "90_plus", label: "90+ days", amount: 0 },
  ];
  const customerDueMap = new Map<string, { customerId: string; customer: string; amount: number }>();

  function getBucketKey(overdueDays: number) {
    if (overdueDays <= 0) return "current";
    if (overdueDays <= 30) return "1_30";
    if (overdueDays <= 60) return "31_60";
    if (overdueDays <= 90) return "61_90";
    return "90_plus";
  }

  for (const row of rows) {
    const dueAmount = Number(row.amount_due ?? 0);
    const overdueDays = Number(row.overdue_days ?? 0);
    const bucketKey = getBucketKey(overdueDays);
    const bucket = bucketMap.find((entry) => entry.key === bucketKey);
    if (bucket) bucket.amount += dueAmount;

    const key = row.customer_id ?? row.customer_name;
    const current = customerDueMap.get(key);
    customerDueMap.set(key, {
      customerId: row.customer_id,
      customer: row.customer_name ?? "Unknown customer",
      amount: (current?.amount ?? 0) + dueAmount,
    });
  }

  const topCustomerRows = Array.from(customerDueMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
      .map((row) => ({
        ...row,
        label: row.customer.length > 18 ? `${row.customer.slice(0, 18)}…` : row.customer,
      }));
  const totalOutstanding = rows.reduce((sum, row) => sum + Number(row.amount_due ?? 0), 0);
  const overdueCount = rows.filter((row) => Number(row.overdue_days ?? 0) > 0).length;
  const visibleRows = rows.filter((row) => {
    const matchesBucket = bucketFilter ? getBucketKey(Number(row.overdue_days ?? 0)) === bucketFilter : true;
    const matchesCustomer = customerFocus ? row.customer_id === customerFocus : true;
    return matchesBucket && matchesCustomer;
  });

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
        <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell
          title="Aging exposure"
          subtitle="Outstanding balances grouped by how late they are, so finance can spot pressure faster."
          footer={`${overdueCount} overdue invoice(s) across ${rows.length} open invoice(s).${bucketFilter ? ` Bucket focus: ${bucketMap.find((entry) => entry.key === bucketFilter)?.label}.` : ""}`}
        >
          <ChartLegend
            items={[
              { label: "Total outstanding", tone: "primary", value: formatChartCurrency(totalOutstanding) },
              { label: "Overdue invoices", tone: "warning", value: String(overdueCount) },
            ]}
            className="mb-4"
          />
          <ChartFrame height={300}>
            <BarChart data={bucketMap} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid stroke={getChartGridColor()} vertical={false} />
                <XAxis dataKey="label" stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                <YAxis stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                <ChartTooltip valueFormatter={formatChartCurrency} />
                <Bar dataKey="amount" name="Amount due" radius={[10, 10, 0, 0]}>
                  {bucketMap.map((row) => (
                    <Cell
                      key={row.key}
                      fill={getChartSeriesColor(bucketFilter === row.key ? "primary" : "warning")}
                      className="cursor-pointer"
                      onClick={() => setBucketFilter((current) => (current === row.key ? "" : row.key))}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>

          <ChartShell
            title="Top due customers"
            subtitle="The customers currently contributing the largest open balances."
            footer={customerFocus ? "Customer focus applied to the table below." : "Click a customer bar to focus the receivables table."}
          >
            <ChartFrame height={300}>
              <BarChart data={topCustomerRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={getChartGridColor()} horizontal={false} />
                <XAxis type="number" stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                <YAxis dataKey="label" type="category" width={110} stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                <ChartTooltip
                  labelFormatter={(label) => topCustomerRows.find((row) => row.label === label)?.customer ?? String(label)}
                  valueFormatter={formatChartCurrency}
                />
                <Bar dataKey="amount" name="Amount due" radius={[0, 10, 10, 0]}>
                  {topCustomerRows.map((row) => (
                    <Cell
                      key={row.customerId}
                      fill={getChartSeriesColor(customerFocus === row.customerId ? "accent" : "primary")}
                      className="cursor-pointer"
                      onClick={() => setCustomerFocus((current) => (current === row.customerId ? "" : row.customerId))}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>
        </div>
      ) : null}

      {query.data && rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Receivables</CardTitle>
            <CardDescription>
              Current invoice balances that remain open.
              {bucketFilter || customerFocus ? " Chart focus is applied to the rows below." : ""}
            </CardDescription>
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
                  {visibleRows.map((r, idx) => (
                    <DataTr
                      key={`${r.invoice_id ?? "row"}-${idx}`}
                      className={
                        (customerFocus && r.customer_id === customerFocus) || (bucketFilter && getBucketKey(Number(r.overdue_days ?? 0)) === bucketFilter)
                          ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                          : undefined
                      }
                    >
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
                      <DataTd>{formatDateLabel(r.issue_date)}</DataTd>
                      <DataTd>{formatDateLabel(r.due_date)}</DataTd>
                      <DataTd className="text-right">{Number(r.amount_due ?? 0).toFixed(2)}</DataTd>
                      <DataTd className="text-right">{r.overdue_days ?? 0}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
            {(bucketFilter || customerFocus) && visibleRows.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {bucketFilter ? (
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
                    onClick={() => setBucketFilter("")}
                  >
                    Clear bucket focus
                  </button>
                ) : null}
                {customerFocus ? (
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
                    onClick={() => setCustomerFocus("")}
                  >
                    Clear customer focus
                  </button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
