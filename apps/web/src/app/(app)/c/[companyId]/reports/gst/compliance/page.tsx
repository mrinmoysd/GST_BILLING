"use client";

import Link from "next/link";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { useInvoiceComplianceExceptions } from "@/lib/billing/hooks";
import { type InvoiceComplianceExceptionRow } from "@/lib/billing/types";
import { formatDateLabel } from "@/lib/format/date";
import {
  ChartEmptyState,
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
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar, QueueRowStateBadge } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "").toUpperCase();
}

function isPending(row: InvoiceComplianceExceptionRow) {
  return [row.e_invoice_status, row.e_way_bill_status].some((value) => normalizeStatus(value) === "PENDING");
}

function isFailed(row: InvoiceComplianceExceptionRow) {
  return [row.e_invoice_status, row.e_way_bill_status].some((value) => normalizeStatus(value) === "FAILED");
}

function isBlocked(row: InvoiceComplianceExceptionRow) {
  return normalizeStatus(row.e_invoice_status) === "BLOCKED";
}

export default function GstComplianceExceptionsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
  const [customerFocus, setCustomerFocus] = React.useState<string>("");
  const query = useInvoiceComplianceExceptions({
    companyId,
    q: q || undefined,
    limit: 100,
  });

  const rows = React.useMemo(() => {
    const payload = query.data?.data as
      | InvoiceComplianceExceptionRow[]
      | { data?: InvoiceComplianceExceptionRow[] }
      | undefined;
    return Array.isArray(payload)
      ? payload
      : (payload?.data ?? []);
  }, [query.data]);
  const counts = React.useMemo(() => {
    const blocked = rows.filter(isBlocked).length;
    const pending = rows.filter(isPending).length;
    const failed = rows.filter(isFailed).length;
    return { all: rows.length, blocked, pending, failed };
  }, [rows]);
  const statusChartRows = React.useMemo(
    () => [
      { id: "blocked", label: "Blocked", value: counts.blocked, tone: "danger" as const },
      { id: "pending", label: "Pending", value: counts.pending, tone: "warning" as const },
      { id: "failed", label: "Failed", value: counts.failed, tone: "accent" as const },
    ],
    [counts.blocked, counts.failed, counts.pending],
  );
  const exceptionTypeRows = React.useMemo(() => {
    const summary = rows.reduce(
      (acc, row) => {
        const eInvoiceIssue = ["BLOCKED", "PENDING", "FAILED"].includes(normalizeStatus(row.e_invoice_status));
        const eWayBillIssue = ["BLOCKED", "PENDING", "FAILED"].includes(normalizeStatus(row.e_way_bill_status));
        if (eInvoiceIssue && eWayBillIssue) acc.both += 1;
        else if (eInvoiceIssue) acc.e_invoice_only += 1;
        else if (eWayBillIssue) acc.e_way_bill_only += 1;
        else acc.other += 1;
        return acc;
      },
      { both: 0, e_invoice_only: 0, e_way_bill_only: 0, other: 0 },
    );
    return [
      { id: "both", label: "Both sides", value: summary.both, tone: "danger" as const },
      { id: "e_invoice_only", label: "E-invoice only", value: summary.e_invoice_only, tone: "primary" as const },
      { id: "e_way_bill_only", label: "E-way bill only", value: summary.e_way_bill_only, tone: "secondary" as const },
    ];
  }, [rows]);
  const customerRiskRows = React.useMemo(() => {
    const map = new Map<string, { customerName: string; invoiceCount: number; total: number }>();
    for (const row of rows) {
      const current = map.get(row.customer_name) ?? { customerName: row.customer_name, invoiceCount: 0, total: 0 };
      current.invoiceCount += 1;
      current.total += Number(row.total ?? 0);
      map.set(row.customer_name, current);
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total || b.invoiceCount - a.invoiceCount)
      .slice(0, 6)
      .map((row) => ({
        ...row,
        label: row.customerName.length > 18 ? `${row.customerName.slice(0, 18)}…` : row.customerName,
      }));
  }, [rows]);
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (segment === "blocked") return isBlocked(row);
      if (segment === "pending") return isPending(row);
      if (segment === "failed") return isFailed(row);
      return true;
    });
  }, [rows, segment]);
  const visibleRows = React.useMemo(() => {
    return filteredRows.filter((row) => (customerFocus ? row.customer_name === customerFocus : true));
  }, [customerFocus, filteredRows]);

  React.useEffect(() => {
    if (!visibleRows.length) {
      setSelectedInvoiceId("");
      return;
    }
    if (!selectedInvoiceId || !visibleRows.some((row) => row.invoice_id === selectedInvoiceId)) {
      setSelectedInvoiceId(visibleRows[0]?.invoice_id ?? "");
    }
  }, [selectedInvoiceId, visibleRows]);

  const selectedRow = visibleRows.find((row) => row.invoice_id === selectedInvoiceId) ?? visibleRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="GST reports"
        title="Invoice compliance exceptions"
        subtitle="Track invoices that are blocked, failed, or still pending e-invoice / e-way bill completion."
        badges={[
          <WorkspaceStatBadge key="rows" label="Exceptions" value={rows.length} />,
          <WorkspaceStatBadge key="focus" label="Customer focus" value={customerFocus || "All"} variant="outline" />,
        ]}
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All exceptions", count: counts.all },
          { id: "blocked", label: "Blocked", count: counts.blocked },
          { id: "pending", label: "Pending", count: counts.pending },
          { id: "failed", label: "Failed", count: counts.failed },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full queue" },
              { id: "blocked", label: "Immediate fixes" },
              { id: "failed", label: "Reattempt" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={
          <TextField
            label="Search invoices"
            value={q}
            onChange={setQ}
            placeholder="Invoice number / customer"
          />
        }
        summary={
          customerFocus ? (
            <SecondaryButton type="button" onClick={() => setCustomerFocus("")}>
              Clear customer focus
            </SecondaryButton>
          ) : undefined
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading invoice compliance exceptions…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load invoice compliance exceptions")} />
      ) : null}

      {query.data && rows.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <ChartShell
            title="Compliance pressure"
            subtitle="Status counts for the current exception queue. Click a bar to filter the table."
            footer={<ChartLegend items={statusChartRows.map((row) => ({ label: row.label, tone: row.tone, value: row.value }))} />}
          >
            <ChartFrame height={300}>
              <BarChart data={statusChartRows} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid stroke={getChartGridColor()} vertical={false} />
                <XAxis dataKey="label" stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                <YAxis stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                <ChartTooltip valueFormatter={formatChartCompactNumber} />
                <Bar dataKey="value" name="Invoices" radius={[10, 10, 0, 0]}>
                  {statusChartRows.map((row) => (
                    <Cell
                      key={row.id}
                      fill={getChartSeriesColor(segment === row.id ? "primary" : row.tone)}
                      className="cursor-pointer"
                      onClick={() => {
                        setSegment(row.id);
                        setSavedView("all");
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>

          <ChartShell
            title="Exception shape"
            subtitle="Which side of compliance is driving the queue today."
            footer={<ChartLegend items={exceptionTypeRows.map((row) => ({ label: row.label, tone: row.tone, value: row.value }))} />}
          >
            <ChartFrame height={300}>
              <BarChart data={exceptionTypeRows} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid stroke={getChartGridColor()} vertical={false} />
                <XAxis dataKey="label" stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                <YAxis stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                <ChartTooltip valueFormatter={formatChartCompactNumber} />
                <Bar dataKey="value" name="Invoices" radius={[10, 10, 0, 0]}>
                  {exceptionTypeRows.map((row) => (
                    <Cell key={row.id} fill={getChartSeriesColor(row.tone)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </ChartShell>

          <ChartShell
            className="xl:col-span-2"
            title="Customer concentration"
            subtitle="Customers contributing the most invoice value to the current exception set. Click a bar to focus the queue."
            footer={customerFocus ? `Focused on ${customerFocus}.` : "Click a customer bar to focus the exception table."}
          >
            {customerRiskRows.length === 0 ? (
              <ChartEmptyState title="No customer concentration data" hint="Try widening the current filter window." className="border-0 bg-transparent p-0 shadow-none" />
            ) : (
              <ChartFrame height={320}>
                <BarChart data={customerRiskRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke={getChartGridColor()} horizontal={false} />
                  <XAxis type="number" stroke={getChartAxisColor()} tickFormatter={formatChartCompactNumber} />
                  <YAxis dataKey="label" type="category" width={120} stroke={getChartAxisColor()} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    labelFormatter={(label) => customerRiskRows.find((row) => row.label === label)?.customerName ?? String(label)}
                    valueFormatter={formatChartCurrency}
                  />
                  <Bar dataKey="total" name="Invoice value" radius={[0, 10, 10, 0]}>
                    {customerRiskRows.map((row) => (
                      <Cell
                        key={row.customerName}
                        fill={getChartSeriesColor(customerFocus === row.customerName ? "primary" : "secondary")}
                        className="cursor-pointer"
                        onClick={() => setCustomerFocus((current) => (current === row.customerName ? "" : row.customerName))}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartFrame>
            )}
          </ChartShell>
        </div>
      ) : null}

      <QueueShell
        inspector={
          <QueueInspector
            eyebrow="Selected invoice"
            title={selectedRow?.invoice_number ?? "Select exception"}
            subtitle="Use the inspector to understand which side of compliance is blocked before jumping into the invoice workspace."
            footer={
              selectedRow ? (
                <QueueQuickActions>
                  <Link href={`/c/${companyId}/sales/invoices/${selectedRow.invoice_id}`}>
                    <button type="button" className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--foreground)]">
                      Open invoice
                    </button>
                  </Link>
                </QueueQuickActions>
              ) : null
            }
          >
            {selectedRow ? (
              <>
                <QueueRowStateBadge label={selectedRow.customer_name} variant="outline" />
                <QueueMetaList
                  items={[
                    { label: "Issue date", value: formatDateLabel(selectedRow.issue_date) },
                    { label: "Total", value: selectedRow.total.toFixed(2) },
                    { label: "E-invoice", value: `${selectedRow.e_invoice_status} · ${selectedRow.e_invoice_eligibility_status}` },
                    { label: "E-way bill", value: `${selectedRow.e_way_bill_status} · ${selectedRow.e_way_bill_eligibility_status}` },
                  ]}
                />
              </>
            ) : null}
          </QueueInspector>
        }
      >
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Invoice</DataTh>
                <DataTh>Customer</DataTh>
                <DataTh>E-invoice</DataTh>
                <DataTh>E-way bill</DataTh>
                <DataTh>Action</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {visibleRows.map((row) => (
                <DataTr
                  key={row.invoice_id}
                  className={selectedRow?.invoice_id === row.invoice_id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                  onClick={() => setSelectedInvoiceId(row.invoice_id)}
                >
                  <DataTd>
                    <div className="font-medium">{row.invoice_number}</div>
                    <div className="text-xs text-[var(--muted)]">{formatDateLabel(row.issue_date)} · {row.total.toFixed(2)}</div>
                  </DataTd>
                  <DataTd>{row.customer_name}</DataTd>
                  <DataTd>
                    <div>{row.e_invoice_status}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {row.e_invoice_eligibility_status}
                      {row.e_invoice_reason ? ` · ${row.e_invoice_reason}` : ""}
                    </div>
                  </DataTd>
                  <DataTd>
                    <div>{row.e_way_bill_status}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {row.e_way_bill_eligibility_status}
                      {row.e_way_bill_reason ? ` · ${row.e_way_bill_reason}` : ""}
                    </div>
                  </DataTd>
                  <DataTd>
                    <Link
                      className="font-medium text-[var(--accent)] hover:underline"
                      href={`/c/${companyId}/sales/invoices/${row.invoice_id}`}
                    >
                      Open invoice
                    </Link>
                  </DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </QueueShell>
    </div>
  );
}
