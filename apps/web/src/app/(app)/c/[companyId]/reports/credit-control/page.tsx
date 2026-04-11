"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  type CreditControlDashboardReport,
  type PayableAgingRow,
  type ReceivableAgingRow,
  useBankingReconciliationSummary,
  useCreditControlDashboard,
  usePayableAging,
  useReceivableAging,
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
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";


function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = { params: Promise<{ companyId: string }> };

export default function CreditControlReportPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [asOf, setAsOf] = React.useState("");
  const receivables = useReceivableAging({ companyId, as_of: asOf || undefined });
  const payables = usePayableAging({ companyId, as_of: asOf || undefined });
  const dashboard = useCreditControlDashboard({ companyId, as_of: asOf || undefined });
  const banking = useBankingReconciliationSummary({ companyId });
  const dashboardPayload = dashboard.data?.data as
    | CreditControlDashboardReport
    | { data?: CreditControlDashboardReport }
    | undefined;
  const receivablesPayload = receivables.data?.data as ReceivableAgingRow[] | { data?: ReceivableAgingRow[] } | undefined;
  const payablesPayload = payables.data?.data as PayableAgingRow[] | { data?: PayableAgingRow[] } | undefined;
  const dashboardData = dashboardPayload
    ? ("totals" in dashboardPayload ? dashboardPayload : (dashboardPayload.data ?? undefined))
    : undefined;
  const bankingData = banking.data?.data;
  const receivableRows = Array.isArray(receivablesPayload)
    ? receivablesPayload
    : (receivablesPayload?.data ?? []);
  const payableRows = Array.isArray(payablesPayload)
    ? payablesPayload
    : (payablesPayload?.data ?? []);
  const receivableBucketData = [
    { label: "Current", amount: receivableRows.reduce((sum, row) => sum + row.current, 0), tone: "neutral" as const },
    { label: "1-30", amount: receivableRows.reduce((sum, row) => sum + row.bucket_1_30, 0), tone: "secondary" as const },
    { label: "31-60", amount: receivableRows.reduce((sum, row) => sum + row.bucket_31_60, 0), tone: "info" as const },
    { label: "61-90", amount: receivableRows.reduce((sum, row) => sum + row.bucket_61_90, 0), tone: "warning" as const },
    { label: "90+", amount: receivableRows.reduce((sum, row) => sum + row.bucket_90_plus, 0), tone: "danger" as const },
  ];
  const topRiskRows = (dashboardData?.high_risk_customers ?? [])
    .slice(0, 6)
    .map((row) => ({
      label: row.customer_name.length > 18 ? `${row.customer_name.slice(0, 18)}…` : row.customer_name,
      fullLabel: row.customer_name,
      amount: row.total_due,
      overdue: row.bucket_90_plus,
    }));

  const loading =
    receivables.isLoading ||
    payables.isLoading ||
    dashboard.isLoading ||
    banking.isLoading;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Credit control"
        title="Credit and banking risk"
        subtitle="Track aging, follow-up load, pending instruments, and reconciliation pressure from one finance view."
      />

      <WorkspacePanel title="As-of date" subtitle="Change the receivable and payable aging cut-off.">
        <div className="max-w-xs">
          <DateField label="As of" value={asOf} onChange={setAsOf} />
        </div>
      </WorkspacePanel>

      {loading ? <LoadingBlock label="Loading D9 reports…" /> : null}
      {receivables.isError ? <InlineError message={getErrorMessage(receivables.error, "Failed to load receivables aging")} /> : null}
      {payables.isError ? <InlineError message={getErrorMessage(payables.error, "Failed to load payables aging")} /> : null}
      {dashboard.isError ? <InlineError message={getErrorMessage(dashboard.error, "Failed to load credit dashboard")} /> : null}
      {banking.isError ? <InlineError message={getErrorMessage(banking.error, "Failed to load banking summary")} /> : null}

      {!loading ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Receivables" value={formatMoney(dashboardData?.totals.total_due ?? 0)} />
          <StatCard label="90+ overdue" value={formatMoney(dashboardData?.totals.overdue_90_plus ?? 0)} />
          <StatCard label="Open tasks" value={String(dashboardData?.totals.open_collection_tasks ?? 0)} />
          <StatCard label="Pending instruments" value={String(bankingData?.pending_instruments ?? 0)} />
          <StatCard label="Unmatched lines" value={String(bankingData?.unmatched_lines ?? 0)} />
          <StatCard label="Bounced" value={String(bankingData?.bounced_instruments ?? 0)} />
        </div>
      ) : null}

      {!loading ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell
            title="Receivable aging mix"
            subtitle="See where the open balance is concentrated before drilling into customer-level detail."
            footer={`Open collection tasks: ${dashboardData?.totals.open_collection_tasks ?? 0}`}
          >
            <ChartLegend
              items={receivableBucketData.map((row) => ({
                label: row.label,
                tone: row.tone,
                value: formatChartCurrency(row.amount),
              }))}
              className="mb-4"
            />
            <ChartFrame height={300}>
              <BarChart data={receivableBucketData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid stroke={getChartGridColor()} vertical={false} />
                <XAxis dataKey="label" stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                <YAxis stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                <ChartTooltip valueFormatter={formatChartCurrency} />
                <Bar dataKey="amount" name="Receivables" radius={[10, 10, 0, 0]}>
                  {receivableBucketData.map((row) => (
                    <Cell key={row.label} fill={getChartSeriesColor(row.tone)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>

          <ChartShell
            title="High-risk concentration"
            subtitle="Which customers are contributing the most overdue and total exposure right now."
            footer="Overdue 90+ helps separate chronic delay from current total exposure."
          >
            <ChartFrame height={300}>
              <BarChart data={topRiskRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={getChartGridColor()} horizontal={false} />
                <XAxis type="number" stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                <YAxis dataKey="label" type="category" width={110} stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                <ChartTooltip
                  labelFormatter={(label) => topRiskRows.find((row) => row.label === label)?.fullLabel ?? String(label)}
                  valueFormatter={formatChartCurrency}
                />
                <Bar dataKey="amount" name="Total due" fill={getChartSeriesColor("primary")} radius={[0, 10, 10, 0]} />
                <Bar dataKey="overdue" name="90+ overdue" fill={getChartSeriesColor("danger")} radius={[0, 10, 10, 0]} />
              </BarChart>
            </ChartFrame>
          </ChartShell>
        </div>
      ) : null}

      <WorkspacePanel title="High-risk customers" subtitle="Customers with the deepest overdue exposure or highest credit pressure.">
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Customer</DataTh>
                <DataTh>90+ overdue</DataTh>
                <DataTh>Total due</DataTh>
                <DataTh>Exposure %</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {(dashboardData?.high_risk_customers ?? []).map((row) => (
                <DataTr key={row.customer_id}>
                  <DataTd>{row.customer_name}</DataTd>
                  <DataTd>{formatMoney(row.bucket_90_plus)}</DataTd>
                  <DataTd>{formatMoney(row.total_due)}</DataTd>
                  <DataTd>{row.exposure_percent.toFixed(1)}%</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </WorkspacePanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkspacePanel title="Receivable aging" subtitle="Customer due buckets built from current outstanding invoices.">
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Customer</DataTh>
                  <DataTh>Current</DataTh>
                  <DataTh>1-30</DataTh>
                  <DataTh>31-60</DataTh>
                  <DataTh>61-90</DataTh>
                  <DataTh>90+</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {receivableRows.map((row) => (
                  <DataTr key={row.customer_id}>
                    <DataTd>{row.customer_name}</DataTd>
                    <DataTd>{formatMoney(row.current)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_1_30)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_31_60)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_61_90)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_90_plus)}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspacePanel>

        <WorkspacePanel title="Payable aging" subtitle="Supplier due buckets based on purchases minus recorded supplier payments.">
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Supplier</DataTh>
                  <DataTh>Current</DataTh>
                  <DataTh>1-30</DataTh>
                  <DataTh>31-60</DataTh>
                  <DataTh>61-90</DataTh>
                  <DataTh>90+</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {payableRows.map((row) => (
                  <DataTr key={row.supplier_id}>
                    <DataTd>{row.supplier_name}</DataTd>
                    <DataTd>{formatMoney(row.current)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_1_30)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_31_60)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_61_90)}</DataTd>
                    <DataTd>{formatMoney(row.bucket_90_plus)}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspacePanel>
      </div>
    </div>
  );
}
