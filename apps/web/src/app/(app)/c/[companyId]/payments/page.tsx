"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoices, usePayments, usePurchases, useRecordPayment } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PaymentsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [targetType, setTargetType] = React.useState<"invoice" | "purchase">("invoice");
  const [targetId, setTargetId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [reference, setReference] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const paymentsQuery = usePayments({ companyId, page: 1, limit: 50, from: from || undefined, to: to || undefined, method: method || undefined });
  const invoicesQuery = useInvoices({ companyId, page: 1, limit: 50, status: "issued" });
  const purchasesQuery = usePurchases({ companyId, page: 1, limit: 50 });
  const recordPayment = useRecordPayment({ companyId });

  type PaymentRow = Record<string, unknown>;
  const paymentsPayload = paymentsQuery.data?.data as { data?: PaymentRow[] } | undefined;
  const paymentRows: PaymentRow[] = paymentsPayload?.data ?? [];
  const invoiceRows = ((invoicesQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.invoiceNumber ?? row.invoice_no ?? row.id),
  }));
  const purchaseRows = ((purchasesQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.billNumber ?? row.purchaseNumber ?? row.id),
  }));
  const targetOptions = targetType === "invoice" ? invoiceRows : purchaseRows;

  const paymentTotals = paymentRows.reduce<{ amount: number; count: number }>(
    (acc, row) => {
      acc.amount += Number(row.amount ?? 0);
      acc.count += 1;
      return acc;
    },
    { amount: 0, count: 0 },
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operations"
        title="Payments"
        subtitle="Use a dedicated payment workspace to record settlements and review invoice and purchase payment activity."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{paymentTotals.count} payment{paymentTotals.count === 1 ? "" : "s"} in view</Badge>
              <Badge variant="outline">₹{paymentTotals.amount.toFixed(2)} total</Badge>
            </div>
            <CardTitle>Record payment</CardTitle>
            <CardDescription>Attach a payment to an issued invoice or an existing purchase from one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Target type</label>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                  value={targetType}
                  onChange={(e) => {
                    const next = e.target.value === "purchase" ? "purchase" : "invoice";
                    setTargetType(next);
                    setTargetId("");
                  }}
                >
                  <option value="invoice">Invoice</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">{targetType === "invoice" ? "Invoice" : "Purchase"}</label>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {targetOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField label="Amount" value={amount} onChange={setAmount} type="number" />
              <div>
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Method</label>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <TextField label="Reference" value={reference} onChange={setReference} placeholder="Optional" />
              <TextField label="Payment date (YYYY-MM-DD)" value={paymentDate} onChange={setPaymentDate} placeholder="Optional" />
            </div>

            {error ? <InlineError message={error} /> : null}

            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                type="button"
                disabled={recordPayment.isPending}
                onClick={async () => {
                  setError(null);
                  if (!targetId) return setError(`Select a ${targetType}.`);
                  if (!amount || Number(amount) <= 0) return setError("Enter a valid amount.");
                  try {
                    await recordPayment.mutateAsync({
                      invoice_id: targetType === "invoice" ? targetId : undefined,
                      purchase_id: targetType === "purchase" ? targetId : undefined,
                      amount,
                      method: paymentMethod,
                      reference: reference || undefined,
                      payment_date: paymentDate || undefined,
                    });
                    setAmount("");
                    setReference("");
                  } catch (err: unknown) {
                    setError(getErrorMessage(err, "Failed to record payment"));
                  }
                }}
              >
                {recordPayment.isPending ? "Recording…" : "Record payment"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setPaymentDate(new Date().toISOString().slice(0, 10))}>
                Use today
              </SecondaryButton>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Review the current payment ledger using date and method filters.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
            <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
            <div>
              <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Method</label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="">All methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <Link href={`/c/${companyId}/sales/invoices`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Open invoices
              </Link>
              <Link href={`/c/${companyId}/purchases`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Open purchases
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {paymentsQuery.isLoading ? <LoadingBlock label="Loading payments…" /> : null}
      {paymentsQuery.isError ? <InlineError message={getErrorMessage(paymentsQuery.error, "Failed to load payments")} /> : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && paymentRows.length === 0 ? (
        <EmptyState title="No payments yet" hint="Record a payment above or adjust the current filters." />
      ) : null}

      {paymentRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment activity</CardTitle>
            <CardDescription>Recent payment records across both sales and purchases.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Date</DataTh>
                    <DataTh>Target</DataTh>
                    <DataTh>Method</DataTh>
                    <DataTh>Reference</DataTh>
                    <DataTh className="text-right">Amount</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {paymentRows.map((row) => {
                    const invoiceId = String(row.invoiceId ?? row.invoice_id ?? "");
                    const purchaseId = String(row.purchaseId ?? row.purchase_id ?? "");
                    const href = invoiceId
                      ? `/c/${companyId}/sales/invoices/${invoiceId}`
                      : purchaseId
                        ? `/c/${companyId}/purchases/${purchaseId}`
                        : undefined;
                    return (
                      <DataTr key={String(row.id)}>
                        <DataTd>{String(row.paymentDate ?? row.payment_date ?? "—")}</DataTd>
                        <DataTd>
                          {href ? (
                            <Link href={href} className="font-medium text-[var(--accent)] hover:underline">
                              {invoiceId ? `Invoice ${invoiceId.slice(0, 8)}` : `Purchase ${purchaseId.slice(0, 8)}`}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </DataTd>
                        <DataTd>{String(row.method ?? "—")}</DataTd>
                        <DataTd>{String(row.reference ?? "—")}</DataTd>
                        <DataTd className="text-right">{Number(row.amount ?? 0).toFixed(2)}</DataTd>
                      </DataTr>
                    );
                  })}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
