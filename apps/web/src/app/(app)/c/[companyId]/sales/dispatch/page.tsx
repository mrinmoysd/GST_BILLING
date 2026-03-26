"use client";

import Link from "next/link";
import * as React from "react";

import { useDispatchQueue } from "@/lib/billing/hooks";
import { useWarehouses } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function DispatchQueuePage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");

  const queue = useDispatchQueue({
    companyId,
    q: q || undefined,
    warehouse_id: warehouseId || undefined,
  });
  const warehouses = useWarehouses({ companyId, activeOnly: true });
  const rows =
    ((queue.data?.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ??
      []) as Array<Record<string, unknown>>;
  const warehouseRows =
    ((warehouses.data?.data as { data?: Array<{ id: string; name?: string; code?: string }> } | undefined)?.data ??
      []) as Array<{ id: string; name?: string; code?: string }>;

  const pendingTotal = rows.reduce(
    (sum, row) => sum + Number(row.pending_dispatch_quantity ?? 0),
    0,
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Dispatch operations"
        title="Dispatch queue"
        subtitle="Focus warehouse attention on confirmed order demand that still needs challan creation or staged movement."
        badges={[
          <WorkspaceStatBadge key="orders" label="Orders" value={rows.length} />,
          <WorkspaceStatBadge key="pending" label="Pending qty" value={pendingTotal.toFixed(2)} variant="outline" />,
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Search orders" value={q} onChange={setQ} placeholder="Order number / customer" />
        <SelectField
          label="Warehouse filter"
          value={warehouseId}
          onChange={setWarehouseId}
          options={[
            { value: "", label: "All warehouses" },
            ...warehouseRows.map((warehouse) => ({
              value: warehouse.id,
              label: `${warehouse.name ?? warehouse.id}${warehouse.code ? ` • ${warehouse.code}` : ""}`,
            })),
          ]}
        />
      </div>

      {queue.isLoading ? <LoadingBlock label="Loading dispatch queue…" /> : null}
      {queue.isError ? <InlineError message={getErrorMessage(queue.error, "Failed to load dispatch queue")} /> : null}

      {!queue.isLoading && !queue.isError && rows.length === 0 ? (
        <EmptyState title="No dispatch work right now" hint="Confirmed orders with remaining dispatch quantity will show up here." />
      ) : null}

      {rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Queue"
          title="Orders pending dispatch"
          subtitle="Create challans from the order detail page and keep the queue clear."
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Order</DataTh>
                  <DataTh>Customer</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Expected dispatch</DataTh>
                  <DataTh className="text-right">Pending qty</DataTh>
                  <DataTh>Next step</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {rows.map((row) => (
                  <DataTr key={String(row.sales_order_id)}>
                    <DataTd>{String(row.order_number ?? row.sales_order_id)}</DataTd>
                    <DataTd>{String((row.customer as { name?: string } | undefined)?.name ?? "—")}</DataTd>
                    <DataTd>{String(row.status ?? "—")}</DataTd>
                    <DataTd>{String(row.expected_dispatch_date ?? "—")}</DataTd>
                    <DataTd className="text-right">{Number(row.pending_dispatch_quantity ?? 0).toFixed(2)}</DataTd>
                    <DataTd>
                      <Link
                        className="font-medium text-[var(--accent)] hover:underline"
                        href={`/c/${companyId}/sales/orders/${row.sales_order_id}`}
                      >
                        Create challan
                      </Link>
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
