"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/session";
import { useQuotations } from "@/lib/billing/hooks";
import type { Quotation } from "@/lib/billing/types";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceFilterBar, WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function QuotationsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { bootstrapped } = useAuth();
  const [q, setQ] = React.useState("");
  const query = useQuotations({ companyId, q, enabled: bootstrapped });
  const payload = query.data?.data as unknown;

  function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object";
  }

  function readRows(value: unknown): Quotation[] {
    if (!isRecord(value) || !Array.isArray(value.data)) return [];
    return value.data as Quotation[];
  }

  function readTotal(value: unknown): number {
    if (!isRecord(value)) return 0;
    if (typeof value.total === "number") return value.total;
    if (isRecord(value.meta) && typeof value.meta.total === "number") return value.meta.total;
    return 0;
  }

  const rows = readRows(payload);
  const total = readTotal(payload);

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

      <WorkspaceFilterBar summary={<Badge variant="secondary">{total} total</Badge>}>
        <TextField label="Search quotations" value={q} onChange={setQ} placeholder="Quote no / customer" />
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading quotations…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load quotations")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
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

      {rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Quotation plane"
          title="Offers in view"
          subtitle="Scan quote number, customer, value, and current sales posture from one list-first workspace."
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
                {rows.map((quote) => (
                  <DataTr key={quote.id}>
                    <DataTd>
                      <Link
                        className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                        href={`/c/${companyId}/sales/quotations/${quote.id}`}
                      >
                        {quote.quoteNumber ?? quote.quote_number ?? quote.id}
                      </Link>
                    </DataTd>
                    <DataTd>{quote.customer?.name ?? "—"}</DataTd>
                    <DataTd>
                      <Badge variant="secondary">{quote.status ?? "—"}</Badge>
                    </DataTd>
                    <DataTd>{quote.expiryDate?.slice?.(0, 10) ?? quote.expiry_date ?? "—"}</DataTd>
                    <DataTd className="text-right">{quote.total ?? "—"}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
