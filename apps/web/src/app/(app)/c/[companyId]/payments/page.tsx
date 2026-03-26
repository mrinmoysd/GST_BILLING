"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useInvoices, usePayments, usePurchases, useRecordPayment, useUpdatePaymentInstrument } from "@/lib/billing/hooks";
import { useBankAccounts } from "@/lib/finance/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

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
  const [instrumentStatus, setInstrumentStatus] = React.useState("");
  const [targetType, setTargetType] = React.useState<"invoice" | "purchase">("invoice");
  const [targetId, setTargetId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [instrumentType, setInstrumentType] = React.useState("");
  const [bankAccountId, setBankAccountId] = React.useState("");
  const [filterBankAccountId, setFilterBankAccountId] = React.useState("");
  const [instrumentNumber, setInstrumentNumber] = React.useState("");
  const [instrumentDate, setInstrumentDate] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState("");
  const [selectedPaymentId, setSelectedPaymentId] = React.useState("");
  const [nextInstrumentStatus, setNextInstrumentStatus] = React.useState("deposited");
  const [nextBankAccountId, setNextBankAccountId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const paymentsQuery = usePayments({
    companyId,
    page: 1,
    limit: 50,
    from: from || undefined,
    to: to || undefined,
    method: method || undefined,
    instrument_status: instrumentStatus || undefined,
    bank_account_id: filterBankAccountId || undefined,
  });
  const invoicesQuery = useInvoices({ companyId, page: 1, limit: 50, status: "issued" });
  const purchasesQuery = usePurchases({ companyId, page: 1, limit: 50 });
  const recordPayment = useRecordPayment({ companyId });
  const bankAccountsQuery = useBankAccounts(companyId);
  const updateInstrument = useUpdatePaymentInstrument({ companyId, paymentId: selectedPaymentId || "pending" });

  type PaymentRow = Record<string, unknown>;
  const paymentRows = (paymentsQuery.data?.data ?? []) as PaymentRow[];
  const invoiceRows = ((invoicesQuery.data?.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    label: String(row.invoiceNumber ?? row.invoice_no ?? row.id),
  }));
  const purchaseRows = ((purchasesQuery.data?.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    label: String(row.billNumber ?? row.purchaseNumber ?? row.id),
  }));
  const targetOptions = targetType === "invoice" ? invoiceRows : purchaseRows;
  const bankAccountRows = bankAccountsQuery.data?.data.data ?? [];

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
      <WorkspaceHero
        eyebrow="Settlement workspace"
        title="Payments"
        subtitle="Record settlements and review invoice and purchase payment activity from one dedicated payment control surface."
        badges={[
          <WorkspaceStatBadge key="count" label="Payments" value={paymentTotals.count} />,
          <WorkspaceStatBadge key="amount" label="Total" value={`₹${paymentTotals.amount.toFixed(2)}`} variant="outline" />,
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <WorkspacePanel title="Record payment" subtitle="Attach a payment to an issued invoice or an existing purchase from one place.">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Target type"
                value={targetType}
                onChange={(value) => {
                  const next = value === "purchase" ? "purchase" : "invoice";
                  setTargetType(next);
                  setTargetId("");
                }}
                options={[
                  { value: "invoice", label: "Invoice" },
                  { value: "purchase", label: "Purchase" },
                ]}
              />
              <SelectField
                label={targetType === "invoice" ? "Invoice" : "Purchase"}
                value={targetId}
                onChange={setTargetId}
                options={[
                  { value: "", label: "Select…" },
                  ...targetOptions.map((option) => ({ value: option.id, label: option.label })),
                ]}
              />
              <TextField label="Amount" value={amount} onChange={setAmount} type="number" />
              <SelectField
                label="Method"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "upi", label: "UPI" },
                  { value: "bank", label: "Bank" },
                  { value: "card", label: "Card" },
                  { value: "cheque", label: "Cheque" },
                  { value: "pdc", label: "PDC" },
                ]}
              />
              <SelectField
                label="Instrument type"
                value={instrumentType}
                onChange={setInstrumentType}
                options={[
                  { value: "", label: "Auto from method" },
                  { value: "cash", label: "Cash" },
                  { value: "upi", label: "UPI" },
                  { value: "bank", label: "Bank transfer" },
                  { value: "card", label: "Card" },
                  { value: "cheque", label: "Cheque" },
                  { value: "pdc", label: "PDC" },
                ]}
              />
              <SelectField
                label="Bank account"
                value={bankAccountId}
                onChange={setBankAccountId}
                options={[
                  { value: "", label: "None" },
                  ...bankAccountRows.map((account) => ({
                    value: account.id,
                    label: `${account.nickname}${account.accountNumberLast4 ? ` • ${account.accountNumberLast4}` : ""}`,
                  })),
                ]}
              />
              <TextField label="Instrument number" value={instrumentNumber} onChange={setInstrumentNumber} placeholder="Cheque / UTR / txn ref" />
              <DateField label="Instrument date" value={instrumentDate} onChange={setInstrumentDate} />
              <TextField label="Reference" value={reference} onChange={setReference} placeholder="Optional" />
              <DateField label="Payment date" value={paymentDate} onChange={setPaymentDate} />
              <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional internal note" />
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
                      instrument_type: instrumentType || undefined,
                      bank_account_id: bankAccountId || undefined,
                      instrument_number: instrumentNumber || undefined,
                      instrument_date: instrumentDate || undefined,
                      reference: reference || undefined,
                      notes: notes || undefined,
                      payment_date: paymentDate || undefined,
                    });
                    setAmount("");
                    setInstrumentNumber("");
                    setReference("");
                    setNotes("");
                    setPaymentDate("");
                    toast.success("Payment recorded");
                  } catch (err: unknown) {
                    const message = getErrorMessage(err, "Failed to record payment");
                    setError(message);
                    toast.error(message);
                  }
                }}
              >
                {recordPayment.isPending ? "Recording…" : "Record payment"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setPaymentDate(new Date().toISOString().slice(0, 10))}>
                Use today
              </SecondaryButton>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Filters" subtitle="Review the current payment ledger using date and method filters." tone="muted">
          <div className="grid gap-4 md:grid-cols-2">
            <DateField label="From" value={from} onChange={setFrom} />
            <DateField label="To" value={to} onChange={setTo} />
            <SelectField
              label="Method"
              value={method}
              onChange={setMethod}
              options={[
                { value: "", label: "All methods" },
                { value: "cash", label: "Cash" },
                { value: "upi", label: "UPI" },
                { value: "bank", label: "Bank" },
                { value: "card", label: "Card" },
                { value: "cheque", label: "Cheque" },
                { value: "pdc", label: "PDC" },
              ]}
            />
            <SelectField
              label="Instrument status"
              value={instrumentStatus}
              onChange={setInstrumentStatus}
              options={[
                { value: "", label: "All statuses" },
                { value: "received", label: "Received" },
                { value: "deposited", label: "Deposited" },
                { value: "cleared", label: "Cleared" },
                { value: "bounced", label: "Bounced" },
              ]}
            />
            <SelectField
              label="Bank account"
              value={filterBankAccountId}
              onChange={setFilterBankAccountId}
              options={[
                { value: "", label: "All bank accounts" },
                ...bankAccountRows.map((account) => ({
                  value: account.id,
                  label: `${account.nickname}${account.accountNumberLast4 ? ` • ${account.accountNumberLast4}` : ""}`,
                })),
              ]}
            />
            <div className="flex items-end gap-3">
              <Link href={`/c/${companyId}/sales/invoices`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Open invoices
              </Link>
              <Link href={`/c/${companyId}/purchases`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Open purchases
              </Link>
              <Link href={`/c/${companyId}/payments/collections`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Collections
              </Link>
              <Link href={`/c/${companyId}/payments/banking`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Banking
              </Link>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Instrument lifecycle" subtitle="Update cheque, PDC, or bank instrument status after receipt.">
        <div className="grid gap-4 md:grid-cols-4">
          <SelectField
            label="Payment"
            value={selectedPaymentId}
            onChange={setSelectedPaymentId}
            options={[
              { value: "", label: "Select payment" },
              ...paymentRows.map((row) => ({
                value: String(row.id),
                label: `${String(row.method ?? "payment")} • ${Number(row.amount ?? 0).toFixed(2)}`,
              })),
            ]}
          />
          <SelectField
            label="Next status"
            value={nextInstrumentStatus}
            onChange={setNextInstrumentStatus}
            options={[
              { value: "received", label: "Received" },
              { value: "deposited", label: "Deposited" },
              { value: "cleared", label: "Cleared" },
              { value: "bounced", label: "Bounced" },
            ]}
          />
          <SelectField
            label="Bank account"
            value={nextBankAccountId}
            onChange={setNextBankAccountId}
            options={[
              { value: "", label: "Keep current" },
              ...bankAccountRows.map((account) => ({
                value: account.id,
                label: `${account.nickname}${account.accountNumberLast4 ? ` • ${account.accountNumberLast4}` : ""}`,
              })),
            ]}
          />
          <div className="flex items-end">
            <PrimaryButton
              type="button"
              disabled={updateInstrument.isPending || !selectedPaymentId}
              onClick={async () => {
                if (!selectedPaymentId) return;
                try {
                  await updateInstrument.mutateAsync({
                    instrument_status: nextInstrumentStatus,
                    bank_account_id: nextBankAccountId || undefined,
                  });
                  toast.success("Instrument updated");
                } catch (err: unknown) {
                  toast.error(getErrorMessage(err, "Failed to update instrument"));
                }
              }}
            >
              {updateInstrument.isPending ? "Updating…" : "Update"}
            </PrimaryButton>
          </div>
        </div>
      </WorkspacePanel>

      {paymentsQuery.isLoading ? <LoadingBlock label="Loading payments…" /> : null}
      {paymentsQuery.isError ? <InlineError message={getErrorMessage(paymentsQuery.error, "Failed to load payments")} /> : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && paymentRows.length === 0 ? (
        <EmptyState title="No payments yet" hint="Record a payment above or adjust the current filters." />
      ) : null}

      {paymentRows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Ledger plane"
          title="Payment activity"
          subtitle="Recent payment records across both sales and purchases."
        >
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Date</DataTh>
                    <DataTh>Target</DataTh>
                    <DataTh>Method</DataTh>
                    <DataTh>Status</DataTh>
                    <DataTh>Bank</DataTh>
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
                        <DataTd>{String(row.instrumentStatus ?? row.instrument_status ?? "—")}</DataTd>
                        <DataTd>{String((row.bankAccount as { nickname?: string } | null | undefined)?.nickname ?? "—")}</DataTd>
                        <DataTd>{String(row.reference ?? "—")}</DataTd>
                        <DataTd className="text-right">{Number(row.amount ?? 0).toFixed(2)}</DataTd>
                      </DataTr>
                    );
                  })}
                </tbody>
              </DataTable>
            </DataTableShell>
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
