"use client";

import * as React from "react";

import { type DcrRegisterRow, type MissedVisitRow, type RepVisitProductivityRow, useDcrRegister, useMissedVisits, useRepVisitProductivity } from "@/lib/reports/hooks";
import { formatDateLabel } from "@/lib/format/date";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspacePanel } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function DcrRegisterPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [date, setDate] = React.useState(todayIso());

  const dcr = useDcrRegister({ companyId, from: from || undefined, to: to || undefined });
  const missed = useMissedVisits({ companyId, date, enabled: Boolean(date) });
  const productivity = useRepVisitProductivity({ companyId, from: from || undefined, to: to || undefined });

  const dcrPayload = dcr.data?.data as DcrRegisterRow[] | { data?: DcrRegisterRow[] } | undefined;
  const missedPayload = missed.data?.data as MissedVisitRow[] | { data?: MissedVisitRow[] } | undefined;
  const productivityPayload = productivity.data?.data as RepVisitProductivityRow[] | { data?: RepVisitProductivityRow[] } | undefined;
  const dcrRows = Array.isArray(dcrPayload)
    ? dcrPayload
    : (dcrPayload?.data ?? []);
  const missedRows = Array.isArray(missedPayload)
    ? missedPayload
    : (missedPayload?.data ?? []);
  const productivityRows = Array.isArray(productivityPayload)
    ? productivityPayload
    : (productivityPayload?.data ?? []);
  const submitted = dcrRows.filter((row) => row.status === "submitted" || row.status === "approved").length;
  const approved = dcrRows.filter((row) => row.status === "approved").length;
  const totalVisits = productivityRows.reduce((sum, row) => sum + row.visits_count, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Distributor reports"
        title="DCR and visit discipline"
        subtitle="Review who submitted daily closeout, where route discipline is slipping, and how much business the field activity is producing."
      />

      <WorkspacePanel title="Filters" subtitle="Use the DCR window for report history and a single date for missed-visit review.">
        <div className="grid gap-4 md:grid-cols-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
          <DateField label="Missed visit date" value={date} onChange={setDate} />
        </div>
      </WorkspacePanel>

      {dcr.isLoading || missed.isLoading || productivity.isLoading ? <LoadingBlock label="Loading DCR report…" /> : null}
      {dcr.isError ? <InlineError message={getErrorMessage(dcr.error, "Failed to load DCR register")} /> : null}
      {missed.isError ? <InlineError message={getErrorMessage(missed.error, "Failed to load missed visits")} /> : null}
      {productivity.isError ? <InlineError message={getErrorMessage(productivity.error, "Failed to load visit productivity")} /> : null}

      {!dcr.isLoading && !missed.isLoading && !productivity.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="DCR rows" value={String(dcrRows.length)} />
          <StatCard label="Submitted/approved" value={`${submitted}/${approved}`} />
          <StatCard label="Visits in window" value={String(totalVisits)} />
        </div>
      ) : null}

      <WorkspacePanel title="DCR register" subtitle="Submission state, closeout quality, and review completion by rep and date.">
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Date</DataTh>
                <DataTh>Salesperson</DataTh>
                <DataTh>Status</DataTh>
                <DataTh>Planned</DataTh>
                <DataTh>Completed</DataTh>
                <DataTh>Missed</DataTh>
                <DataTh>Orders</DataTh>
                <DataTh>Order value</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {dcrRows.map((row) => (
                <DataTr key={row.id}>
                  <DataTd>{formatDateLabel(row.report_date)}</DataTd>
                  <DataTd>{row.salesperson?.name ?? row.salesperson?.email ?? "—"}</DataTd>
                  <DataTd>{row.status}</DataTd>
                  <DataTd>{row.planned_visits_count}</DataTd>
                  <DataTd>{row.completed_visits_count}</DataTd>
                  <DataTd>{row.missed_visits_count}</DataTd>
                  <DataTd>{row.sales_orders_count}</DataTd>
                  <DataTd>{row.sales_order_value.toFixed(2)}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </WorkspacePanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkspacePanel title="Rep visit productivity" subtitle="Use this to separate real field execution from low-value movement.">
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Salesperson</DataTh>
                  <DataTh>Visits</DataTh>
                  <DataTh>Productive</DataTh>
                  <DataTh>Orders</DataTh>
                  <DataTh>Order value</DataTh>
                  <DataTh>Promises</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {productivityRows.map((row) => (
                  <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                    <DataTd>{row.salesperson_name}</DataTd>
                    <DataTd>{row.visits_count}</DataTd>
                    <DataTd>{row.productive_visits}</DataTd>
                    <DataTd>{row.orders_booked}</DataTd>
                    <DataTd>{row.order_value.toFixed(2)}</DataTd>
                    <DataTd>{row.promise_to_pay_count}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspacePanel>

        <WorkspacePanel title="Missed visits" subtitle="These outlets were planned but not completed on the selected date.">
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Customer</DataTh>
                  <DataTh>Salesperson</DataTh>
                  <DataTh>Route</DataTh>
                  <DataTh>Beat</DataTh>
                  <DataTh>Notes</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {missedRows.map((row) => (
                  <DataTr key={row.visit_plan_id}>
                    <DataTd>{row.customer?.name ?? "—"}</DataTd>
                    <DataTd>{row.salesperson?.name ?? row.salesperson?.email ?? "—"}</DataTd>
                    <DataTd>{row.route?.name ?? "—"}</DataTd>
                    <DataTd>{row.beat?.name ?? "—"}</DataTd>
                    <DataTd>{row.notes ?? "—"}</DataTd>
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
