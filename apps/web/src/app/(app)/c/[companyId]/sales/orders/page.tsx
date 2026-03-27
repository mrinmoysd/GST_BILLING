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
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
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
  const counts = React.useMemo(() => {
    const draft = rows.filter((row) => String(row.status ?? "").toUpperCase() === "DRAFT").length;
    const confirmed = rows.filter((row) => String(row.status ?? "").toUpperCase() === "CONFIRMED").length;
    const activeFulfillment = rows.filter((row) =>
      ["PARTIALLY_FULFILLED", "FULFILLED"].includes(String(row.status ?? "").toUpperCase()),
    ).length;
    return { all: rows.length, draft, confirmed, activeFulfillment };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const status = String(row.status ?? "").toUpperCase();
      if (segment === "draft") return status === "DRAFT";
      if (segment === "confirmed") return status === "CONFIRMED";
      if (segment === "fulfillment") return ["PARTIALLY_FULFILLED", "FULFILLED"].includes(status);
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !filteredRows.some((row) => row.id === selectedOrderId)) {
      setSelectedOrderId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedOrderId]);

  const selectedOrder = filteredRows.find((row) => row.id === selectedOrderId) ?? filteredRows[0] ?? null;

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

      <QueueSegmentBar
        items={[
          { id: "all", label: "All orders", count: counts.all },
          { id: "draft", label: "Draft", count: counts.draft },
          { id: "confirmed", label: "Confirmed", count: counts.confirmed },
          { id: "fulfillment", label: "In fulfillment", count: counts.activeFulfillment },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full queue" },
              { id: "confirmed", label: "Ready to convert" },
              { id: "fulfillment", label: "Warehouse follow-up" },
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
        filters={<TextField label="Search orders" value={q} onChange={setQ} placeholder="Order no / customer" />}
        summary={
          <>
            <Badge variant="secondary">{filteredRows.length} in view</Badge>
            <Badge variant="outline">{total} total</Badge>
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading sales orders…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load sales orders")} /> : null}

      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
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

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected order"
              title={selectedOrder?.orderNumber ?? selectedOrder?.order_number ?? "Select order"}
              subtitle="Keep customer, source quotation, and fulfillment posture visible while you work the order queue."
              footer={
                selectedOrder ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/sales/orders/${selectedOrder.id}`}>
                      <SecondaryButton type="button">Open order</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/sales/dispatch`}>
                      <SecondaryButton type="button">Dispatch queue</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedOrder ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={selectedOrder.status ?? "—"} />
                    {selectedOrder.quotation?.id ? (
                      <Badge variant="outline">
                        {selectedOrder.quotation?.quoteNumber ?? selectedOrder.quotation?.quote_number ?? "Quoted"}
                      </Badge>
                    ) : null}
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "Customer", value: selectedOrder.customer?.name ?? "—" },
                      { label: "Order date", value: selectedOrder.orderDate?.slice?.(0, 10) ?? selectedOrder.order_date ?? "—" },
                      {
                        label: "Expected dispatch",
                        value: selectedOrder.expectedDispatchDate?.slice?.(0, 10) ?? selectedOrder.expected_dispatch_date ?? "—",
                      },
                      { label: "Total", value: selectedOrder.total ?? "—" },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select an order to review conversion readiness and fulfillment posture.</div>
              )}
            </QueueInspector>
          }
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
                {filteredRows.map((order) => (
                  <DataTr
                    key={order.id}
                    className={selectedOrder?.id === order.id ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <DataTd>
                      <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline" href={`/c/${companyId}/sales/orders/${order.id}`}>
                        {order.orderNumber ?? order.order_number ?? order.id}
                      </Link>
                    </DataTd>
                    <DataTd>{order.customer?.name ?? "—"}</DataTd>
                    <DataTd><QueueRowStateBadge label={order.status ?? "—"} /></DataTd>
                    <DataTd>{order.quotation?.quoteNumber ?? order.quotation?.quote_number ?? "—"}</DataTd>
                    <DataTd className="text-right">{order.total ?? "—"}</DataTd>
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
