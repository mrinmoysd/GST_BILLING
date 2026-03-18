"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useInvoices } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";

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

  // API responses may be one of:
  // 1) { data: Invoice[], page, limit, total }
  // 2) { data: Invoice[], meta: { total, page, limit } }
  // 3) legacy { data: { data: Invoice[], meta } }
  const payload = query.data?.data as unknown;

  function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object";
  }

  function readRows(v: unknown): unknown[] {
    if (!isRecord(v)) return [];
    if (Array.isArray(v.data)) return v.data;
    if (isRecord(v.data) && Array.isArray(v.data.data)) return v.data.data;
    return [];
  }

  function readTotal(v: unknown): number {
    if (!isRecord(v)) return 0;
    if (typeof v.total === "number") return v.total;
    if (isRecord(v.meta) && typeof v.meta.total === "number") return v.meta.total;
    if (isRecord(v.data) && isRecord(v.data.meta) && typeof v.data.meta.total === "number") return v.data.meta.total;
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
      <PageHeader
        eyebrow="Sales"
        title="Invoices"
        subtitle="Manage the invoice pipeline with cleaner status visibility and faster navigation into draft and issued documents."
        actions={
          <Link href={`/c/${companyId}/sales/invoices/new`}>
            <SecondaryButton type="button">New invoice</SecondaryButton>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <TextField label="Search invoices" value={q} onChange={setQ} placeholder="Invoice no / customer" />
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
      ) : null}
    </div>
  );
}
