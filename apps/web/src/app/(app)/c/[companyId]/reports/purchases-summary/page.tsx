"use client";

import * as React from "react";
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import {
  type ReportSeriesGrain,
  usePurchasesSummary,
  usePurchasesSummarySeries,
} from "@/lib/reports/hooks";
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

export default function PurchasesSummaryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [grain, setGrain] = React.useState<ReportSeriesGrain>("week");

  const query = usePurchasesSummary({
    companyId,
    from: from || undefined,
    to: to || undefined,
  });
  const seriesQuery = usePurchasesSummarySeries({
    companyId,
    from: from || undefined,
    to: to || undefined,
    grain,
  });

  const data = query.data?.data;
  const grossPurchases = data?.gross_purchases ?? null;
  const netPurchases = data?.net_purchases ?? null;
  const purchasesCount = data?.purchases_count ?? null;
  const averagePurchase = data?.average_purchase ?? null;
  const taxTotal = data?.tax_total ?? null;

  const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null);
  const trendRows = (Array.isArray(seriesQuery.data?.data) ? seriesQuery.data.data : []).map((row) => ({
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
        title="Purchases summary"
        subtitle="Track supplier spend, purchase throughput, and tax-bearing spend as true period trends instead of flat snapshots."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Use this range and grain to inspect how spend shifted over time.</CardDescription>
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
      {seriesQuery.isError ? <InlineError message={getErrorMessage(seriesQuery.error, "Failed to load purchase trends")} /> : null}

      {query.data && (grossPurchases != null || netPurchases != null || purchasesCount != null || averagePurchase != null) ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {grossPurchases != null ? <StatCard label="Gross purchases" value={formatChartCurrency(grossPurchases)} /> : null}
          {netPurchases != null ? <StatCard label="Net purchases" value={formatChartCurrency(netPurchases)} /> : null}
          {purchasesCount != null ? <StatCard label="Purchases" value={purchasesCount} /> : null}
          {averagePurchase != null ? <StatCard label="Avg purchase" value={formatChartCurrency(averagePurchase)} /> : null}
        </div>
      ) : null}

      {seriesQuery.data ? (
        trendRows.length ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartShell
              title="Purchase spend trend"
              subtitle="Track gross and net spend by period so supplier intensity becomes obvious."
              footer={
                <ChartLegend
                  items={[
                    { label: "Gross purchases", tone: "primary" },
                    { label: "Net purchases", tone: "secondary" },
                    { label: "Tax total", tone: "warning" },
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
                    <linearGradient id="purchaseGrossFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartSeriesColor("primary")} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={getChartSeriesColor("primary")} stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="purchaseNetFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartSeriesColor("secondary")} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={getChartSeriesColor("secondary")} stopOpacity={0.03} />
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
                    dataKey="gross_purchases"
                    name="Gross purchases"
                    stroke={getChartSeriesColor("primary")}
                    fill="url(#purchaseGrossFill)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="net_purchases"
                    name="Net purchases"
                    stroke={getChartSeriesColor("secondary")}
                    fill="url(#purchaseNetFill)"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="tax_total"
                    name="Tax total"
                    stroke={getChartSeriesColor("warning")}
                    strokeWidth={2.25}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ChartFrame>
            </ChartShell>

            <ChartShell
              title="Purchase throughput by period"
              subtitle="Watch purchase document count beside average bill value to see whether spend is broad-based or concentrated."
              footer={
                <ChartLegend
                  items={[
                    { label: "Purchases", tone: "info" },
                    { label: "Average purchase", tone: "success" },
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
                    dataKey="purchases_count"
                    name="Purchases"
                    fill={getChartSeriesColor("info")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId="amount"
                    type="monotone"
                    dataKey="average_purchase"
                    name="Average purchase"
                    stroke={getChartSeriesColor("success")}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartFrame>
            </ChartShell>
          </div>
        ) : (
          <ChartEmptyState
            title="No purchase trend data"
            hint="Receive or draft purchases in the selected period to populate spend and throughput trends."
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
                    <DataTh>Gross purchases</DataTh>
                    <DataTh>Net purchases</DataTh>
                    <DataTh>Tax total</DataTh>
                    <DataTh>Purchases</DataTh>
                    <DataTh>Avg purchase</DataTh>
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
                        <DataTd>{formatChartCurrency(row.gross_purchases)}</DataTd>
                        <DataTd>{formatChartCurrency(row.net_purchases)}</DataTd>
                        <DataTd>{formatChartCurrency(row.tax_total)}</DataTd>
                        <DataTd>{row.purchases_count}</DataTd>
                        <DataTd>{formatChartCurrency(row.average_purchase)}</DataTd>
                      </DataTr>
                    ))
                  ) : (
                    <DataEmptyRow colSpan={6} title="No period data" hint="Try a wider reporting window." />
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
            <CardTitle>Tax overview</CardTitle>
            <CardDescription>Monitor the tax component embedded in the selected purchase range.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-1">
            <StatCard label="Tax total" value={taxTotal != null ? formatChartCurrency(taxTotal) : formatChartCurrency(0)} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
