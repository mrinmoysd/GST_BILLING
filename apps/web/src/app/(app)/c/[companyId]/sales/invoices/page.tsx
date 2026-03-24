"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { WorkspaceFilterBar, WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function InvoicesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const { bootstrapped } = useAuth();
  const query = useInvoices({ companyId: companyId, q, enabled: bootstrapped });

  const payload = query.data as unknown;

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

  type InvoiceRow = {
    id: string;
    invoiceNumber?: string | null;
    invoice_no?: string | null;
    status?: string | null;
    issueDate?: string | null;
    issue_date?: string | null;
  };

  const rows = readRows(payload) as InvoiceRow[];
  const total = readTotal(payload);

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

      <WorkspaceFilterBar summary={<Badge variant="secondary">{total} total</Badge>}>
        <TextField label="Search invoices" value={q} onChange={setQ} placeholder="Invoice no / customer" />
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading invoices…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load invoices")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
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

      {rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Invoice plane"
          title="Documents in view"
          subtitle="The invoice table is the primary operating surface for scan-and-open work."
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Invoice</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Issue date</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {rows.map((inv) => (
                  <DataTr key={inv.id}>
                    <DataTd>
                      <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline" href={`/c/${companyId}/sales/invoices/${inv.id}`}>
                        {inv.invoiceNumber ?? inv.invoice_no ?? inv.id}
                      </Link>
                    </DataTd>
                    <DataTd>
                      <Badge variant="secondary">{inv.status ?? "—"}</Badge>
                    </DataTd>
                    <DataTd>{inv.issueDate ?? inv.issue_date ?? "—"}</DataTd>
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
