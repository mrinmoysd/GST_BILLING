"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import {
  invoicePdfUrl,
  useCancelInvoice,
  useInvoice,
  useIssueInvoice,
  useJob,
  usePayments,
  useRecordPayment,
  useRegenerateInvoicePdf,
} from "@/lib/billing/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string; invoiceId: string }> };

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
  const { companyId, invoiceId } = React.use(params);
  const query = useInvoice({ companyId, invoiceId });
  const issue = useIssueInvoice({ companyId, invoiceId });
  const cancel = useCancelInvoice({ companyId, invoiceId });
  const regen = useRegenerateInvoicePdf({ companyId, invoiceId });
  const [pdfJobId, setPdfJobId] = React.useState<string>("");
  const pdfJobQuery = useJob({ companyId, jobId: pdfJobId, enabled: Boolean(pdfJobId) });
  const paymentsQuery = usePayments({ companyId, limit: 50 });
  const recordPayment = useRecordPayment({ companyId });

  const [seriesCode, setSeriesCode] = React.useState("DEFAULT");
  const [error, setError] = React.useState<string | null>(null);

  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("cash");
  const [payReference, setPayReference] = React.useState("");
  const [payDate, setPayDate] = React.useState("");

  const paymentsForInvoice = React.useMemo(() => {
    const data = (paymentsQuery.data?.data.data ?? []) as PaymentLike[];
    return data.filter((p) => (p.invoiceId ?? p.invoice_id) === invoiceId);
  }, [invoiceId, paymentsQuery.data?.data.data]);

  const invoiceTaxBreakdown = React.useMemo(() => {
    const items = (query.data?.data.items ?? []) as Array<{
      quantity?: string | number | null;
      unitPrice?: string | number | null;
      unit_price?: string | number | null;
      taxRate?: string | number | null;
      tax_rate?: string | number | null;
      lineTotal?: string | number | null;
      line_total?: string | number | null;
    }>;
    const bucket = new Map<number, { taxable: number; tax: number }>();
    for (const item of items) {
      const lineTotal = Number(item.lineTotal ?? item.line_total ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
      const taxable = lineTotal || quantity * unitPrice;
      const rate = Number(item.taxRate ?? item.tax_rate ?? 0);
      if (!bucket.has(rate)) bucket.set(rate, { taxable: 0, tax: 0 });
      const current = bucket.get(rate)!;
      current.taxable += taxable;
      current.tax += (taxable * rate) / 100;
    }
    return Array.from(bucket.entries())
      .map(([rate, values]) => ({ rate, taxable: values.taxable, tax: values.tax }))
      .filter((row) => row.taxable > 0);
  }, [query.data?.data.items]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Invoice"
        subtitle="Review invoice state, document actions, and payment activity from a stronger operational detail layout."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/sales/invoices`}>
            Back
          </Link>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading invoice…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load invoice")} /> : null}

      {query.data ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{query.data.data.status ?? "—"}</Badge>
                  <Badge variant="outline">Invoice {invoiceId.slice(0, 8)}</Badge>
                </div>
                <CardTitle>{query.data.data.invoice_no ?? "Draft invoice"}</CardTitle>
                <CardDescription>Use this panel to issue, cancel, regenerate documents, and review invoice timing.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Issue date</div>
                  <div className="mt-2 text-sm font-medium">{query.data.data.issue_date ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Due date</div>
                  <div className="mt-2 text-sm font-medium">{query.data.data.due_date ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Series code</div>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px] flex-1">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document actions</CardTitle>
                <CardDescription>PDF and lifecycle actions for the current invoice.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
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
                    const url = invoicePdfUrl(companyId, invoiceId);
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
                      const res = await regen.mutateAsync();
                      const job = res.data as { data?: { jobId?: string } } | undefined;
                      const jobId = job?.data?.jobId;
                      if (jobId) setPdfJobId(String(jobId));
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to enqueue PDF regeneration"));
                    }
                  }}
                >
                  {regen.isPending ? "Enqueueing…" : "Regenerate PDF"}
                </SecondaryButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PDF generation status</CardTitle>
                <CardDescription>Track the current regeneration job before opening the latest PDF.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {pdfJobId ? (
                  <>
                    <div>
                      Job: <code>{pdfJobId}</code>
                    </div>
                    {pdfJobQuery.isLoading ? <LoadingBlock label="Checking PDF job…" /> : null}
                    {pdfJobQuery.isError ? <InlineError message={getErrorMessage(pdfJobQuery.error, "Failed to fetch PDF job status")} /> : null}
                    {pdfJobQuery.data ? (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                        <div className="font-medium text-[var(--foreground)]">Status: {pdfJobQuery.data.data.data.state}</div>
                        {pdfJobQuery.data.data.data.failed_reason ? (
                          <div className="mt-2 text-[var(--danger)]">{pdfJobQuery.data.data.data.failed_reason}</div>
                        ) : null}
                        {pdfJobQuery.data.data.data.state === "succeeded" ? (
                          <div className="mt-2 text-[var(--muted)]">The latest PDF should now be available via the open-PDF action.</div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[var(--muted)]">
                    No PDF regeneration job is currently being tracked.
                  </div>
                )}
              </CardContent>
            </Card>

            {error ? <InlineError message={error} /> : null}
          </div>

          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax summary</CardTitle>
              <CardDescription>Current GST estimate based on the invoice line items returned by the API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoiceTaxBreakdown.length > 0 ? (
                invoiceTaxBreakdown.map((row) => (
                  <div key={row.rate} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-[var(--foreground)]">{row.rate}% GST</div>
                      <div className="text-[var(--muted)]">Taxable value {row.taxable.toFixed(2)}</div>
                    </div>
                    <div className="font-semibold text-[var(--foreground)]">{row.tax.toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                  Tax details will appear here once line-level GST data is available on the invoice payload.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Record payments and review settlement activity for this invoice.</CardDescription>
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
                    invoice_id: invoiceId,
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
                    {paymentsForInvoice.map((p) => (
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
        </div>
      ) : null}
    </div>
  );
}
