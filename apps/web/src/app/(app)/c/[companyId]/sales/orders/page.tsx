"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/session";
import { useSalesOrders } from "@/lib/billing/hooks";
import type { SalesOrder } from "@/lib/billing/types";
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

export default function SalesOrdersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { bootstrapped } = useAuth();
  const [q, setQ] = React.useState("");
  const query = useSalesOrders({ companyId, q, enabled: bootstrapped });
  const payload = query.data?.data as unknown;

  function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object";
  }

  function readRows(value: unknown): SalesOrder[] {
    if (!isRecord(value) || !Array.isArray(value.data)) return [];
    return value.data as SalesOrder[];
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
        title="Sales orders"
        subtitle="Capture commercial demand before invoicing, keep fulfillment visible, and move only the required quantities into invoice drafts."
        badges={[
          <WorkspaceStatBadge key="total" label="Orders" value={total} />,
          <WorkspaceStatBadge key="mode" label="View" value={q ? "Filtered" : "All"} variant="outline" />,
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${companyId}/sales/field/today`}>
              <SecondaryButton type="button">Field sales today</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/sales/dispatch`}>
              <SecondaryButton type="button">Dispatch queue</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/sales/challans`}>
              <SecondaryButton type="button">Challans</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/sales/orders/new`}>
              <SecondaryButton type="button">New sales order</SecondaryButton>
            </Link>
          </div>
        }
      />

      <WorkspaceFilterBar summary={<Badge variant="secondary">{total} total</Badge>}>
        <TextField label="Search orders" value={q} onChange={setQ} placeholder="Order no / customer" />
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading sales orders…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load sales orders")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState
          title="No sales orders"
          hint="Create a sales order to separate order capture from invoice issue."
          action={
            <Link href={`/c/${companyId}/sales/orders/new`}>
              <SecondaryButton type="button">Create sales order</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Order plane"
          title="Demand in view"
          subtitle="Order capture, linked quotation context, and fulfillment posture live together in one operating table."
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Order</DataTh>
                  <DataTh>Customer</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Source quote</DataTh>
                  <DataTh className="text-right">Total</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {rows.map((order) => (
                  <DataTr key={order.id}>
                    <DataTd>
                      <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline" href={`/c/${companyId}/sales/orders/${order.id}`}>
                        {order.orderNumber ?? order.order_number ?? order.id}
                      </Link>
                    </DataTd>
                    <DataTd>{order.customer?.name ?? "—"}</DataTd>
                    <DataTd><Badge variant="secondary">{order.status ?? "—"}</Badge></DataTd>
                    <DataTd>{order.quotation?.quoteNumber ?? order.quotation?.quote_number ?? "—"}</DataTd>
                    <DataTd className="text-right">{order.total ?? "—"}</DataTd>
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
