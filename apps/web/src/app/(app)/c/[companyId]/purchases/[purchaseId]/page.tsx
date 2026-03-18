"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
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

type Props = { params: Promise<{ companyId: string; purchaseId: string }> };

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
  const paymentsQuery = usePayments({ companyId, limit: 50 });
  const recordPayment = useRecordPayment({ companyId });

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
    return data.filter((p) => (p.purchaseId ?? p.purchase_id) === purchaseId);
  }, [purchaseId, paymentsQuery.data?.data.data]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Purchases"
        title="Purchase"
        subtitle="Review receiving status, bill attachments, and supplier payments from a stronger operational detail layout."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/purchases`}>
            Back
          </Link>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading purchase…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load purchase")} /> : null}

      {query.data ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{query.data.data.status ?? "—"}</Badge>
                  <Badge variant="outline">Purchase {purchaseId.slice(0, 8)}</Badge>
                </div>
                <CardTitle>Purchase detail</CardTitle>
                <CardDescription>Track purchase state, receiving, and attached bill documents.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Purchase date</div>
                  <div className="mt-2 text-sm font-medium">{query.data.data.purchase_date ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Bill</div>
                  <div className="mt-2 text-sm font-medium">
                    <a className="text-[var(--accent)] underline" href={purchaseBillUrl(companyId, purchaseId)} target="_blank" rel="noreferrer">
                      Download attachment
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document actions</CardTitle>
                <CardDescription>Receive stock, cancel the purchase, or upload the supplier bill.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
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

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 space-y-3">
                  <div className="text-sm font-semibold">Bill attachment</div>
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
                      className="text-sm font-medium text-[var(--accent)] underline"
                      href={purchaseBillUrl(companyId, purchaseId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                    <div className="text-xs text-[var(--muted)]">
                      {uploadBill.isPending ? "Uploading…" : "PDF/JPG/PNG supported"}
                    </div>
                  </div>
                  {uploadError ? <InlineError message={uploadError} /> : null}
                </div>
              </CardContent>
            </Card>

            {error ? <InlineError message={error} /> : null}
          </div>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Record supplier payments and review settlement activity for this purchase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

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
                      purchase_id: purchaseId,
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
                      {paymentsForPurchase.map((p) => (
                        <DataTr key={p.id}>
                          <DataTd>{p.paymentDate ?? p.payment_date ?? "—"}</DataTd>
                          <DataTd>{p.method}</DataTd>
                          <DataTd>{p.reference ?? "—"}</DataTd>
                          <DataTd className="text-right">{p.amount}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              ) : null}
              </CardContent>
            </Card>
        </div>
      ) : null}
    </div>
  );
}
