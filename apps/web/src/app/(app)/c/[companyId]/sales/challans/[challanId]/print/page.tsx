"use client";

import * as React from "react";

import { useDeliveryChallan } from "@/lib/billing/hooks";
import { usePrintTemplates } from "@/lib/migration/hooks";
import { SecondaryButton } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string; challanId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function DeliveryChallanPrintPage({ params }: Props) {
  const { companyId, challanId } = React.use(params);
  const query = useDeliveryChallan({ companyId, challanId });
  const printTemplates = usePrintTemplates(companyId);
  const challan = query.data?.data;
  const items = Array.isArray(challan?.items) ? challan.items : [];
  const templateRows = Array.isArray(printTemplates.data?.data) ? printTemplates.data.data : [];
  const challanTemplate = templateRows.find(
    (template) =>
      (template.templateType ?? template.template_type) === "challan" &&
      Boolean(template.isDefault ?? template.is_default),
  );
  const latestVersion = Array.isArray(challanTemplate?.versions) ? challanTemplate?.versions?.[0] : null;
  const layout = (latestVersion?.layoutJson ?? latestVersion?.layout_json ?? {}) as {
    header?: { title?: string };
    sections?: Array<{ key?: string }>;
    footer?: { text?: string };
  };
  const visibleSections = new Set(
    Array.isArray(layout.sections) && layout.sections.length > 0
      ? layout.sections.map((section) => String(section.key ?? ""))
      : ["party", "items", "footer"],
  );

  if (query.isLoading || printTemplates.isLoading) return <LoadingBlock label="Loading printable challan…" />;
  if (query.isError) return <InlineError message={getErrorMessage(query.error, "Failed to load challan")} />;
  if (printTemplates.isError) return <InlineError message={getErrorMessage(printTemplates.error, "Failed to load challan template")} />;
  if (!challan) return <EmptyState title="Delivery challan not found" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 print:px-0 print:py-0">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Printable challan</div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {challan.challanNumber ?? challan.challan_number ?? challan.id}
          </h1>
        </div>
        <SecondaryButton type="button" onClick={() => window.print()}>
          Print / Save PDF
        </SecondaryButton>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 text-black shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between gap-6 border-b pb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {layout.header?.title ?? "Delivery challan"}
            </div>
            <div className="mt-2 text-3xl font-semibold">
              {challan.challanNumber ?? challan.challan_number ?? challan.id}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Date: {String(challan.challanDate ?? challan.challan_date ?? "—")}
            </div>
            <div className="text-sm text-slate-600">
              Status: {String(challan.status ?? "—")}
            </div>
          </div>
          <div className="text-right text-sm text-slate-600">
            <div>Warehouse: {challan.warehouse?.name ?? "—"}</div>
            <div>Order: {challan.salesOrder?.orderNumber ?? challan.salesOrder?.order_number ?? "—"}</div>
            <div>Transporter: {challan.transporterName ?? challan.transporter_name ?? "—"}</div>
            <div>Vehicle: {challan.vehicleNumber ?? challan.vehicle_number ?? "—"}</div>
          </div>
        </div>

        {visibleSections.has("party") ? (
          <div className="grid gap-6 border-b py-6 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Customer</div>
              <div className="mt-2 text-lg font-medium">{challan.customer?.name ?? "—"}</div>
              <div className="text-sm text-slate-600">{challan.customer?.phone ?? "—"}</div>
              <div className="text-sm text-slate-600">{challan.customer?.gstin ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</div>
              <div className="mt-2 text-sm text-slate-700">
                Dispatch: {challan.dispatchNotes ?? challan.dispatch_notes ?? "—"}
              </div>
              <div className="text-sm text-slate-700">
                Delivery: {challan.deliveryNotes ?? challan.delivery_notes ?? "—"}
              </div>
            </div>
          </div>
        ) : null}

        {visibleSections.has("items") ? (
        <div className="py-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-3 font-semibold">Product</th>
                <th className="py-2 px-3 text-right font-semibold">Requested</th>
                <th className="py-2 px-3 text-right font-semibold">Dispatched</th>
                <th className="py-2 px-3 text-right font-semibold">Delivered</th>
                <th className="py-2 pl-3 text-right font-semibold">Short</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{item.product?.name ?? item.productId ?? item.product_id}</div>
                    <div className="text-xs text-slate-500">{item.product?.sku ?? "—"}</div>
                  </td>
                  <td className="py-3 px-3 text-right">{Number(item.quantityRequested ?? item.quantity_requested ?? 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right">{Number(item.quantityDispatched ?? item.quantity_dispatched ?? 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right">{Number(item.quantityDelivered ?? item.quantity_delivered ?? 0).toFixed(2)}</td>
                  <td className="py-3 pl-3 text-right">{Number(item.shortSupplyQuantity ?? item.short_supply_quantity ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : null}

        {visibleSections.has("footer") ? (
          <div className="border-t pt-4 text-sm text-slate-600">
            {layout.footer?.text ?? "Generated from the active challan print template."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
