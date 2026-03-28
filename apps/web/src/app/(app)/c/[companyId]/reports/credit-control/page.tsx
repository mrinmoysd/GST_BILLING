"use client";

import * as React from "react";

import {
  useBankingReconciliationSummary,
  useCreditControlDashboard,
  usePayableAging,
  useReceivableAging,
} from "@/lib/reports/hooks";
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
  const dashboardData = dashboard.data?.data.data;
  const bankingData = banking.data?.data;

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
                {(receivables.data?.data.data ?? []).map((row) => (
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
                {(payables.data?.data.data ?? []).map((row) => (
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
