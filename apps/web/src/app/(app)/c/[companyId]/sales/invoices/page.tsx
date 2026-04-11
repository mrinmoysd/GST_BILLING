"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/lib/billing/hooks";
import type { Invoice } from "@/lib/billing/types";
import { useAuth } from "@/lib/auth/session";
import { formatDateLabel } from "@/lib/format/date";
import { useInvoiceSeries } from "@/lib/settings/invoiceSeriesHooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };

function readInvoiceNumber(invoice: Invoice) {
  return invoice.invoiceNumber ?? invoice.invoice_no ?? invoice.id;
}

function readInvoiceDate(invoice: Invoice) {
  return formatDateLabel(invoice.issueDate ?? invoice.issue_date);
}


export default function InvoicesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null);
  const [savedView, setSavedView] = React.useState("all");
  const { bootstrapped } = useAuth();
  const query = useInvoices({ companyId: companyId, q, enabled: bootstrapped });
  const seriesQuery = useInvoiceSeries(companyId);

  const payload = query.data as unknown;
  const seriesRows = React.useMemo(() => {
    const data = seriesQuery.data?.data as unknown;
    if (Array.isArray(data)) return data as Array<{ id: string; code: string }>;
    if (data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)) {
      return (data as { data: Array<{ id: string; code: string }> }).data;
    }
    return [];
  }, [seriesQuery.data?.data]);
  const seriesCodeById = React.useMemo(
    () => new Map(seriesRows.map((series) => [series.id, series.code])),
    [seriesRows],
  );

  function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object";
  }

  function readRows(v: unknown): unknown[] {
    if (!isRecord(v)) return [];
    if (Array.isArray(v.data)) return v.data;
    return [];
  }

  function readTotal(v: unknown): number {
    if (!isRecord(v)) return 0;
    if (typeof v.total === "number") return v.total;
    if (isRecord(v.meta) && typeof v.meta.total === "number") return v.meta.total;
    return 0;
  }

  const rows = readRows(payload) as Invoice[];
  const total = readTotal(payload);
  const counts = React.useMemo(() => {
    const draft = rows.filter((row) => String(row.status ?? "").toUpperCase() === "DRAFT").length;
    const issued = rows.filter((row) => String(row.status ?? "").toUpperCase() === "ISSUED").length;
    const cancelled = rows.filter((row) => String(row.status ?? "").toUpperCase() === "CANCELLED").length;
    return { all: rows.length, draft, issued, cancelled };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const status = String(row.status ?? "").toUpperCase();
      if (segment === "draft") return status === "DRAFT";
      if (segment === "issued") return status === "ISSUED";
      if (segment === "cancelled") return status === "CANCELLED";
      return true;
    });
  }, [rows, segment]);

  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: "invoice",
        header: "Invoice",
        accessorFn: (invoice) => readInvoiceNumber(invoice),
        meta: { label: "Invoice" },
        cell: ({ row }) => (
          <Link className="font-semibold text-[var(--secondary)] transition hover:text-[var(--secondary-strong)]" href={`/c/${companyId}/sales/invoices/${row.original.id}`}>
            {readInvoiceNumber(row.original)}
          </Link>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        accessorFn: (invoice) => invoice.customer?.name ?? "",
        meta: { label: "Customer" },
        cell: ({ row }) => row.original.customer?.name ?? "—",
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (invoice) => invoice.status ?? "",
        meta: { label: "Status" },
        cell: ({ row }) => <QueueRowStateBadge label={row.original.status ?? "—"} />,
      },
      {
        id: "issueDate",
        header: "Issue date",
        accessorFn: (invoice) => invoice.issueDate ?? invoice.issue_date ?? "",
        meta: { label: "Issue date" },
        cell: ({ row }) => readInvoiceDate(row.original),
      },
      {
        id: "total",
        header: "Total",
        accessorFn: (invoice) => Number(invoice.total ?? 0),
        meta: { label: "Total", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.total ?? "—",
      },
    ],
    [companyId],
  );

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedInvoiceId(null);
      return;
    }
    if (!selectedInvoiceId || !filteredRows.some((row) => row.id === selectedInvoiceId)) {
      setSelectedInvoiceId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedInvoiceId]);

  const selectedInvoice = filteredRows.find((row) => row.id === selectedInvoiceId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Sales list"
        title="Invoices"
        subtitle="Scan billing activity, move into issued and draft documents quickly, and keep the invoice plane table-first."
        badges={[
          <WorkspaceStatBadge key="total" label="Invoices" value={total} />,
          <WorkspaceStatBadge key="mode" label="View" value={q ? "Filtered" : "All"} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/sales/invoices/new`}>
            <SecondaryButton type="button">New invoice</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All", count: counts.all },
          { id: "issued", label: "Issued", count: counts.issued },
          { id: "draft", label: "Draft", count: counts.draft },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full queue" },
              { id: "issued", label: "Finalized" },
              { id: "draft", label: "Draft cleanup" },
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
        filters={<TextField label="Search invoices" value={q} onChange={setQ} placeholder="Invoice no / customer" />}
        summary={
          <>
            <Badge variant="secondary">{filteredRows.length} in view</Badge>
            <Badge variant="outline">{total} total</Badge>
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading invoices…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load invoices")} /> : null}

      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState
          title="No invoices"
          hint="Create an invoice to start your billing workflow."
          action={
            <Link href={`/c/${companyId}/sales/invoices/new`}>
              <SecondaryButton type="button">Create invoice</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Inspector"
              title={selectedInvoice ? readInvoiceNumber(selectedInvoice) : "Select invoice"}
              subtitle="Keep billing decisions close to the list instead of opening every document in a new context."
              footer={
                selectedInvoice ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/sales/invoices/${selectedInvoice.id}`}>
                      <SecondaryButton type="button">Open invoice</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/sales/invoices/new`}>
                      <SecondaryButton type="button">New invoice</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedInvoice ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={selectedInvoice.status ?? "—"} />
                    <Badge variant="outline">{selectedInvoice.customer?.name ?? "No customer"}</Badge>
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "Issue date", value: readInvoiceDate(selectedInvoice) },
                      { label: "Due date", value: formatDateLabel(selectedInvoice.dueDate ?? selectedInvoice.due_date) },
                      {
                        label: "Series",
                        value:
                          (selectedInvoice.seriesId ? seriesCodeById.get(selectedInvoice.seriesId) : null) ??
                          (selectedInvoice.invoiceNumber ? selectedInvoice.invoiceNumber.split("-").slice(0, -1).join("-") || "Assigned" : "Assigned on issue"),
                      },
                      { label: "Warehouse", value: selectedInvoice.warehouse?.name ?? selectedInvoice.warehouse?.code ?? "—" },
                      { label: "Total", value: selectedInvoice.total ?? "—" },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a document to review its status, customer, and next action.</div>
              )}
            </QueueInspector>
          }
        >
          <DataGrid
            data={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={(row) => setSelectedInvoiceId(row.id)}
            rowClassName={(row) =>
              selectedInvoice?.id === row.original.id
                ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                : "hover:bg-[var(--surface-secondary)]"
            }
            initialSorting={[{ id: "issueDate", desc: true }]}
            toolbarTitle="Invoice queue"
            toolbarDescription="Sort and trim visible columns without leaving the billing workspace."
          />
        </QueueShell>
      ) : null}
    </div>
  );
}
