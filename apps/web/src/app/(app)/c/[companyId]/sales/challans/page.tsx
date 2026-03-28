"use client";

import Link from "next/link";
import * as React from "react";

import { useDeliveryChallans } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function DeliveryChallansPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const query = useDeliveryChallans({
    companyId,
    page: 1,
    limit: 100,
    q: q || undefined,
    status: status || undefined,
  });
  const payload = query.data?.data as { data?: Array<Record<string, unknown>>; total?: number } | undefined;
  const rows = payload?.data ?? [];

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Dispatch register"
        title="Delivery challans"
        subtitle="Track challan creation, warehouse handoff status, and invoice traceability in one register."
        badges={[
          <WorkspaceStatBadge key="count" label="Challans" value={rows.length} />,
          <WorkspaceStatBadge key="filter" label="View" value={status || "All"} variant="outline" />,
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Search challans" value={q} onChange={setQ} placeholder="Challan / order / customer" />
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            { value: "draft", label: "Draft" },
            { value: "picked", label: "Picked" },
            { value: "packed", label: "Packed" },
            { value: "dispatched", label: "Dispatched" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading delivery challans…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load delivery challans")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState title="No delivery challans yet" hint="Create the first challan from a sales order or dispatch queue." />
      ) : null}

      {rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Register"
          title="Challan register"
          subtitle="The challan layer now sits between order capture and invoicing."
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Challan</DataTh>
                  <DataTh>Order</DataTh>
                  <DataTh>Customer</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Warehouse</DataTh>
                  <DataTh>Invoice</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {rows.map((row) => (
                  <DataTr key={String(row.id)}>
                    <DataTd>
                      <Link
                        className="font-medium text-[var(--accent)] hover:underline"
                        href={`/c/${companyId}/sales/challans/${row.id}`}
                      >
                        {String(row.challanNumber ?? row.challan_number ?? row.id)}
                      </Link>
                    </DataTd>
                    <DataTd>{String((row.salesOrder as { orderNumber?: string; order_number?: string } | undefined)?.orderNumber ?? (row.salesOrder as { order_number?: string } | undefined)?.order_number ?? "—")}</DataTd>
                    <DataTd>{String((row.customer as { name?: string } | undefined)?.name ?? "—")}</DataTd>
                    <DataTd>{String(row.status ?? "—")}</DataTd>
                    <DataTd>{String((row.warehouse as { name?: string } | undefined)?.name ?? "—")}</DataTd>
                    <DataTd>
                      {(row.invoice as { id?: string; invoiceNumber?: string; invoice_number?: string } | undefined)?.id ? (
                        <Link
                          className="font-medium text-[var(--accent)] hover:underline"
                          href={`/c/${companyId}/sales/invoices/${(row.invoice as { id: string }).id}`}
                        >
                          {String((row.invoice as { invoiceNumber?: string; invoice_number?: string }).invoiceNumber ?? (row.invoice as { invoice_number?: string }).invoice_number ?? "Linked")}
                        </Link>
                      ) : (
                        "Not invoiced"
                      )}
                    </DataTd>
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
