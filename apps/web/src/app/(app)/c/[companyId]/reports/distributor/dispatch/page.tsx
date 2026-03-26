"use client";

import Link from "next/link";
import * as React from "react";

import { useWarehouses } from "@/lib/masters/hooks";
import { useDispatchOperationsReport } from "@/lib/reports/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SelectField, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function formatQty(value: number) {
  return value.toFixed(2);
}

export default function DispatchOperationsReportPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");

  const report = useDispatchOperationsReport({
    companyId,
    q: q || undefined,
    warehouse_id: warehouseId || undefined,
  });
  const warehouses = useWarehouses({ companyId, activeOnly: true });

  const data = report.data?.data.data;
  const warehouseRows =
    ((warehouses.data?.data as { data?: Array<{ id: string; name?: string; code?: string }> } | undefined)?.data ??
      []) as Array<{ id: string; name?: string; code?: string }>;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Distributor reports"
        title="Dispatch operations"
        subtitle="Run the warehouse follow-up loop from one report: what is still pending, what moved partially, what is in transit, and what was delivered but not yet invoiced."
        badges={[
          <WorkspaceStatBadge key="orders" label="Pending orders" value={data?.totals.pending_dispatch_orders ?? 0} />,
          <WorkspaceStatBadge
            key="qty"
            label="Pending qty"
            value={formatQty(data?.totals.pending_dispatch_quantity ?? 0)}
            variant="outline"
          />,
        ]}
        aside={
          <WorkspacePanel
            tone="muted"
            title="How to use this"
            subtitle="This is the D10 control room. Start with pending orders, then resolve anything in transit or delivered-but-not-invoiced before finance falls behind operations."
          >
            <div className="grid gap-3 text-sm text-[var(--muted-strong)]">
              <div>Pending dispatch workload</div>
              <div>Partial order pressure</div>
              <div>In-transit challans</div>
              <div>Delivered but not invoiced exceptions</div>
            </div>
          </WorkspacePanel>
        }
      />

      <WorkspaceFilterBar
        summary={
          data ? (
            <>
              <WorkspaceStatBadge label="Open challans" value={data.totals.open_challans} />
              <WorkspaceStatBadge
                label="In transit"
                value={data.totals.dispatched_not_delivered}
                variant="outline"
              />
              <WorkspaceStatBadge
                label="Delivered not invoiced"
                value={data.totals.delivered_not_invoiced}
                variant="outline"
              />
            </>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Order / challan / customer" />
          <SelectField
            label="Warehouse"
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
      </WorkspaceFilterBar>

      {report.isLoading ? <LoadingBlock label="Loading dispatch operations…" /> : null}
      {report.isError ? <InlineError message={getErrorMessage(report.error, "Failed to load dispatch operations")} /> : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pending orders" value={String(data.totals.pending_dispatch_orders)} />
            <StatCard label="Partial orders" value={String(data.totals.partial_orders)} />
            <StatCard label="In-transit challans" value={String(data.totals.dispatched_not_delivered)} />
            <StatCard label="Delivered not invoiced" value={String(data.totals.delivered_not_invoiced)} />
          </div>

          <WorkspaceSection
            eyebrow="Pending work"
            title="Orders still needing dispatch"
            subtitle="These orders still have dispatch quantity outstanding after accounting for open challans."
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
                    <DataTh>Action</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {data.pending_dispatch.map((row) => (
                    <DataTr key={String(row.sales_order_id)}>
                      <DataTd>{String(row.order_number ?? row.sales_order_id ?? "—")}</DataTd>
                      <DataTd>{row.customer?.name ?? "—"}</DataTd>
                      <DataTd>{row.status ?? "—"}</DataTd>
                      <DataTd>{row.expected_dispatch_date ?? "—"}</DataTd>
                      <DataTd className="text-right">{formatQty(Number(row.pending_dispatch_quantity ?? 0))}</DataTd>
                      <DataTd>
                        <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/sales/orders/${row.sales_order_id}`}>
                          Open order
                        </Link>
                      </DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </WorkspaceSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <WorkspacePanel title="Partially dispatched orders" subtitle="Orders with open challans but still pending dispatch quantity.">
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Order</DataTh>
                      <DataTh>Customer</DataTh>
                      <DataTh>Open challans</DataTh>
                      <DataTh className="text-right">Pending qty</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {data.partial_orders.map((row) => (
                      <DataTr key={`partial-${String(row.sales_order_id)}`}>
                        <DataTd>{String(row.order_number ?? row.sales_order_id ?? "—")}</DataTd>
                        <DataTd>{row.customer?.name ?? "—"}</DataTd>
                        <DataTd>{row.open_challans ?? 0}</DataTd>
                        <DataTd className="text-right">{formatQty(Number(row.pending_dispatch_quantity ?? 0))}</DataTd>
                      </DataTr>
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            </WorkspacePanel>

            <WorkspacePanel title="Delivered but not invoiced" subtitle="Goods moved to the customer, but finance still needs to convert the challan into an invoice.">
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Challan</DataTh>
                      <DataTh>Customer</DataTh>
                      <DataTh>Delivered at</DataTh>
                      <DataTh className="text-right">Delivered qty</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {data.delivered_not_invoiced.map((row) => (
                      <DataTr key={row.id}>
                        <DataTd>
                          <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/sales/challans/${row.id}`}>
                            {row.challan_number ?? row.id}
                          </Link>
                        </DataTd>
                        <DataTd>{row.customer?.name ?? "—"}</DataTd>
                        <DataTd>{row.delivered_at ? new Date(row.delivered_at).toLocaleString() : "—"}</DataTd>
                        <DataTd className="text-right">{formatQty(row.delivered_quantity)}</DataTd>
                      </DataTr>
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            </WorkspacePanel>
          </div>

          <WorkspaceSection
            eyebrow="In transit"
            title="Dispatched but not yet delivered"
            subtitle="Use this to chase transporter updates and close the gap between warehouse handoff and customer confirmation."
          >
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Challan</DataTh>
                    <DataTh>Customer</DataTh>
                    <DataTh>Warehouse</DataTh>
                    <DataTh>Transport</DataTh>
                    <DataTh>Dispatched at</DataTh>
                    <DataTh className="text-right">Dispatched qty</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {data.dispatched_not_delivered.map((row) => (
                    <DataTr key={`transit-${row.id}`}>
                      <DataTd>
                        <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/sales/challans/${row.id}`}>
                          {row.challan_number ?? row.id}
                        </Link>
                      </DataTd>
                      <DataTd>{row.customer?.name ?? "—"}</DataTd>
                      <DataTd>{row.warehouse?.name ?? "—"}</DataTd>
                      <DataTd>{[row.transporter_name, row.vehicle_number].filter(Boolean).join(" · ") || "—"}</DataTd>
                      <DataTd>{row.dispatched_at ? new Date(row.dispatched_at).toLocaleString() : "—"}</DataTd>
                      <DataTd className="text-right">{formatQty(row.dispatched_quantity)}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </WorkspaceSection>
        </>
      ) : null}
    </div>
  );
}
