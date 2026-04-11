"use client";

import Link from "next/link";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { useInvoices, usePayments, usePurchases, useRecordPayment, useUpdatePaymentInstrument } from "@/lib/billing/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatDateLabel } from "@/lib/format/date";
import { useBankAccounts } from "@/lib/finance/hooks";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  ChartEmptyState,
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartCompactNumber,
  formatChartCurrency,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

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
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
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
  const paymentRows = React.useMemo(() => (paymentsQuery.data?.data ?? []) as PaymentRow[], [paymentsQuery.data?.data]);
  const invoiceRows = React.useMemo(
    () =>
      ((invoicesQuery.data?.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        label: String(row.invoiceNumber ?? row.invoice_no ?? row.id),
      })),
    [invoicesQuery.data?.data],
  );
  const purchaseRows = React.useMemo(
    () =>
      ((purchasesQuery.data?.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        label: String(row.billNumber ?? row.purchaseNumber ?? row.id),
      })),
    [purchasesQuery.data?.data],
  );
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

  const counts = React.useMemo(() => {
    const recorded = paymentRows.filter((row) => String(row.instrumentStatus ?? row.instrument_status ?? "").toLowerCase() === "cleared").length;
    const pendingInstrument = paymentRows.filter((row) => {
      const status = String(row.instrumentStatus ?? row.instrument_status ?? "").toLowerCase();
      return status === "received" || status === "deposited";
    }).length;
    const bounced = paymentRows.filter((row) => String(row.instrumentStatus ?? row.instrument_status ?? "").toLowerCase() === "bounced").length;
    return { all: paymentRows.length, recorded, pendingInstrument, bounced };
  }, [paymentRows]);

  const statusAmount = React.useMemo(
    () =>
      paymentRows.reduce<Record<string, number>>((acc, row) => {
        const key = String(row.instrumentStatus ?? row.instrument_status ?? "untracked").toLowerCase() || "untracked";
        acc[key] = (acc[key] ?? 0) + Number(row.amount ?? 0);
        return acc;
      }, {}),
    [paymentRows],
  );

  const methodDistribution = React.useMemo(
    () =>
      Object.entries(
        paymentRows.reduce<Record<string, number>>((acc, row) => {
          const key = String(row.method ?? "other").toLowerCase();
          acc[key] = (acc[key] ?? 0) + Number(row.amount ?? 0);
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name: name.toUpperCase(), value })),
    [paymentRows],
  );

  const statusDistribution = React.useMemo(
    () =>
      Object.entries(statusAmount).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
      })),
    [statusAmount],
  );

  const dailyFlow = React.useMemo(() => {
    const grouped = paymentRows.reduce<Record<string, number>>((acc, row) => {
      const dateKey = String(row.paymentDate ?? row.payment_date ?? "").slice(0, 10);
      if (!dateKey) return acc;
      acc[dateKey] = (acc[dateKey] ?? 0) + Number(row.amount ?? 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-7)
      .map(([date, value]) => ({
        date,
        label: formatDateLabel(date),
        value,
      }));
  }, [paymentRows]);

  const pendingInstrumentAmount = (statusAmount.received ?? 0) + (statusAmount.deposited ?? 0);
  const bouncedAmount = statusAmount.bounced ?? 0;
  const clearedAmount = statusAmount.cleared ?? 0;

  const filteredRows = React.useMemo(() => {
    return paymentRows.filter((row) => {
      const status = String(row.instrumentStatus ?? row.instrument_status ?? "").toLowerCase();
      if (segment === "pending") return status === "received" || status === "deposited";
      if (segment === "cleared") return status === "cleared";
      if (segment === "bounced") return status === "bounced";
      return true;
    });
  }, [paymentRows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedPaymentId("");
      return;
    }
    if (!selectedPaymentId || !filteredRows.some((row) => String(row.id) === selectedPaymentId)) {
      setSelectedPaymentId(String(filteredRows[0]?.id ?? ""));
    }
  }, [filteredRows, selectedPaymentId]);

  const selectedPayment = filteredRows.find((row) => String(row.id) === selectedPaymentId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Collections and receipts"
        title="Payments"
        subtitle="Record settlements, monitor instrument movement, and review receipt risk from one operational queue."
        badges={[
          <WorkspaceStatBadge key="count" label="Payments" value={paymentTotals.count} />,
          <WorkspaceStatBadge key="amount" label="Total" value={`₹${paymentTotals.amount.toFixed(2)}`} variant="outline" />,
        ]}
        actions={
          <>
            <Link href={`/c/${companyId}/payments/collections`}>
              <SecondaryButton type="button">Collections</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/payments/banking`}>
              <SecondaryButton type="button">Banking</SecondaryButton>
            </Link>
          </>
        }
      />

      <WorkspaceSection
        eyebrow="Control room"
        title="Receipt posture"
        subtitle="Keep the queue, instrument state, and method mix in view before you work line by line."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Recorded receipts" value={`₹${paymentTotals.amount.toFixed(2)}`} hint={`${paymentTotals.count} payment record(s) in scope.`} />
          <StatCard label="Cleared amount" value={`₹${clearedAmount.toFixed(2)}`} hint="Funds already cleared in the banking cycle." tone="quiet" />
          <StatCard label="Pending instruments" value={`₹${pendingInstrumentAmount.toFixed(2)}`} hint={`${counts.pendingInstrument} line(s) still awaiting bank movement.`} tone="quiet" />
          <StatCard label="Bounced exposure" value={`₹${bouncedAmount.toFixed(2)}`} hint={`${counts.bounced} line(s) currently marked bounced.`} tone="strong" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {dailyFlow.length > 0 ? (
            <ChartShell title="Daily receipts" subtitle="Recorded inflow trend for the latest visible payment dates.">
              <ChartFrame height={250}>
                <BarChart data={dailyFlow} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={getChartGridColor()} />
                  <XAxis dataKey="label" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
                  <ChartTooltip valueFormatter={formatChartCurrency} />
                  <Bar dataKey="value" name="Receipts" fill={getChartSeriesColor("primary")} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartFrame>
            </ChartShell>
          ) : (
            <ChartEmptyState title="Daily receipts" hint="Receipt trend appears once payment dates are present in the visible queue." />
          )}

          {statusDistribution.length > 0 ? (
            <ChartShell
              title="Instrument state mix"
              subtitle="Where the receipt queue is currently sitting in the settlement lifecycle."
              footer={<ChartLegend items={statusDistribution.map((item, index) => ({ label: item.name, tone: index === 0 ? "primary" : index === 1 ? "warning" : index === 2 ? "danger" : "neutral" }))} />}
            >
              <ChartFrame height={250}>
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={2}>
                    {statusDistribution.map((_, index) => (
                      <Cell
                        key={statusDistribution[index]?.name ?? index}
                        fill={
                          index === 0
                            ? getChartSeriesColor("primary")
                            : index === 1
                              ? getChartSeriesColor("warning")
                              : index === 2
                                ? getChartSeriesColor("danger")
                                : getChartSeriesColor("neutral")
                        }
                      />
                    ))}
                  </Pie>
                  <ChartTooltip valueFormatter={formatChartCurrency} />
                </PieChart>
              </ChartFrame>
            </ChartShell>
          ) : (
            <ChartEmptyState title="Instrument state mix" hint="State mix appears once receipt rows are available." />
          )}

          {methodDistribution.length > 0 ? (
            <ChartShell title="Payment method mix" subtitle="Channel distribution across cash, UPI, bank, card, and instruments.">
              <ChartFrame height={250}>
                <BarChart data={methodDistribution} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke={getChartGridColor()} />
                  <XAxis type="number" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={78} />
                  <ChartTooltip valueFormatter={formatChartCurrency} />
                  <Bar dataKey="value" name="Amount" fill={getChartSeriesColor("secondary")} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartFrame>
            </ChartShell>
          ) : (
            <ChartEmptyState title="Payment method mix" hint="Method distribution appears once payments have been recorded." />
          )}
        </div>
      </WorkspaceSection>

      <QueueSegmentBar
        items={[
          { id: "all", label: "All receipts", count: counts.all },
          { id: "pending", label: "Pending instruments", count: counts.pendingInstrument },
          { id: "cleared", label: "Cleared", count: counts.recorded },
          { id: "bounced", label: "Bounced", count: counts.bounced },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full queue" },
              { id: "pending", label: "Awaiting bank update" },
              { id: "bounced", label: "Recovery work" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>
        }
        summary={
          <>
            <QueueRowStateBadge label={`${filteredRows.length} in view`} />
            <QueueRowStateBadge label={`${counts.pendingInstrument} awaiting bank update`} variant="outline" />
          </>
        }
      />

      <QueueShell
        inspector={
          <>
            <QueueInspector
              eyebrow="Selected receipt"
              title={selectedPayment ? `${String(selectedPayment.method ?? "Payment")} • ${Number(selectedPayment.amount ?? 0).toFixed(2)}` : "Select receipt"}
              subtitle="Keep the document link, instrument state, and update action beside the queue."
              footer={
                selectedPayment ? (
                  <div className="text-xs leading-5 text-[var(--muted)]">
                    Update only when the instrument actually moves at the bank. This queue should mirror the real settlement lifecycle.
                  </div>
                ) : null
              }
            >
              {selectedPayment ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={String(selectedPayment.method ?? "—")} />
                    <QueueRowStateBadge label={String(selectedPayment.instrumentStatus ?? selectedPayment.instrument_status ?? "—")} variant="outline" />
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      {
                        label: "Target",
                        value:
                          selectedPayment.invoiceId || selectedPayment.invoice_id
                            ? `Invoice ${String(selectedPayment.invoiceId ?? selectedPayment.invoice_id).slice(0, 8)}`
                            : selectedPayment.purchaseId || selectedPayment.purchase_id
                              ? `Purchase ${String(selectedPayment.purchaseId ?? selectedPayment.purchase_id).slice(0, 8)}`
                              : "—",
                      },
                      { label: "Payment date", value: String(selectedPayment.paymentDate ?? selectedPayment.payment_date ?? "—") },
                      { label: "Reference", value: String(selectedPayment.reference ?? "—") },
                      { label: "Instrument no.", value: String(selectedPayment.instrumentNumber ?? selectedPayment.instrument_number ?? "—") },
                      { label: "Bank", value: String((selectedPayment.bankAccount as { nickname?: string } | null | undefined)?.nickname ?? "—") },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a receipt to inspect its document link and instrument status.</div>
              )}
            </QueueInspector>

            <QueueInspector
              eyebrow="Record"
              title="New payment"
              subtitle="Attach a payment to an issued invoice or an existing purchase without leaving the workspace."
            >
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
                      toastSuccess("Payment recorded.");
                    } catch (err: unknown) {
                      const message = getErrorMessage(err, "Failed to record payment.");
                      setError(message);
                      toastError(err, {
                        fallback: "Failed to record payment.",
                        title: message,
                        context: "payments-record",
                        metadata: { companyId, targetType, targetId },
                      });
                    }
                  }}
                >
                  {recordPayment.isPending ? "Recording…" : "Record payment"}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => setPaymentDate(new Date().toISOString().slice(0, 10))}>
                  Use today
                </SecondaryButton>
              </div>
            </QueueInspector>

            <QueueInspector
              eyebrow="Lifecycle"
              title="Instrument update"
              subtitle="Move cheque, PDC, or bank instrument status after the real-world bank event."
            >
              <div className="grid gap-4">
                <SelectField
                  label="Payment"
                  value={selectedPaymentId}
                  onChange={setSelectedPaymentId}
                  options={[
                    { value: "", label: "Select payment" },
                    ...filteredRows.map((row) => ({
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
                      toastSuccess("Instrument updated.");
                    } catch (err: unknown) {
                      toastError(err, {
                        fallback: "Failed to update instrument.",
                        context: "payments-update-instrument",
                        metadata: { companyId, paymentId: selectedPaymentId },
                      });
                    }
                  }}
                >
                  {updateInstrument.isPending ? "Updating…" : "Update instrument"}
                </PrimaryButton>
              </div>
            </QueueInspector>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Recorded</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{counts.recorded}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">Receipts already cleared at the bank.</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Pending</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{counts.pendingInstrument}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">Need deposit or clearance confirmation.</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Bounced</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{counts.bounced}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">Need recovery or customer follow-up.</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Value in view</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              ₹{filteredRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0).toFixed(2)}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">Filtered settlement volume.</div>
          </div>
        </div>

      {paymentsQuery.isLoading ? <LoadingBlock label="Loading payments…" /> : null}
      {paymentsQuery.isError ? <InlineError message={getErrorMessage(paymentsQuery.error, "Failed to load payments")} /> : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && filteredRows.length === 0 ? (
        <EmptyState title="No payments yet" hint="Record a payment above or adjust the current filters." />
      ) : null}

      {filteredRows.length > 0 ? (
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
                  {filteredRows.map((row) => {
                    const invoiceId = String(row.invoiceId ?? row.invoice_id ?? "");
                    const purchaseId = String(row.purchaseId ?? row.purchase_id ?? "");
                    const href = invoiceId
                      ? `/c/${companyId}/sales/invoices/${invoiceId}`
                      : purchaseId
                        ? `/c/${companyId}/purchases/${purchaseId}`
                        : undefined;
                    return (
                      <DataTr
                        key={String(row.id)}
                        className={selectedPaymentId === String(row.id) ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                        onClick={() => setSelectedPaymentId(String(row.id))}
                      >
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
      ) : null}
      </QueueShell>
    </div>
  );
}
