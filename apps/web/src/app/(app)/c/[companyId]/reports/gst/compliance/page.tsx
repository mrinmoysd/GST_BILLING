"use client";

import Link from "next/link";
import * as React from "react";

import { useInvoiceComplianceExceptions } from "@/lib/billing/hooks";
import { type InvoiceComplianceExceptionRow } from "@/lib/billing/types";
import { formatDateLabel } from "@/lib/format/date";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar, QueueRowStateBadge } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function GstComplianceExceptionsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
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
    const blocked = rows.filter((row) => String(row.e_invoice_status ?? "").toUpperCase() === "BLOCKED").length;
    const pending = rows.filter((row) =>
      [row.e_invoice_status, row.e_way_bill_status].some((value) => String(value ?? "").toUpperCase() === "PENDING"),
    ).length;
    const failed = rows.filter((row) =>
      [row.e_invoice_status, row.e_way_bill_status].some((value) => String(value ?? "").toUpperCase() === "FAILED"),
    ).length;
    return { all: rows.length, blocked, pending, failed };
  }, [rows]);
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (segment === "blocked") return String(row.e_invoice_status ?? "").toUpperCase() === "BLOCKED";
      if (segment === "pending") {
        return [row.e_invoice_status, row.e_way_bill_status].some((value) => String(value ?? "").toUpperCase() === "PENDING");
      }
      if (segment === "failed") {
        return [row.e_invoice_status, row.e_way_bill_status].some((value) => String(value ?? "").toUpperCase() === "FAILED");
      }
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedInvoiceId("");
      return;
    }
    if (!selectedInvoiceId || !filteredRows.some((row) => row.invoice_id === selectedInvoiceId)) {
      setSelectedInvoiceId(filteredRows[0]?.invoice_id ?? "");
    }
  }, [filteredRows, selectedInvoiceId]);

  const selectedRow = filteredRows.find((row) => row.invoice_id === selectedInvoiceId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="GST reports"
        title="Invoice compliance exceptions"
        subtitle="Track invoices that are blocked, failed, or still pending e-invoice / e-way bill completion."
        badges={[
          <WorkspaceStatBadge key="rows" label="Exceptions" value={rows.length} />,
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
      />

      {query.isLoading ? <LoadingBlock label="Loading invoice compliance exceptions…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load invoice compliance exceptions")} />
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
              {filteredRows.map((row) => (
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
