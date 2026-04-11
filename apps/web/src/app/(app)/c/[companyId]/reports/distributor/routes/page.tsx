"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { type RouteCoverageRow, type RouteOutstandingRow, useRouteCoverage, useRouteOutstanding } from "@/lib/reports/hooks";
import {
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartCompactNumber,
  formatChartCurrency,
  formatChartPercent,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspacePanel } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function RouteCoverageReportPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [asOf, setAsOf] = React.useState("");

  const coverage = useRouteCoverage({ companyId, from: from || undefined, to: to || undefined });
  const outstanding = useRouteOutstanding({ companyId, asOf: asOf || undefined });

  const coveragePayload = coverage.data?.data as RouteCoverageRow[] | { data?: RouteCoverageRow[] } | undefined;
  const outstandingPayload = outstanding.data?.data as RouteOutstandingRow[] | { data?: RouteOutstandingRow[] } | undefined;
  const coverageRows = React.useMemo(
    () => (Array.isArray(coveragePayload) ? coveragePayload : (coveragePayload?.data ?? [])),
    [coveragePayload],
  );
  const outstandingRows = React.useMemo(
    () => (Array.isArray(outstandingPayload) ? outstandingPayload : (outstandingPayload?.data ?? [])),
    [outstandingPayload],
  );
  const totalPlanned = coverageRows.reduce((sum, row) => sum + row.planned_visits, 0);
  const totalCompleted = coverageRows.reduce((sum, row) => sum + row.completed_visits, 0);
  const totalOutstanding = outstandingRows.reduce((sum, row) => sum + row.outstanding_amount, 0);
  const routeCoverageChartRows = React.useMemo(
    () =>
      coverageRows.slice(0, 8).map((row) => ({
        route: row.route_name,
        completionPercent: row.completion_percent / 100,
        productiveVisits: row.productive_visits,
        missedVisits: row.missed_visits,
      })),
    [coverageRows],
  );
  const routeOutstandingChartRows = React.useMemo(
    () =>
      outstandingRows.slice(0, 8).map((row) => ({
        route: row.route_name,
        outstandingAmount: row.outstanding_amount,
      })),
    [outstandingRows],
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Distributor reports"
        title="Route coverage"
        subtitle="See whether routes were covered, which ones were productive, and where receivable pressure is building."
      />

      <WorkspacePanel title="Filters" subtitle="Use one date window for route execution and an optional as-of date for dues.">
        <div className="grid gap-4 md:grid-cols-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
          <DateField label="Outstanding as of" value={asOf} onChange={setAsOf} />
        </div>
      </WorkspacePanel>

      {coverage.isLoading || outstanding.isLoading ? <LoadingBlock label="Loading route report…" /> : null}
      {coverage.isError ? <InlineError message={getErrorMessage(coverage.error, "Failed to load route coverage")} /> : null}
      {outstanding.isError ? <InlineError message={getErrorMessage(outstanding.error, "Failed to load route outstanding")} /> : null}

      {!coverage.isLoading && !outstanding.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Planned visits" value={String(totalPlanned)} />
          <StatCard label="Completed visits" value={String(totalCompleted)} />
          <StatCard label="Outstanding" value={totalOutstanding.toFixed(2)} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell
          title="Route completion"
          subtitle="Keep route discipline visible by comparing productive coverage against missed workload."
          footer={<ChartLegend items={[{ label: "Completion", tone: "primary" }, { label: "Missed visits", tone: "warning" }]} />}
        >
          <ChartFrame height={320}>
            <BarChart data={routeCoverageChartRows} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke={getChartGridColor()} />
              <XAxis dataKey="route" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="percent" tickFormatter={formatChartPercent} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
              <YAxis yAxisId="count" orientation="right" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
              <ChartTooltip valueFormatter={formatChartCompactNumber} />
              <Bar yAxisId="percent" dataKey="completionPercent" fill={getChartSeriesColor("primary")} radius={[8, 8, 0, 0]} />
              <Bar yAxisId="count" dataKey="missedVisits" fill={getChartSeriesColor("warning")} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </ChartShell>

        <ChartShell
          title="Outstanding by route"
          subtitle="Receivable pressure should follow route productivity, not surprise it."
        >
          <ChartFrame height={320}>
            <BarChart data={routeOutstandingChartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
              <CartesianGrid horizontal={false} stroke={getChartGridColor()} />
              <XAxis type="number" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="route" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={88} />
              <ChartTooltip valueFormatter={formatChartCurrency} />
              <Bar dataKey="outstandingAmount" radius={[0, 8, 8, 0]}>
                {routeOutstandingChartRows.map((row) => (
                  <Cell key={row.route} fill={getChartSeriesColor("danger")} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </ChartShell>
      </div>

      <WorkspacePanel title="Coverage by route" subtitle="Planned, completed, missed, and productive counts grouped by route.">
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Route</DataTh>
                <DataTh>Planned</DataTh>
                <DataTh>Completed</DataTh>
                <DataTh>Missed</DataTh>
                <DataTh>Productive</DataTh>
                <DataTh>Completion %</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {coverageRows.map((row) => (
                <DataTr key={row.route_id ?? row.route_name}>
                  <DataTd>{row.route_name}</DataTd>
                  <DataTd>{row.planned_visits}</DataTd>
                  <DataTd>{row.completed_visits}</DataTd>
                  <DataTd>{row.missed_visits}</DataTd>
                  <DataTd>{row.productive_visits}</DataTd>
                  <DataTd>{row.completion_percent.toFixed(2)}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Outstanding by route" subtitle="Receivable pressure only where route-linked field orders have already flowed into billing.">
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Route</DataTh>
                <DataTh>Open invoices</DataTh>
                <DataTh>Outstanding</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {outstandingRows.map((row) => (
                <DataTr key={row.route_id ?? row.route_name}>
                  <DataTd>{row.route_name}</DataTd>
                  <DataTd>{row.invoices_count}</DataTd>
                  <DataTd>{row.outstanding_amount.toFixed(2)}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
