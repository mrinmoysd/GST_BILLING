"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { InvoiceCompliancePanel } from "@/components/invoices/invoice-compliance-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import {
  invoicePdfUrl,
  useCancelInvoice,
  useCreateCreditNote,
  useInvoice,
  useIssueInvoice,
  useJob,
  usePayments,
  useRecordPayment,
  useRegenerateInvoicePdf,
  useShareInvoice,
} from "@/lib/billing/hooks";
import { DetailInfoList, DetailRail, DetailTabPanel, DetailTabs } from "@/lib/ui/detail";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { WorkspaceDetailHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

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

type InvoiceItemLike = {
  id: string;
  productId?: string;
  product_id?: string;
  product?: { name?: string | null };
  quantity?: string | number | null;
  unitPrice?: string | number | null;
  unit_price?: string | number | null;
  taxRate?: string | number | null;
  tax_rate?: string | number | null;
  lineSubTotal?: string | number | null;
  line_sub_total?: string | number | null;
  lineTaxTotal?: string | number | null;
  line_tax_total?: string | number | null;
  lineTotal?: string | number | null;
  line_total?: string | number | null;
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
  const credit = useCreateCreditNote({ companyId, invoiceId });
  const share = useShareInvoice({ companyId, invoiceId });
  const regen = useRegenerateInvoicePdf({ companyId, invoiceId });
  const paymentsQuery = usePayments({ companyId, limit: 50 });
  const recordPayment = useRecordPayment({ companyId });

  const [pdfJobId, setPdfJobId] = React.useState<string>("");
  const pdfJobQuery = useJob({ companyId, jobId: pdfJobId, enabled: Boolean(pdfJobId) });

  const [seriesCode, setSeriesCode] = React.useState("DEFAULT");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("cash");
  const [payReference, setPayReference] = React.useState("");
  const [payDate, setPayDate] = React.useState("");

  const [creditKind, setCreditKind] = React.useState<"credit_note" | "sales_return">("credit_note");
  const [creditDate, setCreditDate] = React.useState("");
  const [creditNotesText, setCreditNotesText] = React.useState("");
  const [creditRestock, setCreditRestock] = React.useState(false);
  const [creditQuantities, setCreditQuantities] = React.useState<Record<string, string>>({});

  const [shareChannel, setShareChannel] = React.useState<"email" | "whatsapp" | "sms">("email");
  const [shareRecipient, setShareRecipient] = React.useState("");
  const [shareMessage, setShareMessage] = React.useState("");

  const invoice = query.data?.data;
  const items = React.useMemo(() => (invoice?.items ?? []) as InvoiceItemLike[], [invoice?.items]);
  const creditNotes = React.useMemo(() => invoice?.creditNotes ?? [], [invoice?.creditNotes]);
  const shares = React.useMemo(() => invoice?.shares ?? [], [invoice?.shares]);
  const lifecycleEvents = React.useMemo(() => invoice?.lifecycleEvents ?? [], [invoice?.lifecycleEvents]);

  const creditedByItem = React.useMemo(() => {
    const bucket = new Map<string, number>();
    for (const note of creditNotes as Array<{ items?: Array<{ invoiceItemId?: string | null; invoice_item_id?: string | null; quantity?: string | number | null }> }>) {
      for (const item of note.items ?? []) {
        const key = String(item.invoiceItemId ?? item.invoice_item_id ?? "");
        if (!key) continue;
        bucket.set(key, (bucket.get(key) ?? 0) + Number(item.quantity ?? 0));
      }
    }
    return bucket;
  }, [creditNotes]);

  const paymentsForInvoice = React.useMemo(() => {
    const data = (paymentsQuery.data?.data.data ?? paymentsQuery.data?.data ?? []) as PaymentLike[];
    return data.filter((payment) => (payment.invoiceId ?? payment.invoice_id) === invoiceId);
  }, [invoiceId, paymentsQuery.data?.data]);

  const invoiceTaxBreakdown = React.useMemo(() => {
    const bucket = new Map<number, { taxable: number; tax: number }>();
    for (const item of items) {
      const taxable = Number(item.lineSubTotal ?? item.line_sub_total ?? 0);
      const tax = Number(item.lineTaxTotal ?? item.line_tax_total ?? 0);
      const rate = Number(item.taxRate ?? item.tax_rate ?? 0);
      if (!bucket.has(rate)) bucket.set(rate, { taxable: 0, tax: 0 });
      const current = bucket.get(rate)!;
      current.taxable += taxable;
      current.tax += tax;
    }
    return Array.from(bucket.entries()).map(([rate, values]) => ({ rate, ...values })).filter((row) => row.taxable > 0);
  }, [items]);

  const totalCredited = React.useMemo(
    () => creditNotes.reduce((sum, note) => sum + Number((note as { total?: string | number | null }).total ?? 0), 0),
    [creditNotes],
  );
  const invoiceDetailRail = invoice ? (
    <>
      <DetailRail
        eyebrow="Quick actions"
        title="Document workspace"
        subtitle="Keep the core PDF, receipt, and cancellation actions nearby while moving between tabs."
      >
        <div className="flex flex-col gap-2">
          <Link href={`/c/${companyId}/sales/invoices`}>
            <SecondaryButton type="button" className="w-full justify-start">Back to invoices</SecondaryButton>
          </Link>
          <Link href={`/c/${companyId}/pos/receipt/${invoiceId}`}>
            <SecondaryButton type="button" className="w-full justify-start">Receipt view</SecondaryButton>
          </Link>
          <SecondaryButton type="button" className="w-full justify-start" onClick={() => window.open(invoicePdfUrl(companyId, invoiceId), "_blank", "noopener,noreferrer")}>
            Open PDF
          </SecondaryButton>
          <SecondaryButton
            type="button"
            className="w-full justify-start"
            disabled={regen.isPending}
            onClick={async () => {
              setError(null);
              try {
                const res = await regen.mutateAsync();
                const job = res.data as { data?: { jobId?: string } } | undefined;
                if (job?.data?.jobId) setPdfJobId(String(job.data.jobId));
              } catch (e: unknown) {
                const message = getErrorMessage(e, "Failed to enqueue PDF regeneration");
                setError(message);
                toast.error(message);
                return;
              }
              toast.success("PDF regeneration queued");
            }}
          >
            {regen.isPending ? "Queueing PDF…" : "Regenerate PDF"}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            className="w-full justify-start"
            disabled={cancel.isPending}
            onClick={async () => {
              setError(null);
              setOk(null);
              if (!window.confirm("Cancel this invoice?")) return;
              try {
                await cancel.mutateAsync();
                setOk("Invoice cancelled.");
              } catch (e: unknown) {
                const message = getErrorMessage(e, "Failed to cancel invoice");
                setError(message);
                toast.error(message);
                return;
              }
              toast.success("Invoice cancelled");
            }}
          >
            {cancel.isPending ? "Cancelling…" : "Cancel invoice"}
          </SecondaryButton>
        </div>
      </DetailRail>
      <DetailRail
        eyebrow="Snapshot"
        title="Invoice posture"
        subtitle="Core status and totals that should stay visible across compliance, payments, and post-issue actions."
      >
        <DetailInfoList
          items={[
            { label: "Status", value: invoice.status ?? "—" },
            { label: "Issue date", value: invoice.issue_date ?? "—" },
            { label: "Due date", value: invoice.due_date ?? "—" },
            { label: "Total", value: Number(invoice.total ?? 0).toFixed(2) },
            { label: "Credited", value: totalCredited.toFixed(2) },
            { label: "Net after credits", value: (Number(invoice.total ?? 0) - totalCredited).toFixed(2) },
          ]}
        />
      </DetailRail>
    </>
  ) : null;

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Sales detail"
        title={invoice?.invoice_no ?? "Invoice"}
        subtitle="Handle issuance, sharing, credit notes, sales returns, payments, and lifecycle history from one operational surface."
        badges={[
          <WorkspaceStatBadge key="status" label="Status" value={invoice?.status ?? "—"} />,
          <WorkspaceStatBadge key="credited" label="Credited" value={totalCredited.toFixed(2)} variant="outline" />,
        ]}
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/sales/invoices`}>
            Back
          </Link>
        }
        metrics={
          invoice
            ? [
                { label: "Issue date", value: invoice.issue_date ?? "—" },
                { label: "Due date", value: invoice.due_date ?? "—" },
                { label: "Invoice total", value: Number(invoice.total ?? 0).toFixed(2) },
                { label: "Net after credits", value: (Number(invoice.total ?? 0) - totalCredited).toFixed(2) },
              ]
            : []
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading invoice…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load invoice")} /> : null}

      {invoice ? (
        <DetailTabs
          defaultValue="summary"
          items={[
            { id: "summary", label: "Summary" },
            { id: "compliance", label: "Compliance", badge: shares.length },
            { id: "post-issue", label: "Post-issue", badge: creditNotes.length },
            { id: "payments", label: "Payments", badge: paymentsForInvoice.length },
            { id: "activity", label: "Activity", badge: lifecycleEvents.length },
          ]}
        >
          <DetailTabPanel value="summary" rail={invoiceDetailRail}>
            <WorkspacePanel title="Invoice actions" subtitle="Issue the document and keep the series-controlled transition explicit.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Issue date</div>
                  <div className="mt-2 text-sm font-medium">{invoice.issue_date ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Due date</div>
                  <div className="mt-2 text-sm font-medium">{invoice.due_date ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Invoice total</div>
                  <div className="mt-2 text-sm font-medium">{Number(invoice.total ?? 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Net after credits</div>
                  <div className="mt-2 text-sm font-medium">{(Number(invoice.total ?? 0) - totalCredited).toFixed(2)}</div>
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
                        setOk(null);
                        try {
                          await issue.mutateAsync({ series_code: seriesCode });
                          setOk("Invoice issued.");
                        } catch (e: unknown) {
                          const message = getErrorMessage(e, "Failed to issue invoice");
                          setError(message);
                          toast.error(message);
                          return;
                        }
                        toast.success("Invoice issued");
                      }}
                    >
                      {issue.isPending ? "Issuing…" : "Issue"}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </WorkspacePanel>

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
          </DetailTabPanel>

          <DetailTabPanel value="compliance" rail={invoiceDetailRail}>
            <InvoiceCompliancePanel companyId={companyId} invoiceId={invoiceId} />
            <Card>
              <CardHeader>
                <CardTitle>Share invoice</CardTitle>
                <CardDescription>Log share activity and keep a visible recipient trail for the issued document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="grid gap-4 md:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setError(null);
                    setOk(null);
                    if (!shareRecipient.trim()) return setError("Recipient is required.");
                    try {
                      await share.mutateAsync({
                        channel: shareChannel,
                        recipient: shareRecipient.trim(),
                        message: shareMessage.trim() || undefined,
                      });
                      setShareRecipient("");
                      setShareMessage("");
                      setOk("Invoice share logged.");
                    } catch (e: unknown) {
                      const message = getErrorMessage(e, "Failed to share invoice");
                      setError(message);
                      toast.error(message);
                      return;
                    }
                    toast.success("Invoice share logged");
                  }}
                >
                  <SelectField
                    label="Channel"
                    value={shareChannel}
                    onChange={(value) => setShareChannel(value as "email" | "whatsapp" | "sms")}
                    options={[
                      { value: "email", label: "Email" },
                      { value: "whatsapp", label: "WhatsApp" },
                      { value: "sms", label: "SMS" },
                    ]}
                  />
                  <TextField label="Recipient" value={shareRecipient} onChange={setShareRecipient} placeholder="email or phone" />
                  <div className="md:col-span-2">
                    <TextField label="Message" value={shareMessage} onChange={setShareMessage} placeholder="Optional note" />
                  </div>
                  <div className="md:col-span-2">
                    <PrimaryButton type="submit" disabled={share.isPending}>
                      {share.isPending ? "Logging…" : "Log share"}
                    </PrimaryButton>
                  </div>
                </form>

                <div className="space-y-3">
                  {shares.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                      No share events logged yet.
                    </div>
                  ) : (
                    shares.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                        <div className="font-medium text-[var(--foreground)]">{entry.channel} to {entry.recipient}</div>
                        <div className="mt-1 text-[var(--muted)]">{entry.sentAt ?? entry.sent_at ?? "—"}</div>
                      </div>
                    ))
                  )}
                </div>
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
                    <div>Job: <code>{pdfJobId}</code></div>
                    {pdfJobQuery.isLoading ? <LoadingBlock label="Checking PDF job…" /> : null}
                    {pdfJobQuery.isError ? <InlineError message={getErrorMessage(pdfJobQuery.error, "Failed to fetch PDF job status")} /> : null}
                    {pdfJobQuery.data ? (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                        <div className="font-medium text-[var(--foreground)]">Status: {pdfJobQuery.data.data.data.state}</div>
                        {pdfJobQuery.data.data.data.failed_reason ? <div className="mt-2 text-[var(--danger)]">{pdfJobQuery.data.data.data.failed_reason}</div> : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[var(--muted)]">No PDF regeneration job is currently being tracked.</div>
                )}
              </CardContent>
            </Card>
          </DetailTabPanel>

          <DetailTabPanel value="post-issue" rail={invoiceDetailRail}>
            <Card>
              <CardHeader>
                <CardTitle>Credit notes and sales returns</CardTitle>
                <CardDescription>Create post-issue corrections without cancelling the original invoice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Document type"
                    value={creditKind}
                    onChange={(value) => {
                      const next = value as "credit_note" | "sales_return";
                      setCreditKind(next);
                      setCreditRestock(next === "sales_return");
                    }}
                    options={[
                      { value: "credit_note", label: "Credit note" },
                      { value: "sales_return", label: "Sales return" },
                    ]}
                  />
                  <DateField label="Date" value={creditDate} onChange={setCreditDate} />
                </div>

                <TextField label="Notes" value={creditNotesText} onChange={setCreditNotesText} placeholder="Optional" />

                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input checked={creditRestock} onChange={(e) => setCreditRestock(e.target.checked)} type="checkbox" />
                  Restock returned quantity into inventory
                </label>

                <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  {items.map((item) => {
                    const qty = Number(item.quantity ?? 0);
                    const credited = creditedByItem.get(item.id) ?? 0;
                    const available = Math.max(0, qty - credited);
                    const productName = item.product?.name ?? item.productId ?? item.product_id ?? item.id;
                    return (
                      <div key={item.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr]">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{productName}</div>
                          <div className="mt-1 text-xs text-[var(--muted)]">Issued {qty} • Already credited {credited}</div>
                        </div>
                        <div className="text-sm text-[var(--muted-strong)]">Available {available}</div>
                        <div className="text-sm text-[var(--muted-strong)]">Unit {Number(item.unitPrice ?? item.unit_price ?? 0).toFixed(2)}</div>
                        <input
                          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                          min="0"
                          step="0.01"
                          value={creditQuantities[item.id] ?? ""}
                          onChange={(e) => setCreditQuantities((current) => ({ ...current, [item.id]: e.target.value }))}
                          placeholder="Qty to credit"
                          type="number"
                        />
                      </div>
                    );
                  })}
                </div>

                <PrimaryButton
                  type="button"
                  disabled={credit.isPending}
                  onClick={async () => {
                    setError(null);
                    setOk(null);
                    const payloadItems = items
                      .map((item) => ({
                        invoice_item_id: item.id,
                        product_id: String(item.productId ?? item.product_id ?? ""),
                        quantity: creditQuantities[item.id]?.trim() ?? "",
                      }))
                      .filter((item) => item.quantity && Number(item.quantity) > 0);
                    if (payloadItems.length === 0) return setError("Add at least one credit quantity.");
                    try {
                      await credit.mutateAsync({
                        kind: creditKind,
                        note_date: creditDate || undefined,
                        notes: creditNotesText || undefined,
                        restock: creditRestock,
                        items: payloadItems,
                      });
                      setCreditQuantities({});
                      setCreditDate("");
                      setCreditNotesText("");
                      setOk(creditKind === "sales_return" ? "Sales return created." : "Credit note created.");
                    } catch (e: unknown) {
                      const message = getErrorMessage(e, "Failed to create credit note");
                      setError(message);
                      toast.error(message);
                      return;
                    }
                    toast.success(creditKind === "sales_return" ? "Sales return created" : "Credit note created");
                  }}
                >
                  {credit.isPending ? "Saving…" : creditKind === "sales_return" ? "Create sales return" : "Create credit note"}
                </PrimaryButton>

                <div className="space-y-3">
                  {creditNotes.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                      No credit notes or sales returns have been created yet.
                    </div>
                  ) : (
                    creditNotes.map((note) => (
                      <div key={note.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                        <div className="font-medium text-[var(--foreground)]">
                          {(note.kind ?? "credit_note").replace(/_/g, " ")} • {note.noteNumber ?? note.note_number ?? note.id}
                        </div>
                        <div className="mt-1 text-[var(--muted)]">
                          {note.noteDate ?? note.note_date ?? "—"} • Total {Number(note.total ?? 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </DetailTabPanel>

          <DetailTabPanel value="payments" rail={invoiceDetailRail}>
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Record payments and review settlement activity for this invoice.</CardDescription>
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
                        invoice_id: invoiceId,
                        amount: payAmount,
                        method: payMethod,
                        reference: payReference || undefined,
                        payment_date: payDate || undefined,
                      });
                      setPayAmount("");
                      setPayReference("");
                      setPayDate("");
                      setOk("Payment recorded.");
                    } catch (e: unknown) {
                      const message = getErrorMessage(e, "Failed to record payment");
                      setError(message);
                      toast.error(message);
                      return;
                    }
                    toast.success("Payment recorded");
                  }}
                >
                  <TextField label="Amount" value={payAmount} onChange={setPayAmount} type="number" />
                  <SelectField
                    label="Method"
                    value={payMethod}
                    onChange={setPayMethod}
                    options={[
                      { value: "cash", label: "Cash" },
                      { value: "upi", label: "UPI" },
                      { value: "bank", label: "Bank" },
                      { value: "card", label: "Card" },
                    ]}
                  />
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
                        {paymentsForInvoice.map((payment) => (
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
          </DetailTabPanel>

          <DetailTabPanel value="activity" rail={invoiceDetailRail}>
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle history</CardTitle>
                <CardDescription>Track issue, share, payment, cancellation, and post-issue correction events.</CardDescription>
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
            {error ? <InlineError message={error} /> : null}
            {ok ? <div className="text-sm text-green-700">{ok}</div> : null}
          </DetailTabPanel>
        </DetailTabs>
      ) : null}
    </div>
  );
}
