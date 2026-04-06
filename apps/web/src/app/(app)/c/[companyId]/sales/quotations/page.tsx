"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/session";
import { useQuotations } from "@/lib/billing/hooks";
import type { Quotation } from "@/lib/billing/types";
import { formatDateLabel } from "@/lib/format/date";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueRowStateBadge,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function QuotationsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { bootstrapped } = useAuth();
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedQuotationId, setSelectedQuotationId] = React.useState<string | null>(null);
  const query = useQuotations({ companyId, q, enabled: bootstrapped });
  const payload = query.data?.data as unknown;

  function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object";
  }

  function readRows(value: unknown): Quotation[] {
    if (Array.isArray(value)) return value as Quotation[];
    if (!isRecord(value) || !Array.isArray(value.data)) return [];
    return value.data as Quotation[];
  }

  function readTotal(value: unknown): number {
    if (Array.isArray(value)) return value.length;
    if (!isRecord(value)) return 0;
    if (typeof value.total === "number") return value.total;
    if (isRecord(value.meta) && typeof value.meta.total === "number") return value.meta.total;
    return 0;
  }

  const rows = readRows(payload);
  const total = readTotal(payload);
  const counts = React.useMemo(() => {
    const draft = rows.filter((row) => String(row.status ?? "").toUpperCase() === "DRAFT").length;
    const sent = rows.filter((row) => String(row.status ?? "").toUpperCase() === "SENT").length;
    const ready = rows.filter((row) =>
      ["APPROVED", "CONVERTED"].includes(String(row.status ?? "").toUpperCase()),
    ).length;
    return { all: rows.length, draft, sent, ready };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const status = String(row.status ?? "").toUpperCase();
      if (segment === "draft") return status === "DRAFT";
      if (segment === "sent") return status === "SENT";
      if (segment === "ready") return ["APPROVED", "CONVERTED"].includes(status);
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedQuotationId(null);
      return;
    }
    if (!selectedQuotationId || !filteredRows.some((row) => row.id === selectedQuotationId)) {
      setSelectedQuotationId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedQuotationId]);

  const selectedQuotation = filteredRows.find((row) => row.id === selectedQuotationId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Sales list"
        title="Quotations"
        subtitle="Prepare commercial offers, keep the pipeline visible, and convert approved quotes into invoice drafts without rebuilding line items."
        badges={[
          <WorkspaceStatBadge key="total" label="Quotations" value={total} />,
          <WorkspaceStatBadge key="mode" label="View" value={q ? "Filtered" : "All"} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/sales/quotations/new`}>
            <SecondaryButton type="button">New quotation</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All quotes", count: counts.all },
          { id: "draft", label: "Draft", count: counts.draft },
          { id: "sent", label: "Sent", count: counts.sent },
          { id: "ready", label: "Approved / converted", count: counts.ready },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full pipeline" },
              { id: "sent", label: "Follow-up" },
              { id: "ready", label: "Ready to close" },
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
        filters={<TextField label="Search quotations" value={q} onChange={setQ} placeholder="Quote no / customer" />}
        summary={
          <>
            <Badge variant="secondary">{filteredRows.length} in view</Badge>
            <Badge variant="outline">{total} total</Badge>
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading quotations…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load quotations")} /> : null}

      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState
          title="No quotations"
          hint="Create a quotation to start your quote-to-invoice workflow."
          action={
            <Link href={`/c/${companyId}/sales/quotations/new`}>
              <SecondaryButton type="button">Create quotation</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected quotation"
              title={selectedQuotation?.quoteNumber ?? selectedQuotation?.quote_number ?? "Select quotation"}
              subtitle="Review commercial posture, expiry, and conversion readiness without leaving the quote queue."
              footer={
                selectedQuotation ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/sales/quotations/${selectedQuotation.id}`}>
                      <SecondaryButton type="button">Open quotation</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/sales/quotations/new`}>
                      <SecondaryButton type="button">New quotation</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedQuotation ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={selectedQuotation.status ?? "—"} />
                    <Badge variant="outline">{selectedQuotation.customer?.name ?? "No customer"}</Badge>
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "Issue date", value: formatDateLabel(selectedQuotation.issueDate ?? selectedQuotation.issue_date) },
                      { label: "Expiry", value: formatDateLabel(selectedQuotation.expiryDate ?? selectedQuotation.expiry_date) },
                      {
                        label: "Salesperson",
                        value: selectedQuotation.salesperson?.name ?? selectedQuotation.salesperson?.email ?? "Unassigned",
                      },
                      { label: "Total", value: selectedQuotation.total ?? "—" },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a quote to inspect commercial posture and next step.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Quote</DataTh>
                  <DataTh>Customer</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Expiry</DataTh>
                  <DataTh className="text-right">Total</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredRows.map((quote) => (
                  <DataTr
                    key={quote.id}
                    className={selectedQuotation?.id === quote.id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-secondary)]"}
                    onClick={() => setSelectedQuotationId(quote.id)}
                  >
                    <DataTd>
                      <Link
                        className="font-semibold text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]"
                        href={`/c/${companyId}/sales/quotations/${quote.id}`}
                      >
                        {quote.quoteNumber ?? quote.quote_number ?? quote.id}
                      </Link>
                    </DataTd>
                    <DataTd>{quote.customer?.name ?? "—"}</DataTd>
                    <DataTd>
                      <QueueRowStateBadge label={quote.status ?? "—"} />
                    </DataTd>
                    <DataTd>{formatDateLabel(quote.expiryDate ?? quote.expiry_date)}</DataTd>
                    <DataTd className="text-right">{quote.total ?? "—"}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </QueueShell>
      ) : null}
    </div>
  );
}
