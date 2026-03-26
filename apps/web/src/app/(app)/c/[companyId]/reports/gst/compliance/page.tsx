"use client";

import Link from "next/link";
import * as React from "react";

import { useInvoiceComplianceExceptions } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

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
  const query = useInvoiceComplianceExceptions({
    companyId,
    q: q || undefined,
    limit: 100,
  });

  const rows = query.data?.data.data ?? [];

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

      <TextField
        label="Search invoices"
        value={q}
        onChange={setQ}
        placeholder="Invoice number / customer"
      />

      {query.isLoading ? <LoadingBlock label="Loading invoice compliance exceptions…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load invoice compliance exceptions")} />
      ) : null}

      <WorkspaceSection
        eyebrow="Queue"
        title="Compliance exception queue"
        subtitle="Open the invoice detail page to generate, sync, cancel, or correct transport data."
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
              {rows.map((row) => (
                <DataTr key={row.invoice_id}>
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
      </WorkspaceSection>
    </div>
  );
}
