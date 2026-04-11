"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type SalespersonCollectionsRow,
  type SalespersonOutstandingRow,
  type SalespersonSalesRow,
  useCollectionsBySalesperson,
  useOutstandingBySalesperson,
  useSalesBySalesperson,
} from "@/lib/reports/hooks";
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
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


function formatMoney(value: number) {
  return value.toFixed(2);
}

export default function SalesTeamReportPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [asOf, setAsOf] = React.useState("");

  const sales = useSalesBySalesperson({ companyId, from: from || undefined, to: to || undefined });
  const collections = useCollectionsBySalesperson({ companyId, from: from || undefined, to: to || undefined });
  const outstanding = useOutstandingBySalesperson({ companyId, asOf: asOf || undefined });

  const salesPayload = sales.data?.data as SalespersonSalesRow[] | { data?: SalespersonSalesRow[] } | undefined;
  const collectionsPayload = collections.data?.data as SalespersonCollectionsRow[] | { data?: SalespersonCollectionsRow[] } | undefined;
  const outstandingPayload = outstanding.data?.data as SalespersonOutstandingRow[] | { data?: SalespersonOutstandingRow[] } | undefined;
  const salesRows = React.useMemo(
    () => (Array.isArray(salesPayload) ? salesPayload : (salesPayload?.data ?? [])),
    [salesPayload],
  );
  const collectionRows = React.useMemo(
    () => (Array.isArray(collectionsPayload) ? collectionsPayload : (collectionsPayload?.data ?? [])),
    [collectionsPayload],
  );
  const outstandingRows = React.useMemo(
    () => (Array.isArray(outstandingPayload) ? outstandingPayload : (outstandingPayload?.data ?? [])),
    [outstandingPayload],
  );

  const totalSales = salesRows.reduce((sum, row) => sum + row.gross_sales, 0);
  const totalCollections = collectionRows.reduce((sum, row) => sum + row.collections_amount, 0);
  const totalOutstanding = outstandingRows.reduce((sum, row) => sum + row.outstanding_amount, 0);
  const salesChartRows = React.useMemo(
    () =>
      salesRows.slice(0, 8).map((row) => ({
        name: row.salesperson_name,
        grossSales: row.gross_sales,
        amountPaid: row.amount_paid,
        amountDue: row.amount_due,
      })),
    [salesRows],
  );
  const collectionsChartRows = React.useMemo(
    () =>
      collectionRows.slice(0, 8).map((row) => ({
        name: row.salesperson_name,
        collections: row.collections_amount,
      })),
    [collectionRows],
  );
  const outstandingChartRows = React.useMemo(
    () =>
      outstandingRows.slice(0, 8).map((row) => ({
        name: row.salesperson_name,
        outstanding: row.outstanding_amount,
      })),
    [outstandingRows],
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Distributor reports"
        title="Sales team performance"
        subtitle="Review sales ownership, collections pace, and outstanding exposure by salesperson."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Use one period for sales and collections, and an optional as-of date for dues.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
          <DateField label="Outstanding as of" value={asOf} onChange={setAsOf} />
        </CardContent>
      </Card>

      {sales.isLoading || collections.isLoading || outstanding.isLoading ? (
        <LoadingBlock label="Loading sales team report…" />
      ) : null}

      {sales.isError ? <InlineError message={getErrorMessage(sales.error, "Failed to load sales by salesperson")} /> : null}
      {collections.isError ? (
        <InlineError message={getErrorMessage(collections.error, "Failed to load collections by salesperson")} />
      ) : null}
      {outstanding.isError ? (
        <InlineError message={getErrorMessage(outstanding.error, "Failed to load outstanding by salesperson")} />
      ) : null}

      {!sales.isLoading && !collections.isLoading && !outstanding.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Gross sales" value={formatMoney(totalSales)} />
          <StatCard label="Collections" value={formatMoney(totalCollections)} />
          <StatCard label="Outstanding" value={formatMoney(totalOutstanding)} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell
          title="Sales ownership mix"
          subtitle="Compare billed, collected, and still-due value by salesperson."
          footer={
            <ChartLegend
              items={[
                { label: "Gross sales", tone: "primary", value: formatChartCurrency(totalSales) },
                { label: "Collected", tone: "success", value: formatChartCurrency(totalCollections) },
                { label: "Due", tone: "warning", value: formatChartCurrency(totalOutstanding) },
              ]}
            />
          }
        >
          <ChartFrame height={340}>
            <BarChart data={salesChartRows} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke={getChartGridColor()} />
              <XAxis dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
              <ChartTooltip valueFormatter={formatChartCurrency} />
              <Bar dataKey="grossSales" fill={getChartSeriesColor("primary")} radius={[8, 8, 0, 0]} />
              <Bar dataKey="amountPaid" fill={getChartSeriesColor("success")} radius={[8, 8, 0, 0]} />
              <Bar dataKey="amountDue" fill={getChartSeriesColor("warning")} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </ChartShell>

        <div className="grid gap-6">
          <ChartShell
            title="Collections by salesperson"
            subtitle="Who is actually closing the loop from billing into receipts."
          >
            <ChartFrame height={170}>
              <BarChart data={collectionsChartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                <CartesianGrid horizontal={false} stroke={getChartGridColor()} />
                <XAxis type="number" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={96} />
                <ChartTooltip valueFormatter={formatChartCurrency} />
                <Bar dataKey="collections" radius={[0, 8, 8, 0]}>
                  {collectionsChartRows.map((row) => (
                    <Cell key={row.name} fill={getChartSeriesColor("secondary")} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>

          <ChartShell
            title="Outstanding concentration"
            subtitle="Use this to spot which reps need credit-control support."
          >
            <ChartFrame height={170}>
              <BarChart data={outstandingChartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                <CartesianGrid horizontal={false} stroke={getChartGridColor()} />
                <XAxis type="number" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={96} />
                <ChartTooltip valueFormatter={formatChartCurrency} />
                <Bar dataKey="outstanding" radius={[0, 8, 8, 0]}>
                  {outstandingChartRows.map((row) => (
                    <Cell key={row.name} fill={getChartSeriesColor("warning")} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales ownership</CardTitle>
          <CardDescription>Invoices, paid amount, and due amount grouped by salesperson.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Salesperson</DataTh>
                  <DataTh>Email</DataTh>
                  <DataTh>Invoices</DataTh>
                  <DataTh>Gross sales</DataTh>
                  <DataTh>Collected</DataTh>
                  <DataTh>Due</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {salesRows.map((row) => (
                  <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                    <DataTd>{row.salesperson_name}</DataTd>
                    <DataTd>{row.salesperson_email ?? "—"}</DataTd>
                    <DataTd>{row.invoices_count}</DataTd>
                    <DataTd>{formatMoney(row.gross_sales)}</DataTd>
                    <DataTd>{formatMoney(row.amount_paid)}</DataTd>
                    <DataTd>{formatMoney(row.amount_due)}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collections by salesperson</CardTitle>
            <CardDescription>Payment receipts tied back to invoice ownership.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Salesperson</DataTh>
                    <DataTh>Payments</DataTh>
                    <DataTh>Collections</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {collectionRows.map((row) => (
                    <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                      <DataTd>{row.salesperson_name}</DataTd>
                      <DataTd>{row.payments_count}</DataTd>
                      <DataTd>{formatMoney(row.collections_amount)}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding by salesperson</CardTitle>
            <CardDescription>Open dues grouped by the invoice owner.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Salesperson</DataTh>
                    <DataTh>Open invoices</DataTh>
                    <DataTh>Outstanding</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {outstandingRows.map((row) => (
                    <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                      <DataTd>{row.salesperson_name}</DataTd>
                      <DataTd>{row.invoices_count}</DataTd>
                      <DataTd>{formatMoney(row.outstanding_amount)}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
