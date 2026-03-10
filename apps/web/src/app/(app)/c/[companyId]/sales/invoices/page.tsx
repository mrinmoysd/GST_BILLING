"use client";

import Link from "next/link";
import * as React from "react";

import { useInvoices } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
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
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Create, issue, and download invoice PDFs."
        actions={
          <Link href={`/c/${companyId}/sales/invoices/new`}>
            <SecondaryButton type="button">New invoice</SecondaryButton>
          </Link>
        }
      />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Invoice no / customer" />
          <div className="text-xs text-neutral-500">{total} total</div>
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading invoices…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load invoices")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState title="No invoices" hint="Create an invoice to get started." />
      ) : null}

      {rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Issue date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/c/${companyId}/sales/invoices/${inv.id}`}>
            {inv.invoiceNumber ?? inv.invoice_no ?? inv.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.status ?? "—"}</td>
          <td className="px-4 py-3">{inv.issueDate ?? inv.issue_date ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
