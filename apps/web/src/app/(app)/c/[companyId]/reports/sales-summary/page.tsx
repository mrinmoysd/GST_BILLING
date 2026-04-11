"use client";

import * as React from "react";
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { useSalesSummary, useSalesSummarySeries, type ReportSeriesGrain } from "@/lib/reports/hooks";
import { formatDateLabel } from "@/lib/format/date";
import {
  ChartEmptyState,
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartCompactNumber,
  formatChartCurrency,
  formatChartDateTick,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField, SelectField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";

type Props = { params: Promise<{ companyId: string }> };

const grainOptions: Array<{ value: ReportSeriesGrain; label: string }> = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

function getClickedPeriod(state: unknown) {
  if (!state || typeof state !== "object" || !("activePayload" in state)) return null;
  const activePayload = (state as { activePayload?: Array<{ payload?: { period?: string } }> }).activePayload;
  const period = activePayload?.[0]?.payload?.period;
  return typeof period === "string" ? period : null;
}

export default function SalesSummaryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [grain, setGrain] = React.useState<ReportSeriesGrain>("week");

  const query = useSalesSummary({
    companyId,
    from: from || undefined,
    to: to || undefined,
  });
  const seriesQuery = useSalesSummarySeries({
    companyId,
    from: from || undefined,
    to: to || undefined,
    grain,
  });

  const data = query.data?.data;
  const grossSales = data?.gross_sales ?? null;
  const netSales = data?.net_sales ?? null;
  const invoicesCount = data?.invoices_count ?? null;
  const averageInvoice = data?.average_invoice ?? null;
  const taxTotal = data?.tax_total ?? null;
  const amountPaid = data?.amount_paid ?? null;
  const balanceDue = data?.balance_due ?? null;

  const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null);
  const seriesRows = Array.isArray(seriesQuery.data?.data) ? seriesQuery.data.data : [];
  const trendRows = seriesRows.map((row) => ({
    ...row,
    label: row.period_start,
  }));
  const focusedRows = selectedPeriod
    ? trendRows.filter((row) => row.period === selectedPeriod)
    : trendRows;
  const selectedWindow = selectedPeriod
    ? trendRows.find((row) => row.period === selectedPeriod)
    : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Sales summary"
        subtitle="Track topline sales performance, invoice count, realized collections, and invoice quality through real period trends."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Choose the range and trend grain you want to inspect.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
          <SelectField
            label="Trend grain"
            value={grain}
            onChange={(value) => setGrain((value as ReportSeriesGrain) || "week")}
            options={grainOptions}
          />
        </CardContent>
      </Card>

      {query.isLoading || seriesQuery.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}
      {seriesQuery.isError ? <InlineError message={getErrorMessage(seriesQuery.error, "Failed to load sales trends")} /> : null}

      {query.data && (grossSales != null || netSales != null || invoicesCount != null || averageInvoice != null) ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {grossSales != null ? <StatCard label="Gross sales" value={formatChartCurrency(grossSales)} /> : null}
          {netSales != null ? <StatCard label="Net sales" value={formatChartCurrency(netSales)} /> : null}
          {invoicesCount != null ? <StatCard label="Invoices" value={invoicesCount} /> : null}
          {averageInvoice != null ? <StatCard label="Avg invoice" value={formatChartCurrency(averageInvoice)} /> : null}
        </div>
      ) : null}

      {seriesQuery.data ? (
        trendRows.length ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartShell
              title="Revenue and collections trend"
              subtitle="Track billed sales, realized collections, and open dues by period."
              footer={
                <ChartLegend
                  items={[
                    { label: "Gross sales", tone: "primary" },
                    { label: "Amount paid", tone: "success" },
                    { label: "Balance due", tone: "warning" },
                  ]}
                />
              }
            >
              <ChartFrame height={340}>
                <AreaChart
                  data={trendRows}
                  margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                  onClick={(state: unknown) => {
                    const period = getClickedPeriod(state);
                    if (period) {
                      setSelectedPeriod((current) => (current === period ? null : period));
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="salesGrossFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartSeriesColor("primary")} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={getChartSeriesColor("primary")} stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="salesPaidFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartSeriesColor("success")} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={getChartSeriesColor("success")} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={getChartGridColor()} />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(value) => formatChartDateTick(value)}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatChartCompactNumber}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={76}
                  />
                  <ChartTooltip
                    valueFormatter={formatChartCurrency}
                    labelFormatter={(label) => formatChartDateTick(String(label), { day: "2-digit", month: "short", year: "numeric" })}
                  />
                  <Area
                    type="monotone"
                    dataKey="gross_sales"
                    name="Gross sales"
                    stroke={getChartSeriesColor("primary")}
                    fill="url(#salesGrossFill)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount_paid"
                    name="Amount paid"
                    stroke={getChartSeriesColor("success")}
                    fill="url(#salesPaidFill)"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance_due"
                    name="Balance due"
                    stroke={getChartSeriesColor("warning")}
                    strokeWidth={2.25}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ChartFrame>
            </ChartShell>

            <ChartShell
              title="Invoice quality by period"
              subtitle="Compare invoice throughput with average invoice value over the same reporting window."
              footer={
                <ChartLegend
                  items={[
                    { label: "Invoices", tone: "info" },
                    { label: "Average invoice", tone: "secondary" },
                  ]}
                />
              }
            >
              <ChartFrame height={340}>
                <ComposedChart
                  data={trendRows}
                  margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                  onClick={(state: unknown) => {
                    const period = getClickedPeriod(state);
                    if (period) {
                      setSelectedPeriod((current) => (current === period ? null : period));
                    }
                  }}
                >
                  <CartesianGrid vertical={false} stroke={getChartGridColor()} />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(value) => formatChartDateTick(value)}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="count"
                    tickFormatter={formatChartCompactNumber}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <YAxis
                    yAxisId="amount"
                    orientation="right"
                    tickFormatter={formatChartCompactNumber}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={76}
                  />
                  <ChartTooltip
                    valueFormatter={formatChartCompactNumber}
                    labelFormatter={(label) => formatChartDateTick(String(label), { day: "2-digit", month: "short", year: "numeric" })}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="invoices_count"
                    name="Invoices"
                    fill={getChartSeriesColor("info")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId="amount"
                    type="monotone"
                    dataKey="average_invoice"
                    name="Average invoice"
                    stroke={getChartSeriesColor("secondary")}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartFrame>
            </ChartShell>
          </div>
        ) : (
          <ChartEmptyState
            title="No sales trend data"
            hint="Expand the reporting window or issue invoices in the selected period to see revenue and collection trends."
          />
        )
      ) : null}

      {seriesQuery.data && trendRows.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Period detail register</CardTitle>
            <CardDescription>
              {selectedWindow
                ? `Focused on ${formatDateLabel(selectedWindow.period_start)} to ${formatDateLabel(selectedWindow.period_end)}.`
                : "Click any chart period above to focus the register below."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedWindow ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setSelectedPeriod(null)}>
                  Clear period focus
                </Button>
                <div className="text-sm text-[var(--muted)]">
                  Showing {focusedRows.length} of {trendRows.length} period rows.
                </div>
              </div>
            ) : null}
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Period</DataTh>
                    <DataTh>Gross sales</DataTh>
                    <DataTh>Net sales</DataTh>
                    <DataTh>Amount paid</DataTh>
                    <DataTh>Balance due</DataTh>
                    <DataTh>Invoices</DataTh>
                    <DataTh>Avg invoice</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {focusedRows.length ? (
                    focusedRows.map((row) => (
                      <DataTr
                        key={row.period}
                        className={selectedPeriod === row.period ? "bg-[var(--accent-soft)]/60" : undefined}
                      >
                        <DataTd>{formatDateLabel(row.period_start)} to {formatDateLabel(row.period_end)}</DataTd>
                        <DataTd>{formatChartCurrency(row.gross_sales)}</DataTd>
                        <DataTd>{formatChartCurrency(row.net_sales)}</DataTd>
                        <DataTd>{formatChartCurrency(row.amount_paid)}</DataTd>
                        <DataTd>{formatChartCurrency(row.balance_due)}</DataTd>
                        <DataTd>{row.invoices_count}</DataTd>
                        <DataTd>{formatChartCurrency(row.average_invoice)}</DataTd>
                      </DataTr>
                    ))
                  ) : (
                    <DataEmptyRow colSpan={7} title="No period data" hint="Try a wider reporting window." />
                  )}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}

      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Collection performance</CardTitle>
            <CardDescription>Track tax, collections, and open receivables for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard label="Tax total" value={taxTotal != null ? formatChartCurrency(taxTotal) : formatChartCurrency(0)} />
            <StatCard label="Amount paid" value={amountPaid != null ? formatChartCurrency(amountPaid) : formatChartCurrency(0)} />
            <StatCard label="Balance due" value={balanceDue != null ? formatChartCurrency(balanceDue) : formatChartCurrency(0)} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
