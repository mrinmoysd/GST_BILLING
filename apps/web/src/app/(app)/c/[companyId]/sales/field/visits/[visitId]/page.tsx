"use client";

import * as React from "react";
import Link from "next/link";

import { useInvoices } from "@/lib/billing/hooks";
import { getErrorMessage } from "@/lib/errors";
import {
  useCheckInVisit,
  useCheckOutVisit,
  useCreateFieldCollectionUpdate,
  useCreateFieldQuotation,
  useCreateFieldSalesOrder,
  useMarkMissedVisit,
  useUpdateVisit,
  useVisit,
} from "@/lib/field-sales/hooks";
import { useProducts } from "@/lib/masters/hooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceDetailHero, WorkspacePanel } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string; visitId: string }> };

type DraftLine = {
  product_id: string;
  quantity: string;
  unit_price: string;
  discount: string;
};

export default function FieldVisitDetailPage({ params }: Props) {
  const { companyId, visitId } = React.use(params);
  const visit = useVisit({ companyId, visitId });
  const checkIn = useCheckInVisit(companyId, visitId);
  const checkOut = useCheckOutVisit(companyId, visitId);
  const markMissed = useMarkMissedVisit(companyId, visitId);
  const updateVisit = useUpdateVisit(companyId, visitId);
  const createOrder = useCreateFieldSalesOrder(companyId, visitId);
  const createQuotation = useCreateFieldQuotation(companyId, visitId);
  const createCollectionUpdate = useCreateFieldCollectionUpdate(companyId, visitId);
  const products = useProducts({ companyId, page: 1, limit: 200 });
  const invoices = useInvoices({ companyId, page: 1, limit: 200, status: "issued", enabled: Boolean(visit.data?.data?.customer?.id) });

  const [completionOutcome, setCompletionOutcome] = React.useState("order_booked");
  const [completionNotes, setCompletionNotes] = React.useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = React.useState("");
  const [missedReason, setMissedReason] = React.useState("");
  const [collectionInvoiceId, setCollectionInvoiceId] = React.useState("");
  const [collectionPromisedAmount, setCollectionPromisedAmount] = React.useState("");
  const [collectionPromisedDate, setCollectionPromisedDate] = React.useState("");
  const [collectionRemarks, setCollectionRemarks] = React.useState("");
  const [documentNotes, setDocumentNotes] = React.useState("");
  const [quotationExpiryDate, setQuotationExpiryDate] = React.useState("");
  const [lines, setLines] = React.useState<DraftLine[]>([{ product_id: "", quantity: "1", unit_price: "", discount: "" }]);

  const visitRecord = visit.data?.data;
  const productRows = products.data?.data ?? [];
  const invoiceRows = ((invoices.data as unknown as { data?: Array<Record<string, unknown>> })?.data ?? []).filter(
    (row) => String(row.customerId ?? row.customer_id ?? "") === String(visitRecord?.customer?.id ?? ""),
  );

  const orderTotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity || 0);
    const price = Number(line.unit_price || 0);
    const discount = Number(line.discount || 0);
    return sum + qty * price - discount;
  }, 0);

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Field sales"
        title={visitRecord?.customer?.name ?? "Visit"}
        subtitle="Capture what happened at the outlet, tie it to real sales documents, and keep recovery follow-up connected to D9."
        badges={visitRecord ? [<span key="status" className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">{visitRecord.status}</span>] : undefined}
        metrics={
          visitRecord
            ? [
                { label: "Route", value: visitRecord.route?.name ?? "Unassigned" },
                { label: "Beat", value: visitRecord.beat?.name ?? "Unassigned" },
                { label: "Check in", value: visitRecord.checkInAt ?? visitRecord.check_in_at ?? "Not started" },
                { label: "Check out", value: visitRecord.checkOutAt ?? visitRecord.check_out_at ?? "Open" },
              ]
            : undefined
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              disabled={checkIn.isPending || Boolean(visitRecord?.checkInAt ?? visitRecord?.check_in_at)}
              onClick={async () => {
                try {
                  await checkIn.mutateAsync({});
                  toastSuccess("Visit started.");
                } catch (err) {
                  toastError(err, {
                    fallback: "Failed to start visit.",
                    context: "field-visit-check-in",
                    metadata: { companyId, visitId },
                  });
                }
              }}
            >
              {checkIn.isPending ? "Starting…" : "Check in"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={checkOut.isPending}
              onClick={async () => {
                try {
                  await checkOut.mutateAsync({});
                  toastSuccess("Check-out captured.");
                } catch (err) {
                  toastError(err, {
                    fallback: "Failed to check out.",
                    context: "field-visit-check-out",
                    metadata: { companyId, visitId },
                  });
                }
              }}
            >
              {checkOut.isPending ? "Saving…" : "Check out"}
            </SecondaryButton>
          </div>
        }
      />

      {visit.isLoading ? <LoadingBlock label="Loading visit…" /> : null}
      {visit.isError ? <InlineError message={getErrorMessage(visit.error, "Failed to load visit")} /> : null}

      {visitRecord ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <WorkspacePanel title="Complete or reschedule visit" subtitle="Useful outcomes matter even when the visit was non-productive.">
              <form
                className="grid gap-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    await updateVisit.mutateAsync({
                      status: "completed",
                      primary_outcome: completionOutcome,
                      notes: completionNotes || undefined,
                      next_follow_up_date: nextFollowUpDate || undefined,
                    });
                    toastSuccess("Visit completed.");
                  } catch (err) {
                    toastError(err, {
                      fallback: "Failed to complete visit.",
                      context: "field-visit-complete",
                      metadata: { companyId, visitId, outcome: completionOutcome },
                    });
                  }
                }}
              >
                <SelectField label="Primary outcome" value={completionOutcome} onChange={setCompletionOutcome}>
                  {[
                    "order_booked",
                    "quotation_shared",
                    "collection_followup_done",
                    "payment_received",
                    "promise_received",
                    "outlet_closed",
                    "no_requirement",
                    "stock_issue",
                    "dispute_or_complaint",
                    "reschedule_required",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value.replace(/_/g, " ")}
                    </option>
                  ))}
                </SelectField>
                <DateField label="Next follow-up date" value={nextFollowUpDate} onChange={setNextFollowUpDate} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Notes</label>
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-field)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-soft)]"
                    value={completionNotes}
                    onChange={(event) => setCompletionNotes(event.target.value)}
                    placeholder="What happened at the outlet?"
                  />
                </div>
                <PrimaryButton type="submit" disabled={updateVisit.isPending}>
                  {updateVisit.isPending ? "Saving…" : "Complete visit"}
                </PrimaryButton>
              </form>

              <div className="mt-5 border-t border-[var(--border)] pt-5">
                <div className="mb-3 text-sm font-medium text-[var(--foreground)]">Mark as missed</div>
                <div className="grid gap-3">
                  <TextField label="Reason" value={missedReason} onChange={setMissedReason} placeholder="Outlet closed, owner absent, reschedule…" />
                  <SecondaryButton
                    type="button"
                    disabled={markMissed.isPending}
                    onClick={async () => {
                      try {
                        await markMissed.mutateAsync({ remarks: missedReason || "Missed visit" });
                        toastSuccess("Visit marked as missed.");
                      } catch (err) {
                        toastError(err, {
                          fallback: "Failed to mark visit as missed.",
                          context: "field-visit-mark-missed",
                          metadata: { companyId, visitId },
                        });
                      }
                    }}
                  >
                    {markMissed.isPending ? "Saving…" : "Mark missed"}
                  </SecondaryButton>
                </div>
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Collection promise" subtitle="Capture receivable follow-up from the visit and push it into D9 collection tasking.">
              <form
                className="grid gap-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    await createCollectionUpdate.mutateAsync({
                      invoice_id: collectionInvoiceId || undefined,
                      promised_amount: collectionPromisedAmount || undefined,
                      promised_date: collectionPromisedDate || undefined,
                      remarks: collectionRemarks || undefined,
                      status: collectionPromisedAmount || collectionPromisedDate ? "promise_received" : "collection_followup_done",
                    });
                    setCollectionInvoiceId("");
                    setCollectionPromisedAmount("");
                    setCollectionPromisedDate("");
                    setCollectionRemarks("");
                    toastSuccess("Collection update captured.");
                  } catch (err) {
                    toastError(err, {
                      fallback: "Failed to capture collection update.",
                      context: "field-visit-collection-update",
                      metadata: { companyId, visitId, invoiceId: collectionInvoiceId },
                    });
                  }
                }}
              >
                <SelectField label="Invoice" value={collectionInvoiceId} onChange={setCollectionInvoiceId}>
                  <option value="">Optional invoice</option>
                  {invoiceRows.map((row) => (
                    <option key={String(row.id)} value={String(row.id)}>
                      {String(row.invoiceNumber ?? row.invoice_number ?? row.id)}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Promised amount" value={collectionPromisedAmount} onChange={setCollectionPromisedAmount} type="number" />
                <DateField label="Promised date" value={collectionPromisedDate} onChange={setCollectionPromisedDate} />
                <TextField label="Remarks" value={collectionRemarks} onChange={setCollectionRemarks} placeholder="Commitment, issue, cheque delay…" />
                <PrimaryButton type="submit" disabled={createCollectionUpdate.isPending}>
                  {createCollectionUpdate.isPending ? "Saving…" : "Save collection update"}
                </PrimaryButton>
              </form>
            </WorkspacePanel>
          </div>

          <WorkspacePanel title="Quick commercial capture" subtitle="Create a real sales order or quotation from the visit without switching to the office workflow.">
            <div className="grid gap-4">
              {lines.map((line, index) => (
                <div key={`line-${index}`} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-4">
                  <SelectField
                    label={`Product ${index + 1}`}
                    value={line.product_id}
                    onChange={(value) =>
                      setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, product_id: value } : item)))
                    }
                  >
                    <option value="">Select product</option>
                    {productRows.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    label="Quantity"
                    value={line.quantity}
                    onChange={(value) =>
                      setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: value } : item)))
                    }
                    type="number"
                  />
                  <TextField
                    label="Unit price"
                    value={line.unit_price}
                    onChange={(value) =>
                      setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, unit_price: value } : item)))
                    }
                    type="number"
                  />
                  <TextField
                    label="Discount"
                    value={line.discount}
                    onChange={(value) =>
                      setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, discount: value } : item)))
                    }
                    type="number"
                  />
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <SecondaryButton
                  type="button"
                  onClick={() => setLines((current) => [...current, { product_id: "", quantity: "1", unit_price: "", discount: "" }])}
                >
                  Add line
                </SecondaryButton>
                {lines.length > 1 ? (
                  <SecondaryButton type="button" onClick={() => setLines((current) => current.slice(0, -1))}>
                    Remove last line
                  </SecondaryButton>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <TextField label="Commercial notes" value={documentNotes} onChange={setDocumentNotes} placeholder="Urgency, shelf ask, pack mix…" />
                <DateField label="Quotation expiry" value={quotationExpiryDate} onChange={setQuotationExpiryDate} />
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
                  Estimated value: <span className="font-semibold">{orderTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  type="button"
                  disabled={createOrder.isPending || lines.some((line) => !line.product_id || !line.quantity || !line.unit_price)}
                  onClick={async () => {
                    try {
                      const res = await createOrder.mutateAsync({
                        notes: documentNotes || undefined,
                        lines: lines.map((line) => ({
                          product_id: line.product_id,
                          quantity: line.quantity,
                          unit_price: line.unit_price,
                          discount: line.discount || undefined,
                        })),
                      });
                      const orderId = ((res as unknown as { data?: { id?: string } }).data?.id);
                      toastSuccess("Field sales order created.");
                      if (orderId) window.location.href = `/c/${companyId}/sales/orders/${orderId}`;
                    } catch (err) {
                      toastError(err, {
                        fallback: "Failed to create sales order.",
                        context: "field-visit-create-sales-order",
                        metadata: { companyId, visitId },
                      });
                    }
                  }}
                >
                  {createOrder.isPending ? "Saving…" : "Create sales order"}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  disabled={createQuotation.isPending || lines.some((line) => !line.product_id || !line.quantity || !line.unit_price)}
                  onClick={async () => {
                    try {
                      const res = await createQuotation.mutateAsync({
                        notes: documentNotes || undefined,
                        expiry_date: quotationExpiryDate || undefined,
                        lines: lines.map((line) => ({
                          product_id: line.product_id,
                          quantity: line.quantity,
                          unit_price: line.unit_price,
                          discount: line.discount || undefined,
                        })),
                      });
                      const quotationId = ((res as unknown as { data?: { id?: string } }).data?.id);
                      toastSuccess("Field quotation created.");
                      if (quotationId) window.location.href = `/c/${companyId}/sales/quotations/${quotationId}`;
                    } catch (err) {
                      toastError(err, {
                        fallback: "Failed to create quotation.",
                        context: "field-visit-create-quotation",
                        metadata: { companyId, visitId },
                      });
                    }
                  }}
                >
                  {createQuotation.isPending ? "Saving…" : "Create quotation"}
                </SecondaryButton>
              </div>
            </div>
          </WorkspacePanel>

          <div className="grid gap-6 xl:grid-cols-2">
            <WorkspacePanel title="Linked documents" subtitle="Everything created from this visit stays in the normal sales flow.">
              <div className="space-y-3 text-sm text-[var(--muted-strong)]">
                {visitRecord.salesOrders?.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                    <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/sales/orders/${order.id}`}>
                      {order.orderNumber ?? order.order_number ?? order.id}
                    </Link>
                    <div>{order.status ?? "draft"} · {Number(order.total ?? 0).toFixed(2)}</div>
                  </div>
                ))}
                {visitRecord.quotations?.map((quotation) => (
                  <div key={quotation.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                    <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/sales/quotations/${quotation.id}`}>
                      {quotation.quoteNumber ?? quotation.quote_number ?? quotation.id}
                    </Link>
                    <div>{quotation.status ?? "draft"} · {Number(quotation.total ?? 0).toFixed(2)}</div>
                  </div>
                ))}
                {!visitRecord.salesOrders?.length && !visitRecord.quotations?.length ? (
                  <div className="text-[var(--muted)]">No linked quotation or order yet.</div>
                ) : null}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Outcome history" subtitle="This becomes the traceable field record for manager review and DCR summary.">
              <div className="space-y-3 text-sm text-[var(--muted-strong)]">
                {visitRecord.outcomes?.map((outcome) => (
                  <div key={outcome.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                    <div className="font-medium text-[var(--foreground)]">{outcome.outcomeType ?? outcome.outcome_type}</div>
                    <div>{outcome.remarks ?? "No remarks"}</div>
                  </div>
                ))}
                {!visitRecord.outcomes?.length ? <div className="text-[var(--muted)]">No recorded outcomes yet.</div> : null}
              </div>
            </WorkspacePanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
