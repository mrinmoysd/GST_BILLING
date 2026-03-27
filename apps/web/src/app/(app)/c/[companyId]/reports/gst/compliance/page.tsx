"use client";

import Link from "next/link";
import * as React from "react";

import { useInvoiceComplianceExceptions } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar, QueueRowStateBadge } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

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

  const rows = React.useMemo(() => query.data?.data.data ?? [], [query.data]);
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
                    { label: "Issue date", value: selectedRow.issue_date ?? "—" },
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
                  className={selectedRow?.invoice_id === row.invoice_id ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                  onClick={() => setSelectedInvoiceId(row.invoice_id)}
                >
                  <DataTd>
                    <div className="font-medium">{row.invoice_number}</div>
                    <div className="text-xs text-[var(--muted)]">{row.issue_date ?? "—"} · {row.total.toFixed(2)}</div>
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
