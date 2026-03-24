"use client";

import Link from "next/link";
import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import {
  purchaseBillUrl,
  useCancelPurchase,
  useCreatePurchaseReturn,
  usePayments,
  usePurchase,
  useReceivePurchase,
  useRecordPayment,
  useUploadPurchaseBill,
} from "@/lib/billing/hooks";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { DateField, PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { WorkspaceDetailHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string; purchaseId: string }> };

type PurchaseItemLike = {
  id: string;
  productId?: string;
  product_id?: string;
  product?: { name?: string | null };
  quantity?: string | number | null;
  unitCost?: string | number | null;
  unit_cost?: string | number | null;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PurchaseDetailPage({ params }: Props) {
  const { companyId, purchaseId } = React.use(params);
  const query = usePurchase({ companyId, purchaseId });
  const receive = useReceivePurchase({ companyId, purchaseId });
  const cancel = useCancelPurchase({ companyId, purchaseId });
  const uploadBill = useUploadPurchaseBill({ companyId, purchaseId });
  const createReturn = useCreatePurchaseReturn({ companyId, purchaseId });
  const paymentsQuery = usePayments({ companyId, limit: 50 });
  const recordPayment = useRecordPayment({ companyId });

  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("cash");
  const [payReference, setPayReference] = React.useState("");
  const [payDate, setPayDate] = React.useState("");

  const [returnDate, setReturnDate] = React.useState("");
  const [returnNotes, setReturnNotes] = React.useState("");
  const [returnQuantities, setReturnQuantities] = React.useState<Record<string, string>>({});

  const purchase = query.data?.data;
  const items = React.useMemo(() => (purchase?.items ?? []) as PurchaseItemLike[], [purchase?.items]);
  const purchaseReturns = React.useMemo(() => purchase?.purchaseReturns ?? [], [purchase?.purchaseReturns]);
  const lifecycleEvents = React.useMemo(() => purchase?.lifecycleEvents ?? [], [purchase?.lifecycleEvents]);

  const returnedByItem = React.useMemo(() => {
    const bucket = new Map<string, number>();
    for (const purchaseReturn of purchaseReturns as Array<{ items?: Array<{ purchaseItemId?: string | null; purchase_item_id?: string | null; quantity?: string | number | null }> }>) {
      for (const item of purchaseReturn.items ?? []) {
        const key = String(item.purchaseItemId ?? item.purchase_item_id ?? "");
        if (!key) continue;
        bucket.set(key, (bucket.get(key) ?? 0) + Number(item.quantity ?? 0));
      }
    }
    return bucket;
  }, [purchaseReturns]);

  const paymentsForPurchase = React.useMemo(() => {
    const data = (paymentsQuery.data?.data.data ?? []) as Array<{
      id: string;
      method: string;
      amount: string;
      reference?: string | null;
      purchaseId?: string | null;
      purchase_id?: string | null;
      paymentDate?: string;
      payment_date?: string;
    }>;
    return data.filter((payment) => (payment.purchaseId ?? payment.purchase_id) === purchaseId);
  }, [purchaseId, paymentsQuery.data?.data.data]);

  const totalReturned = React.useMemo(
    () => purchaseReturns.reduce((sum, entry) => sum + Number((entry as { total?: string | number | null }).total ?? 0), 0),
    [purchaseReturns],
  );

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Purchase detail"
        title={`Purchase ${purchaseId.slice(0, 8)}`}
        subtitle="Handle receiving, supplier bill attachment, purchase returns, payments, and lifecycle history from one operational surface."
        badges={[
          <WorkspaceStatBadge key="status" label="Status" value={purchase?.status ?? "—"} />,
          <WorkspaceStatBadge key="returned" label="Returned" value={totalReturned.toFixed(2)} variant="outline" />,
        ]}
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/purchases`}>
            Back
          </Link>
        }
        metrics={
          purchase
            ? [
                { label: "Purchase date", value: purchase.purchase_date ?? "—" },
                { label: "Supplier bill", value: "Available" },
                { label: "Purchase total", value: Number(purchase.total ?? 0).toFixed(2) },
                { label: "Net after returns", value: (Number(purchase.total ?? 0) - totalReturned).toFixed(2) },
              ]
            : []
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading purchase…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load purchase")} /> : null}

      {purchase ? (
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <WorkspacePanel title="Purchase actions" subtitle="Track receive state, bill attachment, purchase returns, and supplier payments.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Purchase date</div>
                  <div className="mt-2 text-sm font-medium">{purchase.purchase_date ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Supplier bill</div>
                  <div className="mt-2 text-sm font-medium">
                    <a className="text-[var(--accent)] underline" href={purchaseBillUrl(companyId, purchaseId)} target="_blank" rel="noreferrer">
                      Download attachment
                    </a>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Purchase total</div>
                  <div className="mt-2 text-sm font-medium">{Number(purchase.total ?? 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Net after returns</div>
                  <div className="mt-2 text-sm font-medium">{(Number(purchase.total ?? 0) - totalReturned).toFixed(2)}</div>
                </div>
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Document actions" subtitle="Receive stock, cancel the purchase, or upload the supplier bill." tone="muted">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <PrimaryButton
                    type="button"
                    disabled={receive.isPending}
                    onClick={async () => {
                      setError(null);
                      setOk(null);
                      try {
                        await receive.mutateAsync();
                        setOk("Purchase received.");
                      } catch (e: unknown) {
                        setError(getErrorMessage(e, "Failed to receive purchase"));
                      }
                    }}
                  >
                    {receive.isPending ? "Receiving…" : "Receive"}
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    disabled={cancel.isPending}
                    onClick={async () => {
                      setError(null);
                      setOk(null);
                      if (!window.confirm("Cancel this purchase?")) return;
                      try {
                        await cancel.mutateAsync();
                        setOk("Purchase cancelled.");
                      } catch (e: unknown) {
                        setError(getErrorMessage(e, "Failed to cancel purchase"));
                      }
                    }}
                  >
                    {cancel.isPending ? "Cancelling…" : "Cancel"}
                  </SecondaryButton>
                </div>

                <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="text-sm font-semibold">Bill attachment</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      accept="image/*,application/pdf"
                      type="file"
                      onChange={async (event) => {
                        setUploadError(null);
                        const file = event.target.files?.[0];
                        if (!file) return;
                        try {
                          await uploadBill.mutateAsync(file);
                          event.target.value = "";
                          setOk("Bill uploaded.");
                        } catch (err: unknown) {
                          setUploadError(getErrorMessage(err, "Failed to upload bill"));
                        }
                      }}
                    />
                    <a className="text-sm font-medium text-[var(--accent)] underline" href={purchaseBillUrl(companyId, purchaseId)} target="_blank" rel="noreferrer">
                      Download
                    </a>
                    <div className="text-xs text-[var(--muted)]">{uploadBill.isPending ? "Uploading…" : "PDF/JPG/PNG supported"}</div>
                  </div>
                  {uploadError ? <InlineError message={uploadError} /> : null}
                </div>
              </div>
            </WorkspacePanel>

            {error ? <InlineError message={error} /> : null}
            {ok ? <div className="text-sm text-green-700">{ok}</div> : null}
          </div>

          <div className="space-y-6">
            <WorkspacePanel title="Purchase returns" subtitle="Create post-receipt returns and push the stock reversal through the workflow.">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DateField label="Return date" value={returnDate} onChange={setReturnDate} />
                  <TextField label="Notes" value={returnNotes} onChange={setReturnNotes} placeholder="Optional" />
                </div>

                <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  {items.map((item) => {
                    const qty = Number(item.quantity ?? 0);
                    const returned = returnedByItem.get(item.id) ?? 0;
                    const available = Math.max(0, qty - returned);
                    const productName = item.product?.name ?? item.productId ?? item.product_id ?? item.id;
                    return (
                      <div key={item.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr]">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{productName}</div>
                          <div className="mt-1 text-xs text-[var(--muted)]">Received {qty} • Already returned {returned}</div>
                        </div>
                        <div className="text-sm text-[var(--muted-strong)]">Available {available}</div>
                        <div className="text-sm text-[var(--muted-strong)]">Unit {Number(item.unitCost ?? item.unit_cost ?? 0).toFixed(2)}</div>
                        <input
                          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                          min="0"
                          step="0.01"
                          value={returnQuantities[item.id] ?? ""}
                          onChange={(e) => setReturnQuantities((current) => ({ ...current, [item.id]: e.target.value }))}
                          placeholder="Qty to return"
                          type="number"
                        />
                      </div>
                    );
                  })}
                </div>

                <PrimaryButton
                  type="button"
                  disabled={createReturn.isPending}
                  onClick={async () => {
                    setError(null);
                    setOk(null);
                    const payloadItems = items
                      .map((item) => ({
                        purchase_item_id: item.id,
                        product_id: String(item.productId ?? item.product_id ?? ""),
                        quantity: returnQuantities[item.id]?.trim() ?? "",
                      }))
                      .filter((item) => item.quantity && Number(item.quantity) > 0);
                    if (payloadItems.length === 0) return setError("Add at least one return quantity.");
                    try {
                      await createReturn.mutateAsync({
                        return_date: returnDate || undefined,
                        notes: returnNotes || undefined,
                        items: payloadItems,
                      });
                      setReturnDate("");
                      setReturnNotes("");
                      setReturnQuantities({});
                      setOk("Purchase return created.");
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to create purchase return"));
                    }
                  }}
                >
                  {createReturn.isPending ? "Saving…" : "Create purchase return"}
                </PrimaryButton>

                <div className="space-y-3">
                  {purchaseReturns.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                      No purchase returns have been created yet.
                    </div>
                  ) : (
                    purchaseReturns.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                        <div className="font-medium text-[var(--foreground)]">{entry.returnNumber ?? entry.return_number ?? entry.id}</div>
                        <div className="mt-1 text-[var(--muted)]">{entry.returnDate ?? entry.return_date ?? "—"} • Total {Number(entry.total ?? 0).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </WorkspacePanel>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Record supplier payments and review settlement activity for this purchase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form
                  className="grid items-end gap-4 md:grid-cols-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setError(null);
                    setOk(null);
                    if (!payAmount || Number(payAmount) <= 0) return setError("Enter a valid amount.");
                    try {
                      await recordPayment.mutateAsync({
                        purchase_id: purchaseId,
                        amount: payAmount,
                        method: payMethod,
                        reference: payReference || undefined,
                        payment_date: payDate || undefined,
                      });
                      setPayAmount("");
                      setPayReference("");
                      setOk("Payment recorded.");
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to record payment"));
                    }
                  }}
                >
                  <TextField label="Amount" value={payAmount} onChange={setPayAmount} type="number" />
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Method</label>
                    <select
                      className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank">Bank</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <TextField label="Reference" value={payReference} onChange={setPayReference} placeholder="Optional" />
                  <div className="flex gap-3">
                    <PrimaryButton type="submit" disabled={recordPayment.isPending}>
                      {recordPayment.isPending ? "Recording…" : "Record"}
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={() => setPayDate(new Date().toISOString().slice(0, 10))}>
                      Today
                    </SecondaryButton>
                  </div>
                  <div className="md:col-span-2">
                    <DateField label="Payment date" value={payDate} onChange={setPayDate} />
                  </div>
                </form>

                {paymentsQuery.isLoading ? <LoadingBlock label="Loading payments…" /> : null}
                {paymentsQuery.isError ? <InlineError message={getErrorMessage(paymentsQuery.error, "Failed to load payments")} /> : null}

                {paymentsQuery.data ? (
                  <DataTableShell>
                    <DataTable>
                      <DataThead>
                        <tr>
                          <DataTh>Date</DataTh>
                          <DataTh>Method</DataTh>
                          <DataTh>Reference</DataTh>
                          <DataTh className="text-right">Amount</DataTh>
                        </tr>
                      </DataThead>
                      <tbody>
                        {paymentsForPurchase.map((payment) => (
                          <DataTr key={payment.id}>
                            <DataTd>{payment.paymentDate ?? payment.payment_date ?? "—"}</DataTd>
                            <DataTd>{payment.method}</DataTd>
                            <DataTd>{payment.reference ?? "—"}</DataTd>
                            <DataTd className="text-right">{payment.amount}</DataTd>
                          </DataTr>
                        ))}
                      </tbody>
                    </DataTable>
                  </DataTableShell>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lifecycle history</CardTitle>
                <CardDescription>Track receive, return, payment, bill attachment, and cancellation events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lifecycleEvents.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                    No lifecycle history has been recorded yet.
                  </div>
                ) : (
                  lifecycleEvents.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                      <div className="font-medium text-[var(--foreground)]">{event.summary}</div>
                      <div className="mt-1 text-[var(--muted)]">{event.eventType ?? event.event_type ?? "event"} • {event.createdAt ?? event.created_at ?? "—"}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
