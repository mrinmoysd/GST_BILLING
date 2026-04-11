"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  useCancelSalesOrder,
  useConfirmSalesOrder,
  useConvertSalesOrderToInvoice,
  useCreateDeliveryChallan,
  useDeliveryChallans,
  useSalesOrder,
} from "@/lib/billing/hooks";
import type { SalesOrder } from "@/lib/billing/types";
import { formatDateLabel } from "@/lib/format/date";
import { getErrorMessage } from "@/lib/errors";
import { useWarehouses } from "@/lib/masters/hooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DetailInfoList, DetailRail, DetailTabPanel, DetailTabs } from "@/lib/ui/detail";
import { PrimaryButton, SecondaryButton, SelectField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceDetailHero, WorkspacePanel } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string; salesOrderId: string }> };

export default function SalesOrderDetailPage({ params }: Props) {
  const { companyId, salesOrderId } = React.use(params);
  const router = useRouter();
  const query = useSalesOrder({ companyId, salesOrderId });
  const confirm = useConfirmSalesOrder({ companyId, salesOrderId });
  const cancel = useCancelSalesOrder({ companyId, salesOrderId });
  const convert = useConvertSalesOrderToInvoice({ companyId, salesOrderId });
  const createChallan = useCreateDeliveryChallan({ companyId, salesOrderId });
  const challansQuery = useDeliveryChallans({
    companyId,
    page: 1,
    limit: 20,
    sales_order_id: salesOrderId,
  });
  const warehousesQuery = useWarehouses({ companyId, activeOnly: true });
  const order = query.data?.data as SalesOrder | undefined;
  const [convertError, setConvertError] = React.useState<string | null>(null);
  const [challanError, setChallanError] = React.useState<string | null>(null);
  const [quantities, setQuantities] = React.useState<Record<string, string>>({});
  const [dispatchQuantities, setDispatchQuantities] = React.useState<Record<string, string>>({});
  const [warehouseId, setWarehouseId] = React.useState("");
  const [transporterName, setTransporterName] = React.useState("");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [dispatchNotes, setDispatchNotes] = React.useState("");

  if (query.isLoading) return <LoadingBlock label="Loading sales order…" />;
  if (query.isError) return <InlineError message={getErrorMessage(query.error, "Failed to load sales order")} />;
  if (!order) return <EmptyState title="Sales order not found" />;

  const items = Array.isArray(order.items) ? order.items : [];
  const invoices = Array.isArray(order.invoices) ? order.invoices : [];
  const status = String(order.status ?? "").toLowerCase();
  const canConfirm = status === "draft";
  const canConvert = status === "confirmed" || status === "partially_fulfilled";

  async function runAction(
    action: () => Promise<unknown>,
    messages: { success: string; failure: string },
  ) {
    try {
      await action();
      toastSuccess(messages.success);
    } catch (err) {
      toastError(err, {
        fallback: messages.failure,
        context: "sales-order-action",
        metadata: { companyId, salesOrderId },
      });
    }
  }

  const fulfillmentRows = items.map((item) => {
    const ordered = Number(item.quantity_ordered ?? item.quantity ?? 0);
    const fulfilled = Number(item.quantity_fulfilled ?? 0);
    const remaining = Math.max(0, ordered - fulfilled);
    return { item, ordered, fulfilled, remaining };
  });
  const challanPayload = challansQuery.data?.data as
    | { data?: Array<Record<string, unknown>> }
    | undefined;
  const challanRows = challanPayload?.data ?? [];
  const warehousePayload = warehousesQuery.data?.data as
    | { data?: Array<{ id: string; name?: string; code?: string }> }
    | undefined;
  const warehouseRows = warehousePayload?.data ?? [];
  const detailRail = (
    <>
      <DetailRail
        eyebrow="Quick actions"
        title="Order controls"
        subtitle="Keep the main document decisions visible while moving between fulfillment, dispatch, and conversion tabs."
      >
        <div className="flex flex-col gap-2">
          <Link href={`/c/${companyId}/sales/orders`}>
            <SecondaryButton type="button" className="w-full justify-start">Back to orders</SecondaryButton>
          </Link>
          <Link href={`/c/${companyId}/sales/dispatch`}>
            <SecondaryButton type="button" className="w-full justify-start">Dispatch queue</SecondaryButton>
          </Link>
          {canConfirm ? (
            <SecondaryButton
              type="button"
              className="w-full justify-start"
              disabled={confirm.isPending}
              onClick={() =>
                runAction(() => confirm.mutateAsync(), {
                  success: "Sales order confirmed.",
                  failure: "Failed to confirm sales order.",
                })
              }
            >
              {confirm.isPending ? "Confirming…" : "Confirm order"}
            </SecondaryButton>
          ) : null}
          {status !== "fulfilled" && status !== "cancelled" ? (
            <SecondaryButton
              type="button"
              className="w-full justify-start"
              disabled={cancel.isPending || status === "partially_fulfilled"}
              onClick={() =>
                runAction(() => cancel.mutateAsync(), {
                  success: "Sales order cancelled.",
                  failure: "Failed to cancel sales order.",
                })
              }
            >
              {cancel.isPending ? "Cancelling…" : "Cancel order"}
            </SecondaryButton>
          ) : null}
        </div>
      </DetailRail>
      <DetailRail
        eyebrow="Snapshot"
        title="Order posture"
        subtitle="These details stay visible while the main tab body focuses on one workflow at a time."
      >
        <DetailInfoList
          items={[
            { label: "Customer", value: order.customer?.name ?? "—" },
            { label: "Status", value: order.status ?? "—" },
            { label: "Order date", value: formatDateLabel(order.orderDate ?? order.order_date) },
            {
              label: "Expected dispatch",
              value: formatDateLabel(order.expectedDispatchDate ?? order.expected_dispatch_date),
            },
            { label: "Total", value: order.total ?? "—" },
          ]}
        />
      </DetailRail>
    </>
  );

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Sales detail"
        title={order.orderNumber ?? order.order_number ?? order.id}
        subtitle={`Operational order for ${order.customer?.name ?? "customer"} with staged invoice conversion and visible fulfillment progress.`}
        badges={[
          <Badge key="status" variant="secondary">{order.status ?? "draft"}</Badge>,
          <Badge key="quote" variant="outline">Quote: {order.quotation?.quoteNumber ?? order.quotation?.quote_number ?? "—"}</Badge>,
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${companyId}/sales/orders`}>
              <SecondaryButton type="button">Back</SecondaryButton>
            </Link>
            {canConfirm ? (
              <SecondaryButton
                type="button"
                disabled={confirm.isPending}
                onClick={() =>
                  runAction(() => confirm.mutateAsync(), {
                    success: "Sales order confirmed.",
                    failure: "Failed to confirm sales order.",
                  })
                }
              >
                Confirm
              </SecondaryButton>
            ) : null}
            {status !== "fulfilled" && status !== "cancelled" ? (
              <SecondaryButton
                type="button"
                disabled={cancel.isPending || status === "partially_fulfilled"}
                onClick={() =>
                  runAction(() => cancel.mutateAsync(), {
                    success: "Sales order cancelled.",
                    failure: "Failed to cancel sales order.",
                  })
                }
              >
                Cancel
              </SecondaryButton>
            ) : null}
          </div>
        }
        metrics={[
          { label: "Customer", value: order.customer?.name ?? "—" },
          { label: "Order date", value: formatDateLabel(order.orderDate ?? order.order_date) },
          { label: "Expected dispatch", value: formatDateLabel(order.expectedDispatchDate ?? order.expected_dispatch_date) },
          { label: "Total", value: order.total ?? "—" },
        ]}
      />

      <DetailTabs
        defaultValue="summary"
        items={[
          { id: "summary", label: "Summary", badge: items.length },
          { id: "dispatch", label: "Dispatch", badge: challanRows.length },
          { id: "conversion", label: "Invoice conversion", badge: invoices.length },
        ]}
      >
        <DetailTabPanel value="summary" rail={detailRail}>
          <WorkspacePanel title="Ordered items" subtitle="Remaining quantity stays visible so invoice conversion can be partial or complete.">
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="min-w-[820px] w-full text-sm">
                <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2 text-right">Fulfilled</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                    <th className="px-3 py-2 text-right">Convert qty</th>
                  </tr>
                </thead>
                <tbody>
                  {fulfillmentRows.map(({ item, ordered, fulfilled, remaining }) => (
                    <tr key={item.id ?? `${item.product_id}:${ordered}`} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{item.product?.name ?? item.product_id}</td>
                      <td className="px-3 py-2 text-right">{ordered}</td>
                      <td className="px-3 py-2 text-right">{fulfilled}</td>
                      <td className="px-3 py-2 text-right font-medium">{remaining}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                          value={quantities[item.id ?? ""] ?? String(remaining)}
                          onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id ?? ""]: e.target.value }))}
                          disabled={remaining <= 0}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Commercial context" subtitle="The order preserves both customer and quotation origin, so fulfillment stays tied to the selling conversation.">
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold text-[var(--foreground)]">Customer:</span> {order.customer?.name ?? "—"}</div>
              <div><span className="font-semibold text-[var(--foreground)]">Quotation:</span> {order.quotation?.quoteNumber ?? order.quotation?.quote_number ?? "—"}</div>
              <div><span className="font-semibold text-[var(--foreground)]">Notes:</span> {order.notes ?? "—"}</div>
            </div>
          </WorkspacePanel>
        </DetailTabPanel>

        <DetailTabPanel value="dispatch" rail={detailRail}>
          <WorkspacePanel title="Create delivery challan" subtitle="Move the order into warehouse execution without posting stock or accounting yet.">
            {challanError ? <InlineError message={challanError} /> : null}
            <div className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <SelectField label="Warehouse" value={warehouseId} onChange={setWarehouseId}>
                    <option value="">Select warehouse</option>
                    {warehouseRows.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name ?? warehouse.id}{warehouse.code ? ` • ${warehouse.code}` : ""}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <label className="block space-y-2">
                  <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Transporter</span>
                  <input
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none"
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Vehicle number</span>
                  <input
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Dispatch notes</span>
                  <input
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none"
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                  />
                </label>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                <table className="min-w-[520px] w-full text-sm">
                  <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Remaining</th>
                      <th className="px-3 py-2 text-right">Dispatch qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fulfillmentRows.map(({ item, remaining }) => (
                      <tr key={`dispatch-${item.id ?? item.product_id}`} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2">{item.product?.name ?? item.product_id}</td>
                        <td className="px-3 py-2 text-right">{remaining}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                            value={dispatchQuantities[item.id ?? ""] ?? String(remaining)}
                            onChange={(e) => setDispatchQuantities((prev) => ({ ...prev, [item.id ?? ""]: e.target.value }))}
                            disabled={remaining <= 0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PrimaryButton
                type="button"
                disabled={createChallan.isPending || !warehouseId}
                onClick={async () => {
                  setChallanError(null);
                  try {
                    const challanItems = fulfillmentRows
                      .map(({ item, remaining }) => ({
                        sales_order_item_id: item.id ?? "",
                        quantity_requested: dispatchQuantities[item.id ?? ""] ?? String(remaining),
                      }))
                      .filter((entry) => entry.sales_order_item_id && Number(entry.quantity_requested) > 0);
                    const res = await createChallan.mutateAsync({
                      warehouse_id: warehouseId,
                      transporter_name: transporterName || undefined,
                      vehicle_number: vehicleNumber || undefined,
                      dispatch_notes: dispatchNotes || undefined,
                      items: challanItems,
                    });
                    toastSuccess("Delivery challan created.");
                    router.push(`/c/${companyId}/sales/challans/${res.data.id}`);
                  } catch (err) {
                    const message = getErrorMessage(err, "Failed to create delivery challan.");
                    setChallanError(message);
                    toastError(err, {
                      fallback: "Failed to create delivery challan.",
                      title: message,
                      context: "sales-order-create-challan",
                      metadata: { companyId, salesOrderId },
                    });
                  }
                }}
              >
                {createChallan.isPending ? "Creating…" : "Create delivery challan"}
              </PrimaryButton>
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Delivery challans" subtitle="Dispatch can now happen before invoice creation, with visible source traceability.">
            {challansQuery.isLoading ? <div className="text-sm text-[var(--muted)]">Loading challans…</div> : null}
            {!challansQuery.isLoading && challanRows.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No challans created from this sales order yet.</div>
            ) : (
              <div className="space-y-3">
                {challanRows.map((challan) => (
                  <Link
                    key={String(challan.id)}
                    href={`/c/${companyId}/sales/challans/${challan.id}`}
                    className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm hover:border-[var(--accent)]"
                  >
                    <div className="font-semibold text-[var(--foreground)]">
                      {String(challan.challanNumber ?? challan.challan_number ?? challan.id)}
                    </div>
                    <div className="mt-1 text-[var(--muted)]">
                      Status: {String(challan.status ?? "draft")} · Warehouse: {String((challan.warehouse as { name?: string } | undefined)?.name ?? "—")}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </WorkspacePanel>
        </DetailTabPanel>

        <DetailTabPanel value="conversion" rail={detailRail}>
          <WorkspacePanel title="Invoice conversion" subtitle="Generate a draft invoice from all remaining quantity or only the selected partial quantities.">
            {convertError ? <InlineError message={convertError} /> : null}
            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                type="button"
                disabled={convert.isPending || !canConvert}
                onClick={async () => {
                  setConvertError(null);
                  try {
                    const itemsToConvert = fulfillmentRows
                      .map(({ item, remaining }) => ({
                        sales_order_item_id: item.id ?? "",
                        quantity: quantities[item.id ?? ""] ?? String(remaining),
                      }))
                      .filter((entry) => entry.sales_order_item_id && Number(entry.quantity) > 0);
                    const res = await convert.mutateAsync({ items: itemsToConvert });
                    toastSuccess("Sales order converted to invoice.");
                    router.push(`/c/${companyId}/sales/invoices/${res.data.id}`);
                  } catch (err) {
                    const message = getErrorMessage(err, "Failed to convert sales order.");
                    setConvertError(message);
                    toastError(err, {
                      fallback: "Failed to convert sales order.",
                      title: message,
                      context: "sales-order-convert",
                      metadata: { companyId, salesOrderId },
                    });
                  }
                }}
              >
                {convert.isPending ? "Converting…" : "Convert to invoice"}
              </PrimaryButton>
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="Generated invoices" subtitle="Each conversion creates a draft invoice linked back to this order.">
            {invoices.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No invoices generated from this sales order yet.</div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/c/${companyId}/sales/invoices/${invoice.id}`}
                    className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm hover:border-[var(--accent)]"
                  >
                    <div className="font-semibold text-[var(--foreground)]">{invoice.invoiceNumber ?? invoice.invoice_number ?? invoice.id}</div>
                    <div className="mt-1 text-[var(--muted)]">Status: {invoice.status ?? "draft"} · Total: {invoice.total ?? "—"}</div>
                  </Link>
                ))}
              </div>
            )}
          </WorkspacePanel>
        </DetailTabPanel>
      </DetailTabs>
    </div>
  );
}
