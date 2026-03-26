"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  useConvertDeliveryChallanToInvoice,
  useDeliveryChallan,
  usePatchDeliveryChallan,
  useTransitionDeliveryChallan,
} from "@/lib/billing/hooks";
import type { DeliveryChallan } from "@/lib/billing/types";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceDetailHero, WorkspacePanel, WorkspaceSection } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string; challanId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type ItemDraft = {
  requested: string;
  dispatched: string;
  delivered: string;
  short: string;
};

export default function DeliveryChallanDetailPage({ params }: Props) {
  const { companyId, challanId } = React.use(params);
  const router = useRouter();
  const query = useDeliveryChallan({ companyId, challanId });
  const patch = usePatchDeliveryChallan({ companyId, challanId });
  const transition = useTransitionDeliveryChallan({ companyId, challanId });
  const convert = useConvertDeliveryChallanToInvoice({ companyId, challanId });
  const challan = query.data?.data as DeliveryChallan | undefined;

  const [transporterName, setTransporterName] = React.useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = React.useState<string | null>(null);
  const [dispatchNotes, setDispatchNotes] = React.useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = React.useState<string | null>(null);
  const [itemDrafts, setItemDrafts] = React.useState<Record<string, ItemDraft>>({});
  const [error, setError] = React.useState<string | null>(null);

  const items = Array.isArray(challan?.items) ? challan.items : [];
  const events = Array.isArray(challan?.events) ? challan.events : [];

  React.useEffect(() => {
    if (!challan) {
      setItemDrafts({});
      return;
    }

    const nextItems = Array.isArray(challan.items) ? challan.items : [];

    setItemDrafts(
      Object.fromEntries(
        nextItems.map((item) => [
          item.id,
          {
            requested: String(item.quantityRequested ?? item.quantity_requested ?? 0),
            dispatched: String(item.quantityDispatched ?? item.quantity_dispatched ?? 0),
            delivered: String(item.quantityDelivered ?? item.quantity_delivered ?? 0),
            short: String(item.shortSupplyQuantity ?? item.short_supply_quantity ?? 0),
          },
        ]),
      ),
    );
  }, [challan]);

  if (query.isLoading) return <LoadingBlock label="Loading delivery challan…" />;
  if (query.isError) return <InlineError message={getErrorMessage(query.error, "Failed to load delivery challan")} />;
  if (!challan) return <EmptyState title="Delivery challan not found" />;

  const status = String(challan.status ?? "draft").toLowerCase();
  const canEdit = !challan.invoice?.id && !["cancelled", "delivered"].includes(status);
  const transporterValue = transporterName ?? challan.transporterName ?? challan.transporter_name ?? "";
  const vehicleValue = vehicleNumber ?? challan.vehicleNumber ?? challan.vehicle_number ?? "";
  const dispatchValue = dispatchNotes ?? challan.dispatchNotes ?? challan.dispatch_notes ?? "";
  const deliveryValue = deliveryNotes ?? challan.deliveryNotes ?? challan.delivery_notes ?? "";

  function updateItemDraft(itemId: string, key: keyof ItemDraft, value: string) {
    setItemDrafts((prev) => ({
      ...prev,
      [itemId]: {
        requested: prev[itemId]?.requested ?? "0",
        dispatched: prev[itemId]?.dispatched ?? "0",
        delivered: prev[itemId]?.delivered ?? "0",
        short: prev[itemId]?.short ?? "0",
        [key]: value,
      },
    }));
  }

  function buildPatchItems() {
    return items
      .map((item) => ({
        sales_order_item_id:
          item.salesOrderItem?.id ?? item.salesOrderItemId ?? item.sales_order_item_id ?? "",
        quantity_requested:
          itemDrafts[item.id]?.requested ??
          String(item.quantityRequested ?? item.quantity_requested ?? 0),
        quantity_dispatched:
          itemDrafts[item.id]?.dispatched ??
          String(item.quantityDispatched ?? item.quantity_dispatched ?? 0),
        quantity_delivered:
          itemDrafts[item.id]?.delivered ??
          String(item.quantityDelivered ?? item.quantity_delivered ?? 0),
        short_supply_quantity:
          itemDrafts[item.id]?.short ??
          String(item.shortSupplyQuantity ?? item.short_supply_quantity ?? 0),
      }))
      .filter((item) => item.sales_order_item_id);
  }

  async function saveChallanUpdates() {
    setError(null);
    try {
      await patch.mutateAsync({
        transporter_name: transporterValue || undefined,
        vehicle_number: vehicleValue || undefined,
        dispatch_notes: dispatchValue || undefined,
        delivery_notes: deliveryValue || undefined,
        items: buildPatchItems(),
      });
      toast.success("Challan updated");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update challan");
      setError(message);
      toast.error(message);
      throw err;
    }
  }

  async function runStatus(nextStatus: string) {
    setError(null);
    try {
      if (canEdit) {
        await saveChallanUpdates();
      }
      await transition.mutateAsync({
        status: nextStatus,
        dispatch_notes: dispatchValue || undefined,
        delivery_notes: deliveryValue || undefined,
      });
      toast.success(`Challan moved to ${nextStatus}`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update challan status");
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Dispatch detail"
        title={challan.challanNumber ?? challan.challan_number ?? challan.id}
        subtitle={`Warehouse movement for ${challan.customer?.name ?? "customer"} with lifecycle and invoice traceability visible on one page.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${companyId}/sales/challans`}>
              <SecondaryButton type="button">Back</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/sales/challans/${challanId}/print`}>
              <SecondaryButton type="button">Print challan</SecondaryButton>
            </Link>
            {status === "draft" ? (
              <>
                <SecondaryButton type="button" disabled={transition.isPending || patch.isPending} onClick={() => runStatus("picked")}>
                  Picked
                </SecondaryButton>
                <SecondaryButton type="button" disabled={transition.isPending || patch.isPending} onClick={() => runStatus("packed")}>
                  Packed
                </SecondaryButton>
                <SecondaryButton type="button" disabled={transition.isPending || patch.isPending} onClick={() => runStatus("dispatched")}>
                  Dispatch
                </SecondaryButton>
              </>
            ) : null}
            {status === "picked" || status === "packed" ? (
              <SecondaryButton type="button" disabled={transition.isPending || patch.isPending} onClick={() => runStatus("dispatched")}>
                Dispatch
              </SecondaryButton>
            ) : null}
            {status === "dispatched" ? (
              <SecondaryButton type="button" disabled={transition.isPending || patch.isPending} onClick={() => runStatus("delivered")}>
                Mark delivered
              </SecondaryButton>
            ) : null}
            {status !== "cancelled" && !challan.invoice?.id ? (
              <SecondaryButton type="button" disabled={transition.isPending || patch.isPending} onClick={() => runStatus("cancelled")}>
                Cancel
              </SecondaryButton>
            ) : null}
          </div>
        }
        metrics={[
          { label: "Status", value: challan.status ?? "—" },
          { label: "Warehouse", value: challan.warehouse?.name ?? "—" },
          { label: "Order", value: challan.salesOrder?.orderNumber ?? challan.salesOrder?.order_number ?? "—" },
          { label: "Invoice", value: challan.invoice?.invoiceNumber ?? challan.invoice?.invoice_number ?? "Not invoiced" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <WorkspaceSection eyebrow="Dispatch body" title="Challan items" subtitle="Requested, dispatched, delivered, and short quantities stay separate.">
          <WorkspacePanel>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Requested</th>
                    <th className="px-3 py-2 text-right">Dispatched</th>
                    <th className="px-3 py-2 text-right">Delivered</th>
                    <th className="px-3 py-2 text-right">Short</th>
                    <th className="px-3 py-2 text-right">Invoiced</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{item.product?.name ?? item.productId ?? item.product_id}</td>
                      <td className="px-3 py-2 text-right">
                        {canEdit ? (
                          <input
                            className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                            value={itemDrafts[item.id]?.requested ?? "0"}
                            onChange={(e) => updateItemDraft(item.id, "requested", e.target.value)}
                          />
                        ) : (
                          Number(item.quantityRequested ?? item.quantity_requested ?? 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canEdit ? (
                          <input
                            className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                            value={itemDrafts[item.id]?.dispatched ?? "0"}
                            onChange={(e) => updateItemDraft(item.id, "dispatched", e.target.value)}
                          />
                        ) : (
                          Number(item.quantityDispatched ?? item.quantity_dispatched ?? 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canEdit ? (
                          <input
                            className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                            value={itemDrafts[item.id]?.delivered ?? "0"}
                            onChange={(e) => updateItemDraft(item.id, "delivered", e.target.value)}
                          />
                        ) : (
                          Number(item.quantityDelivered ?? item.quantity_delivered ?? 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canEdit ? (
                          <input
                            className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                            value={itemDrafts[item.id]?.short ?? "0"}
                            onChange={(e) => updateItemDraft(item.id, "short", e.target.value)}
                          />
                        ) : (
                          Number(item.shortSupplyQuantity ?? item.short_supply_quantity ?? 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{Number(item.salesOrderItem?.quantityFulfilled ?? item.salesOrderItem?.quantity_fulfilled ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspacePanel>
        </WorkspaceSection>

        <div className="space-y-6">
          <WorkspacePanel title="Transport and notes" subtitle="Open challans can still be updated before delivery and invoice lock.">
            {error ? <InlineError message={error} /> : null}
            <div className="space-y-4">
              <TextField label="Transporter" value={transporterValue} onChange={setTransporterName} />
              <TextField label="Vehicle number" value={vehicleValue} onChange={setVehicleNumber} />
              <TextField label="Dispatch notes" value={dispatchValue} onChange={setDispatchNotes} />
              <TextField label="Delivery notes" value={deliveryValue} onChange={setDeliveryNotes} />
              {canEdit ? (
                <PrimaryButton type="button" disabled={patch.isPending} onClick={saveChallanUpdates}>
                  {patch.isPending ? "Saving…" : "Save challan updates"}
                </PrimaryButton>
              ) : null}
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="Invoice conversion" subtitle="This release keeps conversion simple: one challan becomes one invoice draft.">
            {challan.invoice?.id ? (
              <Link
                className="font-medium text-[var(--accent)] hover:underline"
                href={`/c/${companyId}/sales/invoices/${challan.invoice.id}`}
              >
                Open linked invoice
              </Link>
            ) : (
              <PrimaryButton
                type="button"
                disabled={convert.isPending || !["packed", "dispatched", "delivered"].includes(status)}
                onClick={async () => {
                  setError(null);
                  try {
                    const res = await convert.mutateAsync({});
                    router.push(`/c/${companyId}/sales/invoices/${res.data.id}`);
                  } catch (err: unknown) {
                    const message = getErrorMessage(err, "Failed to convert challan to invoice");
                    setError(message);
                    toast.error(message);
                  }
                }}
              >
                {convert.isPending ? "Converting…" : "Convert to invoice"}
              </PrimaryButton>
            )}
          </WorkspacePanel>

          <WorkspacePanel title="Lifecycle history" subtitle="Challan events give warehouse and finance teams a clear progression trail.">
            <div className="space-y-3 text-sm">
              {events.length === 0 ? (
                <div className="text-[var(--muted)]">No events recorded yet.</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="font-semibold text-[var(--foreground)]">
                      {event.summary ?? event.eventType ?? event.event_type ?? "Event"}
                    </div>
                    <div className="mt-1 text-[var(--muted)]">
                      {(event.createdAt ?? event.created_at ?? "—") as string}
                    </div>
                  </div>
                ))
              )}
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </div>
  );
}
