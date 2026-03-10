"use client";

import Link from "next/link";
import * as React from "react";

import {
  purchaseBillUrl,
  useCancelPurchase,
  usePayments,
  usePurchase,
  useReceivePurchase,
  useRecordPayment,
  useUploadPurchaseBill,
} from "@/lib/billing/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: { companyId: string; purchaseId: string } };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PurchaseDetailPage({ params }: Props) {
  const query = usePurchase({ companyId: params.companyId, purchaseId: params.purchaseId });
  const receive = useReceivePurchase({ companyId: params.companyId, purchaseId: params.purchaseId });
  const cancel = useCancelPurchase({ companyId: params.companyId, purchaseId: params.purchaseId });
  const uploadBill = useUploadPurchaseBill({ companyId: params.companyId, purchaseId: params.purchaseId });
  const paymentsQuery = usePayments({ companyId: params.companyId, limit: 50 });
  const recordPayment = useRecordPayment({ companyId: params.companyId });

  const [error, setError] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("cash");
  const [payReference, setPayReference] = React.useState("");
  const [payDate, setPayDate] = React.useState("");

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
    return data.filter((p) => (p.purchaseId ?? p.purchase_id) === params.purchaseId);
  }, [params.purchaseId, paymentsQuery.data?.data.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase"
        subtitle={<code>{params.purchaseId}</code>}
        actions={
          <Link className="text-sm underline" href={`/c/${params.companyId}/purchases`}>
            Back
          </Link>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading purchase…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load purchase")} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-4 space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">Status</div>
              <div className="font-medium">{query.data.data.status ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Purchase date</div>
              <div className="font-medium">{query.data.data.purchase_date ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Bill</div>
              <a className="underline" href={purchaseBillUrl(params.companyId, params.purchaseId)} target="_blank" rel="noreferrer">
                Download
              </a>
            </div>
          </div>

          {error ? <InlineError message={error} /> : null}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              type="button"
              disabled={receive.isPending}
              onClick={async () => {
                setError(null);
                try {
                  await receive.mutateAsync();
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
                const ok = window.confirm("Cancel this purchase?");
                if (!ok) return;
                try {
                  await cancel.mutateAsync();
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to cancel purchase"));
                }
              }}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel"}
            </SecondaryButton>
          </div>

          <div className="rounded-lg border bg-neutral-50 p-3 space-y-2">
            <div className="text-sm font-medium">Bill attachment</div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={async (e) => {
                  setUploadError(null);
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await uploadBill.mutateAsync(file);
                    e.target.value = "";
                  } catch (err: unknown) {
                    setUploadError(getErrorMessage(err, "Failed to upload bill"));
                  }
                }}
              />
              <a
                className="underline text-sm"
                href={purchaseBillUrl(params.companyId, params.purchaseId)}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
              <div className="text-xs text-neutral-500">
                {uploadBill.isPending ? "Uploading…" : "PDF/JPG/PNG supported"}
              </div>
            </div>
            {uploadError ? <InlineError message={uploadError} /> : null}
          </div>
        </div>

            <div className="rounded-xl border bg-white p-4 space-y-4">
              <div>
                <div className="text-base font-semibold">Payments</div>
                <div className="text-sm text-neutral-500">Record supplier payments for this purchase.</div>
              </div>

              <form
                className="grid gap-4 md:grid-cols-4 items-end"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  if (!payAmount || Number(payAmount) <= 0) {
                    setError("Enter a valid amount.");
                    return;
                  }
                  try {
                    await recordPayment.mutateAsync({
                      purchase_id: params.purchaseId,
                      amount: payAmount,
                      method: payMethod,
                      reference: payReference || undefined,
                      payment_date: payDate || undefined,
                    });
                    setPayAmount("");
                    setPayReference("");
                  } catch (e: unknown) {
                    const message =
                      e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string"
                        ? ((e as { message?: unknown }).message as string)
                        : "Failed to record payment";
                    setError(message);
                  }
                }}
              >
                <TextField label="Amount" value={payAmount} onChange={setPayAmount} type="number" />
                <div>
                  <label className="block text-sm font-medium">Method</label>
                  <select
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
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
                  <TextField
                    label="Payment date (YYYY-MM-DD)"
                    value={payDate}
                    onChange={setPayDate}
                    placeholder="Optional"
                  />
                </div>
              </form>

              {paymentsQuery.isLoading ? <LoadingBlock label="Loading payments…" /> : null}
              {paymentsQuery.isError ? (
                <InlineError message={getErrorMessage(paymentsQuery.error, "Failed to load payments")} />
              ) : null}

              {paymentsQuery.data ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Date</th>
                        <th className="text-left px-3 py-2 font-medium">Method</th>
                        <th className="text-left px-3 py-2 font-medium">Reference</th>
                        <th className="text-right px-3 py-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsForPurchase.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-3 py-2">{p.paymentDate ?? p.payment_date ?? "—"}</td>
                          <td className="px-3 py-2">{p.method}</td>
                          <td className="px-3 py-2">{p.reference ?? "—"}</td>
                          <td className="px-3 py-2 text-right">{p.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
      ) : null}
    </div>
  );
}
