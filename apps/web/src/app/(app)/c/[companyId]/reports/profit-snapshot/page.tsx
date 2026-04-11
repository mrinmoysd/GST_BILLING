"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import {
  type ReportSeriesGrain,
  useProfitSnapshot,
  useProfitSnapshotSeries,
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

export default function ProfitSnapshotPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [grain, setGrain] = React.useState<ReportSeriesGrain>("week");

  const query = useProfitSnapshot({
    companyId,
    from: from || undefined,
    to: to || undefined,
  });
  const seriesQuery = useProfitSnapshotSeries({
    companyId,
    from: from || undefined,
    to: to || undefined,
    grain,
  });

  const data = query.data?.data;
  const revenue = data?.revenue ?? null;
  const cogs = data?.cogs ?? null;
  const grossProfit = data?.gross_profit ?? null;
  const netProfit = data?.net_profit ?? null;
  const margin = revenue && revenue > 0 && netProfit != null ? netProfit / revenue : null;

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
        title="Profit snapshot"
        subtitle="Review estimated revenue, COGS proxy, and margin as a real period trend while keeping the existing finance note visible."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Select the period and grain you want to compare for gross and net performance.</CardDescription>
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
      {seriesQuery.isError ? <InlineError message={getErrorMessage(seriesQuery.error, "Failed to load profit trends")} /> : null}

      {query.data && (revenue != null || cogs != null || grossProfit != null || netProfit != null) ? (
        <div className="grid gap-4 md:grid-cols-4">
          {revenue != null ? <StatCard label="Revenue" value={formatChartCurrency(revenue)} /> : null}
          {cogs != null ? <StatCard label="COGS" value={formatChartCurrency(cogs)} /> : null}
          {grossProfit != null ? <StatCard label="Gross profit" value={formatChartCurrency(grossProfit)} /> : null}
          {netProfit != null ? (
            <StatCard
              label="Net profit"
              value={formatChartCurrency(netProfit)}
              hint={margin != null ? `${(margin * 100).toFixed(1)}% net margin` : undefined}
            />
          ) : null}
        </div>
      ) : null}

      {seriesQuery.data ? (
        trendRows.length ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartShell
              title="Revenue versus COGS trend"
              subtitle="See how sales and the current COGS proxy move together across the selected period."
              footer={
                <ChartLegend
                  items={[
                    { label: "Revenue", tone: "primary" },
                    { label: "COGS", tone: "warning" },
                    { label: "Net profit", tone: "success" },
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
                    <linearGradient id="profitRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartSeriesColor("primary")} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={getChartSeriesColor("primary")} stopOpacity={0.04} />
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
                    dataKey="revenue"
                    name="Revenue"
                    stroke={getChartSeriesColor("primary")}
                    fill="url(#profitRevenueFill)"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="cogs"
                    name="COGS"
                    stroke={getChartSeriesColor("warning")}
                    strokeWidth={2.25}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_profit"
                    name="Net profit"
                    stroke={getChartSeriesColor("success")}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ChartFrame>
            </ChartShell>

            <ChartShell
              title="Margin trend"
              subtitle="Compare gross margin and net margin percentages without hiding the estimated nature of the numbers."
              footer={data?.is_estimate ? "All profit trend values are estimated until true inventory costing is introduced." : undefined}
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
                    yAxisId="currency"
                    tickFormatter={formatChartCompactNumber}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={76}
                  />
                  <YAxis
                    yAxisId="margin"
                    orientation="right"
                    tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                    tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <ChartTooltip
                    valueFormatter={formatChartCompactNumber}
                    labelFormatter={(label) => formatChartDateTick(String(label), { day: "2-digit", month: "short", year: "numeric" })}
                  />
                  <Area
                    yAxisId="currency"
                    type="monotone"
                    dataKey="gross_profit"
                    name="Gross profit"
                    stroke={getChartSeriesColor("secondary")}
                    fill={getChartSeriesColor("secondary")}
                    fillOpacity={0.16}
                    strokeWidth={2.25}
                  />
                  <Line
                    yAxisId="margin"
                    type="monotone"
                    dataKey="net_margin_percent"
                    name="Net margin %"
                    stroke={getChartSeriesColor("info")}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartFrame>
            </ChartShell>
          </div>
        ) : (
          <ChartEmptyState
            title="No profit trend data"
            hint="Issue invoices and receive purchases in the selected period to see estimated margin trends."
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
                    <DataTh>Revenue</DataTh>
                    <DataTh>COGS</DataTh>
                    <DataTh>Gross profit</DataTh>
                    <DataTh>Net profit</DataTh>
                    <DataTh>Net margin</DataTh>
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
                        <DataTd>{formatChartCurrency(row.revenue)}</DataTd>
                        <DataTd>{formatChartCurrency(row.cogs)}</DataTd>
                        <DataTd>{formatChartCurrency(row.gross_profit)}</DataTd>
                        <DataTd>{formatChartCurrency(row.net_profit)}</DataTd>
                        <DataTd>{row.net_margin_percent.toFixed(1)}%</DataTd>
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
            <CardTitle>Estimation note</CardTitle>
            <CardDescription>Current profitability is derived from an interim costing approach.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
              {data?.note ?? "Profitability notes are unavailable for the selected range."}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
