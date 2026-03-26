"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  useApproveQuotation,
  useCancelQuotation,
  useConvertQuotationToInvoice,
  useConvertQuotationToSalesOrder,
  useExpireQuotation,
  useQuotation,
  useSendQuotation,
} from "@/lib/billing/hooks";
import type { Quotation } from "@/lib/billing/types";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceDetailHero, WorkspacePanel, WorkspaceSection } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string; quotationId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function QuotationDetailPage({ params }: Props) {
  const { companyId, quotationId } = React.use(params);
  const router = useRouter();
  const query = useQuotation({ companyId, quotationId });
  const send = useSendQuotation({ companyId, quotationId });
  const approve = useApproveQuotation({ companyId, quotationId });
  const expire = useExpireQuotation({ companyId, quotationId });
  const cancel = useCancelQuotation({ companyId, quotationId });
  const convert = useConvertQuotationToInvoice({ companyId, quotationId });
  const convertToSalesOrder = useConvertQuotationToSalesOrder({ companyId, quotationId });
  const quote = query.data?.data as Quotation | undefined;
  const items = Array.isArray(quote?.items) ? quote.items : [];
  const invoices = Array.isArray(quote?.invoices) ? quote.invoices : [];
  const status = String(quote?.status ?? "").toLowerCase();
  const canEditState = status === "draft" || status === "sent";
  const canConvert = !["cancelled", "expired", "converted"].includes(status);

  async function runAction(action: () => Promise<unknown>, fallback: string) {
    try {
      await action();
    } catch (err) {
      window.alert(getErrorMessage(err, fallback));
    }
  }

  if (query.isLoading) return <LoadingBlock label="Loading quotation…" />;
  if (query.isError) return <InlineError message={getErrorMessage(query.error, "Failed to load quotation")} />;
  if (!quote) return <EmptyState title="Quotation not found" />;

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Sales detail"
        title={quote.quoteNumber ?? quote.quote_number ?? quote.id}
        subtitle={`Commercial offer for ${quote.customer?.name ?? "customer"} with a tracked path into invoice draft conversion.`}
        badges={[
          <Badge key="status" variant="secondary">{quote.status ?? "draft"}</Badge>,
          <Badge key="expiry" variant="outline">Expiry: {quote.expiryDate?.slice?.(0, 10) ?? quote.expiry_date ?? "—"}</Badge>,
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${companyId}/sales/quotations`}>
              <SecondaryButton type="button">Back</SecondaryButton>
            </Link>
            {canEditState ? (
              <Link href={`/c/${companyId}/sales/quotations/new`}>
                <SecondaryButton type="button">New quotation</SecondaryButton>
              </Link>
            ) : null}
            {canConvert ? (
              <SecondaryButton
                type="button"
                disabled={convertToSalesOrder.isPending}
                onClick={() =>
                  runAction(
                    async () => {
                      const res = await convertToSalesOrder.mutateAsync();
                      router.push(`/c/${companyId}/sales/orders/${res.data.id}`);
                    },
                    "Failed to convert quotation",
                  )
                }
              >
                {convertToSalesOrder.isPending ? "Converting…" : "Convert to sales order"}
              </SecondaryButton>
            ) : null}
            {canConvert ? (
              <PrimaryButton
                type="button"
                disabled={convert.isPending}
                onClick={() =>
                  runAction(
                    async () => {
                      const res = await convert.mutateAsync({});
                      router.push(`/c/${companyId}/sales/invoices/${res.data.id}`);
                    },
                    "Failed to convert quotation",
                  )
                }
              >
                {convert.isPending ? "Converting…" : "Convert to invoice"}
              </PrimaryButton>
            ) : null}
          </div>
        }
        metrics={[
          { label: "Customer", value: quote.customer?.name ?? "—" },
          { label: "Issue date", value: quote.issueDate?.slice?.(0, 10) ?? quote.issue_date ?? "—" },
          { label: "Subtotal", value: quote.sub_total ?? quote.subTotal ?? "—" },
          { label: "Total", value: quote.total ?? "—" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <WorkspaceSection eyebrow="Quotation body" title="Quoted items" subtitle="The commercial offer is stored exactly as it will flow into invoice draft conversion.">
          <WorkspacePanel>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit price</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id ?? `${item.product_id}:${item.quantity}`} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{item.product?.name ?? item.product_id}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{item.unit_price}</td>
                      <td className="px-3 py-2 text-right">{item.discount ?? "0"}</td>
                      <td className="px-3 py-2 text-right font-medium">{item.line_total ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspacePanel>
        </WorkspaceSection>

        <div className="space-y-6">
          <WorkspacePanel
            title="Commercial actions"
            subtitle="Move the quotation through the sales posture before converting it."
          >
            <div className="flex flex-wrap gap-2">
              <SecondaryButton type="button" disabled={send.isPending || !canEditState} onClick={() => runAction(() => send.mutateAsync(undefined), "Failed to mark quotation as sent")}>
                Mark sent
              </SecondaryButton>
              <SecondaryButton type="button" disabled={approve.isPending || !canConvert} onClick={() => runAction(() => approve.mutateAsync(undefined), "Failed to approve quotation")}>
                Approve
              </SecondaryButton>
              <SecondaryButton type="button" disabled={expire.isPending || !canConvert} onClick={() => runAction(() => expire.mutateAsync(undefined), "Failed to expire quotation")}>
                Expire
              </SecondaryButton>
              <SecondaryButton type="button" disabled={cancel.isPending || status === "converted"} onClick={() => runAction(() => cancel.mutateAsync(undefined), "Failed to cancel quotation")}>
                Cancel
              </SecondaryButton>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Commercial context"
            subtitle="Notes and customer data remain attached to the quote so conversion preserves the selling context."
          >
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold text-[var(--foreground)]">Customer:</span> {quote.customer?.name ?? "—"}</div>
              <div><span className="font-semibold text-[var(--foreground)]">Email:</span> {quote.customer?.email ?? "—"}</div>
              <div><span className="font-semibold text-[var(--foreground)]">GSTIN:</span> {quote.customer?.gstin ?? "—"}</div>
              <div><span className="font-semibold text-[var(--foreground)]">Notes:</span> {quote.notes ?? "—"}</div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Invoice conversions"
            subtitle="Once converted, the quotation stays linked to the invoice drafts it produced."
          >
            {invoices.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No invoice draft has been created from this quotation yet.</div>
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
        </div>
      </div>
    </div>
  );
}
