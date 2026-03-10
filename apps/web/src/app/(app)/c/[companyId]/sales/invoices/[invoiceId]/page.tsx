"use client";

import Link from "next/link";
import * as React from "react";

import {
  invoicePdfUrl,
  useCancelInvoice,
  useInvoice,
  useIssueInvoice,
  usePayments,
  useRecordPayment,
  useRegenerateInvoicePdf,
} from "@/lib/billing/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: { companyId: string; invoiceId: string } };

type PaymentLike = {
  id: string;
  method: string;
  amount: string;
  reference?: string | null;
  invoiceId?: string | null;
  invoice_id?: string | null;
  paymentDate?: string;
  payment_date?: string;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function InvoiceDetailPage({ params }: Props) {
  const query = useInvoice({ companyId: params.companyId, invoiceId: params.invoiceId });
  const issue = useIssueInvoice({ companyId: params.companyId, invoiceId: params.invoiceId });
  const cancel = useCancelInvoice({ companyId: params.companyId, invoiceId: params.invoiceId });
  const regen = useRegenerateInvoicePdf({ companyId: params.companyId, invoiceId: params.invoiceId });
  const paymentsQuery = usePayments({ companyId: params.companyId, limit: 50 });
  const recordPayment = useRecordPayment({ companyId: params.companyId });

  const [seriesCode, setSeriesCode] = React.useState("DEFAULT");
  const [error, setError] = React.useState<string | null>(null);

  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("cash");
  const [payReference, setPayReference] = React.useState("");
  const [payDate, setPayDate] = React.useState("");

  const paymentsForInvoice = React.useMemo(() => {
    const data = (paymentsQuery.data?.data.data ?? []) as PaymentLike[];
    return data.filter((p) => (p.invoiceId ?? p.invoice_id) === params.invoiceId);
  }, [params.invoiceId, paymentsQuery.data?.data.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice"
        subtitle={<code>{params.invoiceId}</code>}
        actions={
          <Link className="text-sm underline" href={`/c/${params.companyId}/sales/invoices`}>
            Back
          </Link>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading invoice…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load invoice")} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-4 space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">Status</div>
              <div className="font-medium">{query.data.data.status ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Issue date</div>
              <div className="font-medium">{query.data.data.issue_date ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Due date</div>
              <div className="font-medium">{query.data.data.due_date ?? "—"}</div>
            </div>
          </div>

          {error ? <InlineError message={error} /> : null}

          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-56">
              <TextField label="Series code" value={seriesCode} onChange={setSeriesCode} />
            </div>
            <PrimaryButton
              type="button"
              disabled={issue.isPending}
              onClick={async () => {
                setError(null);
                try {
                  await issue.mutateAsync({ series_code: seriesCode });
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to issue invoice"));
                }
              }}
            >
              {issue.isPending ? "Issuing…" : "Issue"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={cancel.isPending}
              onClick={async () => {
                setError(null);
                const ok = window.confirm("Cancel this invoice?");
                if (!ok) return;
                try {
                  await cancel.mutateAsync();
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to cancel invoice"));
                }
              }}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel"}
            </SecondaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                const url = invoicePdfUrl(params.companyId, params.invoiceId);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              Open PDF
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={regen.isPending}
              onClick={async () => {
                setError(null);
                try {
                  await regen.mutateAsync();
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to enqueue PDF regeneration"));
                }
              }}
            >
              {regen.isPending ? "Enqueueing…" : "Regenerate PDF"}
            </SecondaryButton>
          </div>
        </div>

          <div className="rounded-xl border bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-semibold">Payments</div>
                <div className="text-sm text-neutral-500">Record and view payments for this invoice.</div>
              </div>
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
                    invoice_id: params.invoiceId,
                    amount: payAmount,
                    method: payMethod,
                    reference: payReference || undefined,
                    payment_date: payDate || undefined,
                  });
                  setPayAmount("");
                  setPayReference("");
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to record payment"));
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
          {paymentsForInvoice.map((p) => (
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