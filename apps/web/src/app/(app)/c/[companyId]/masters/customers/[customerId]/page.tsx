"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AddressValue, Customer } from "@/lib/masters/types";
import { useCustomer, useDeleteCustomer, useUpdateCustomer } from "@/lib/masters/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { DetailInfoList, DetailRail, DetailTabPanel, DetailTabs } from "@/lib/ui/detail";
import { EmptyState, InlineError, LoadingBlock, PageContextStrip, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { getErrorMessage } from "@/lib/errors";


type AddressDraft = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  fullText: string;
};

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeAddress(value?: AddressValue | null): AddressDraft {
  const address = value ?? {};
  return {
    line1: asText(address.line1 ?? address.line_1),
    line2: asText(address.line2 ?? address.line_2),
    city: asText(address.city),
    state: asText(address.state),
    postalCode: asText(address.postalCode ?? address.postal_code),
    country: asText(address.country),
    fullText: asText(address.fullText ?? address.full_text),
  };
}

function buildAddressPayload(address: AddressDraft) {
  const payload: Record<string, string> = {};
  if (address.line1.trim()) payload.line1 = address.line1.trim();
  if (address.line2.trim()) payload.line2 = address.line2.trim();
  if (address.city.trim()) payload.city = address.city.trim();
  if (address.state.trim()) payload.state = address.state.trim();
  if (address.postalCode.trim()) payload.postalCode = address.postalCode.trim();
  if (address.country.trim()) payload.country = address.country.trim();
  if (address.fullText.trim()) payload.full_text = address.fullText.trim();
  return Object.keys(payload).length ? payload : null;
}

function renderAddress(value?: AddressValue | null) {
  const address = normalizeAddress(value);
  const lines = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postalCode, address.country].filter(Boolean).join(" "),
    address.fullText,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "Not set";
}

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-[var(--foreground)]">{value}</div>
      {hint ? <div className="mt-1 text-sm text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-3 last:border-b-0">
      <div className="text-sm text-[var(--muted)]">{label}</div>
      <div className="max-w-[65%] text-right text-sm font-medium text-[var(--foreground)]">
        {value}
      </div>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <Label className="text-[13px] font-semibold text-[var(--muted-strong)]">{label}</Label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="flex min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-field)] px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </label>
  );
}

function AddressFields({
  prefix,
  value,
  onChange,
}: {
  prefix: string;
  value: AddressDraft;
  onChange: (next: AddressDraft) => void;
}) {
  const setField = (key: keyof AddressDraft, nextValue: string) =>
    onChange({ ...value, [key]: nextValue });

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
      <div className="mb-4 text-sm font-semibold text-[var(--foreground)]">{prefix}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Line 1" value={value.line1} onChange={(v) => setField("line1", v)} />
        <TextField label="Line 2" value={value.line2} onChange={(v) => setField("line2", v)} />
        <TextField label="City" value={value.city} onChange={(v) => setField("city", v)} />
        <TextField label="State" value={value.state} onChange={(v) => setField("state", v)} />
        <TextField
          label="Postal code"
          value={value.postalCode}
          onChange={(v) => setField("postalCode", v)}
        />
        <TextField label="Country" value={value.country} onChange={(v) => setField("country", v)} />
      </div>
      <div className="mt-4">
        <TextareaField
          label={`${prefix} notes / full text`}
          value={value.fullText}
          onChange={(v) => setField("fullText", v)}
          placeholder="Optional legacy or full address text"
        />
      </div>
    </div>
  );
}

type Props = { params: Promise<{ companyId: string; customerId: string }> };

export default function CustomerDetailPage({ params }: Props) {
  const router = useRouter();
  const { companyId, customerId } = React.use(params);
  const query = useCustomer({ companyId, customerId });
  const update = useUpdateCustomer({ companyId, customerId });
  const del = useDeleteCustomer({ companyId, customerId });
  const salespeople = useCompanySalespeople(companyId);

  const [name, setName] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState<string | null>(null);
  const [gstin, setGstin] = React.useState<string | null>(null);
  const [stateCode, setStateCode] = React.useState<string | null>(null);
  const [pricingTier, setPricingTier] = React.useState<string | null>(null);
  const [salespersonUserId, setSalespersonUserId] = React.useState<string | null>(null);
  const [creditLimit, setCreditLimit] = React.useState<string | null>(null);
  const [creditDays, setCreditDays] = React.useState<string | null>(null);
  const [creditControlMode, setCreditControlMode] = React.useState<string | null>(null);
  const [creditWarningPercent, setCreditWarningPercent] = React.useState<string | null>(null);
  const [creditBlockPercent, setCreditBlockPercent] = React.useState<string | null>(null);
  const [creditHold, setCreditHold] = React.useState<string | null>(null);
  const [creditHoldReason, setCreditHoldReason] = React.useState<string | null>(null);
  const [creditOverrideUntil, setCreditOverrideUntil] = React.useState<string | null>(null);
  const [creditOverrideReason, setCreditOverrideReason] = React.useState<string | null>(null);
  const [billingAddress, setBillingAddress] = React.useState<AddressDraft | null>(null);
  const [shippingAddress, setShippingAddress] = React.useState<AddressDraft | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const customer: Customer | undefined = query.data?.data;
  const nameValue = name ?? customer?.name ?? "";
  const emailValue = email ?? customer?.email ?? "";
  const phoneValue = phone ?? customer?.phone ?? "";
  const gstinValue = gstin ?? customer?.gstin ?? "";
  const stateCodeValue = stateCode ?? customer?.stateCode ?? customer?.state_code ?? "";
  const pricingTierValue = pricingTier ?? customer?.pricingTier ?? customer?.pricing_tier ?? "";
  const salespersonValue =
    salespersonUserId ??
    customer?.salespersonUserId ??
    customer?.salesperson_user_id ??
    "";
  const creditLimitValue =
    creditLimit ?? String(customer?.creditLimit ?? customer?.credit_limit ?? "");
  const creditDaysValue = creditDays ?? String(customer?.creditDays ?? customer?.credit_days ?? "");
  const creditControlModeValue =
    creditControlMode ?? customer?.creditControlMode ?? customer?.credit_control_mode ?? "warn";
  const creditWarningPercentValue =
    creditWarningPercent ??
    String(customer?.creditWarningPercent ?? customer?.credit_warning_percent ?? "80");
  const creditBlockPercentValue =
    creditBlockPercent ??
    String(customer?.creditBlockPercent ?? customer?.credit_block_percent ?? "100");
  const creditHoldValue = creditHold ?? String(customer?.creditHold ?? customer?.credit_hold ?? false);
  const creditHoldReasonValue =
    creditHoldReason ?? customer?.creditHoldReason ?? customer?.credit_hold_reason ?? "";
  const creditOverrideUntilValue =
    creditOverrideUntil ??
    (customer?.creditOverrideUntil ?? customer?.credit_override_until ?? "")?.slice(0, 10);
  const creditOverrideReasonValue =
    creditOverrideReason ?? customer?.creditOverrideReason ?? customer?.credit_override_reason ?? "";
  const billingAddressValue =
    billingAddress ?? normalizeAddress(customer?.billingAddress ?? customer?.billing_address);
  const shippingAddressValue =
    shippingAddress ?? normalizeAddress(customer?.shippingAddress ?? customer?.shipping_address);
  const salespersonOptions = Array.isArray(salespeople.data?.data) ? salespeople.data.data : [];
  const summary = customer?.summary;
  const recentInvoices = summary?.activity?.recent_invoices ?? [];
  const recentPayments = summary?.activity?.recent_payments ?? [];
  const customerDetailRail = customer ? (
    <>
      <DetailRail
        eyebrow="Quick actions"
        title="Customer workspace"
        subtitle="Jump into the related financial and recovery flows without losing context."
      >
        <div className="flex flex-col gap-2">
          <Link href={`/c/${companyId}/masters/customers`}>
            <SecondaryButton type="button" className="w-full justify-start">Back to customers</SecondaryButton>
          </Link>
          <Link href={`/c/${companyId}/masters/customers/${customerId}/ledger`}>
            <SecondaryButton type="button" className="w-full justify-start">Open ledger</SecondaryButton>
          </Link>
          <Link href={`/c/${companyId}/payments/collections`}>
            <SecondaryButton type="button" className="w-full justify-start">Open collections</SecondaryButton>
          </Link>
          <Link href={`/c/${companyId}/payments`}>
            <SecondaryButton type="button" className="w-full justify-start">Open payments</SecondaryButton>
          </Link>
        </div>
      </DetailRail>
      <DetailRail
        eyebrow="Snapshot"
        title="Current posture"
        subtitle="Commercial and field context that should stay visible while switching tabs."
      >
        <DetailInfoList
          items={[
            { label: "Exposure", value: formatMoney(summary?.credit?.current_exposure) },
            { label: "Overdue", value: formatMoney(summary?.credit?.overdue_amount) },
            { label: "Collections owner", value: summary?.collections?.owner?.name ?? summary?.collections?.owner?.email ?? "Not assigned" },
            { label: "Active beat", value: summary?.coverage?.active_assignment?.beat?.name ?? "Not assigned" },
          ]}
        />
      </DetailRail>
    </>
  ) : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title={customer?.name ?? "Customer"}
        subtitle="Review profile, credit posture, field coverage, and recent commercial activity from one customer workspace."
        badges={[
          <Badge key="salesperson" variant="secondary">{customer?.salesperson?.name ?? customer?.salesperson?.email ?? "Unassigned"}</Badge>,
          <Badge key="tier" variant="outline">{pricingTierValue || "No pricing tier"}</Badge>,
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href={`/c/${companyId}/masters/customers`}>
              <SecondaryButton type="button">Back</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/masters/customers/${customerId}/ledger`}>
              <SecondaryButton type="button">Ledger</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/payments/collections`}>
              <SecondaryButton type="button">Collections</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/payments`}>
              <SecondaryButton type="button">Payments</SecondaryButton>
            </Link>
          </div>
        }
        context={
          customer ? (
            <PageContextStrip>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Current exposure"
                  value={formatMoney(summary?.credit?.current_exposure)}
                  hint={`${summary?.credit?.open_invoices_count ?? 0} open invoices`}
                />
                <StatCard
                  label="Overdue amount"
                  value={formatMoney(summary?.credit?.overdue_amount)}
                  hint={`${summary?.credit?.overdue_invoices_count ?? 0} overdue invoices`}
                />
                <StatCard
                  label="Open collection tasks"
                  value={String(summary?.collections?.open_tasks_count ?? 0)}
                  hint={`${summary?.collections?.overdue_tasks_count ?? 0} overdue follow-ups`}
                />
                <StatCard
                  label="Last payment"
                  value={summary?.credit?.last_payment ? formatMoney(summary.credit.last_payment.amount) : "Not set"}
                  hint={
                    summary?.credit?.last_payment
                      ? `${formatDateTime(summary.credit.last_payment.payment_date)} · ${summary.credit.last_payment.method ?? "payment"}`
                      : "No receipts recorded yet"
                  }
                />
              </div>
            </PageContextStrip>
          ) : null
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading customer…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load customer")} />
      ) : null}

      {customer ? (
        <>
          <DetailTabs
            defaultValue="overview"
            items={[
              { id: "overview", label: "Overview" },
              { id: "financials", label: "Financials", badge: summary?.collections?.open_tasks_count ?? 0 },
              { id: "coverage", label: "Coverage" },
              { id: "activity", label: "Activity", badge: recentInvoices.length + recentPayments.length },
              { id: "edit", label: "Edit" },
            ]}
          >
            <DetailTabPanel value="overview" rail={customerDetailRail}>
              <Card className="[background-image:var(--surface-highlight)]">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    Customer profile
                  </Badge>
                  <CardTitle>{customer.name}</CardTitle>
                  <CardDescription>
                    Reference id: <code>{customerId}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SummaryRow label="Email" value={customer.email ?? "Not set"} />
                  <SummaryRow label="Phone" value={customer.phone ?? "Not set"} />
                  <SummaryRow label="GSTIN" value={customer.gstin ?? "Not set"} />
                  <SummaryRow
                    label="State code"
                    value={customer.stateCode ?? customer.state_code ?? "Not set"}
                  />
                  <SummaryRow
                    label="Primary salesperson"
                    value={customer.salesperson?.name ?? customer.salesperson?.email ?? "Unassigned"}
                  />
                  <SummaryRow label="Pricing tier" value={pricingTierValue || "Not set"} />
                  <SummaryRow
                    label="Billing address"
                    value={<span className="whitespace-pre-wrap">{renderAddress(customer.billingAddress ?? customer.billing_address)}</span>}
                  />
                  <SummaryRow
                    label="Shipping address"
                    value={<span className="whitespace-pre-wrap">{renderAddress(customer.shippingAddress ?? customer.shipping_address)}</span>}
                  />
                </CardContent>
              </Card>
            </DetailTabPanel>

            <DetailTabPanel value="financials" rail={customerDetailRail}>
              <Card>
                <CardHeader>
                  <CardTitle>Credit and collections</CardTitle>
                  <CardDescription>Keep receivables risk and recovery ownership visible on the customer record.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SummaryRow label="Credit limit" value={creditLimitValue || "Not set"} />
                  <SummaryRow label="Credit days" value={creditDaysValue || "Not set"} />
                  <SummaryRow label="Control mode" value={creditControlModeValue} />
                  <SummaryRow label="Warning threshold" value={`${creditWarningPercentValue || "80"}%`} />
                  <SummaryRow label="Block threshold" value={`${creditBlockPercentValue || "100"}%`} />
                  <SummaryRow label="Credit hold" value={creditHoldValue === "true" ? "Yes" : "No"} />
                  <SummaryRow label="Hold reason" value={creditHoldReasonValue || "Not set"} />
                  <SummaryRow
                    label="Override until"
                    value={creditOverrideUntilValue ? formatDate(creditOverrideUntilValue) : "Not set"}
                  />
                  <SummaryRow
                    label="Collections owner"
                    value={
                      summary?.collections?.owner?.name ??
                      summary?.collections?.owner?.email ??
                      "Not assigned"
                    }
                  />
                  <SummaryRow
                    label="Next collection action"
                    value={summary?.collections?.next_action_date ? formatDate(summary.collections.next_action_date) : "Not scheduled"}
                  />
                  <SummaryRow
                    label="Latest open task"
                    value={
                      summary?.collections?.latest_open_task ? (
                        <span className="space-y-1">
                          <span className="block capitalize">
                            {summary.collections.latest_open_task.status ?? "open"} ·{" "}
                            {summary.collections.latest_open_task.priority ?? "normal"}
                          </span>
                          <span className="block text-[var(--muted)]">
                            {summary.collections.latest_open_task.promise_to_pay_date
                              ? `PTP ${formatDate(summary.collections.latest_open_task.promise_to_pay_date)}`
                              : summary.collections.latest_open_task.notes || "No notes"}
                          </span>
                        </span>
                      ) : (
                        "No open tasks"
                      )
                    }
                  />
                </CardContent>
              </Card>
            </DetailTabPanel>

            <DetailTabPanel value="coverage" rail={customerDetailRail}>
              <Card>
                <CardHeader>
                  <CardTitle>Route and coverage</CardTitle>
                  <CardDescription>Show the D12 coverage assignment and the latest visit context.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SummaryRow
                    label="Territory"
                    value={summary?.coverage?.active_assignment?.territory?.name ?? "Not assigned"}
                  />
                  <SummaryRow
                    label="Route"
                    value={summary?.coverage?.active_assignment?.route?.name ?? "Not assigned"}
                  />
                  <SummaryRow
                    label="Beat"
                    value={summary?.coverage?.active_assignment?.beat?.name ?? "Not assigned"}
                  />
                  <SummaryRow
                    label="Visit rhythm"
                    value={
                      summary?.coverage?.active_assignment?.visit_frequency
                        ? `${summary.coverage.active_assignment.visit_frequency} · ${summary.coverage.active_assignment.preferred_visit_day ?? "Any day"}`
                        : "Not configured"
                    }
                  />
                  <SummaryRow
                    label="Priority"
                    value={summary?.coverage?.active_assignment?.priority ?? "Not set"}
                  />
                  <SummaryRow
                    label="Latest visit"
                    value={
                      summary?.coverage?.latest_visit ? (
                        <span className="space-y-1">
                          <span className="block">{formatDate(summary.coverage.latest_visit.visit_date)}</span>
                          <span className="block text-[var(--muted)] capitalize">
                            {summary.coverage.latest_visit.status ?? "planned"}
                            {summary.coverage.latest_visit.primary_outcome
                              ? ` · ${summary.coverage.latest_visit.primary_outcome.replaceAll("_", " ")}`
                              : ""}
                          </span>
                        </span>
                      ) : (
                        "No visit logged"
                      )
                    }
                  />
                  <SummaryRow
                    label="Next planned visit"
                    value={
                      summary?.coverage?.next_planned_visit ? (
                        <span className="space-y-1">
                          <span className="block">{formatDate(summary.coverage.next_planned_visit.visit_date)}</span>
                          <span className="block text-[var(--muted)]">
                            {summary.coverage.next_planned_visit.route?.name ?? "Route pending"}
                            {summary.coverage.next_planned_visit.beat?.name
                              ? ` · ${summary.coverage.next_planned_visit.beat.name}`
                              : ""}
                          </span>
                        </span>
                      ) : (
                        "No planned visit"
                      )
                    }
                  />
                  <SummaryRow
                    label="Coverage notes"
                    value={summary?.coverage?.active_assignment?.notes ?? "Not set"}
                  />
                </CardContent>
              </Card>
            </DetailTabPanel>

            <DetailTabPanel value="activity" rail={customerDetailRail}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>Review the latest invoices and receipts without leaving the customer workspace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--foreground)]">Recent invoices</div>
                      <Link href={`/c/${companyId}/masters/customers/${customerId}/ledger`}>
                        <SecondaryButton type="button" size="sm">Open ledger</SecondaryButton>
                      </Link>
                    </div>
                    {recentInvoices.length ? (
                      <div className="space-y-3">
                        {recentInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <Link
                                  className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-strong)]"
                                  href={`/c/${companyId}/sales/invoices/${invoice.id}`}
                                >
                                  {invoice.invoice_number ?? invoice.id}
                                </Link>
                                <div className="mt-1 text-sm text-[var(--muted)] capitalize">
                                  {invoice.status ?? "draft"} · Issued {formatDate(invoice.issue_date)}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-semibold">{formatMoney(invoice.total)}</div>
                                <div className="text-[var(--muted)]">
                                  Due {formatMoney(invoice.balance_due)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                        No invoice activity yet.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--foreground)]">Recent payments</div>
                      <Link href={`/c/${companyId}/payments`}>
                        <SecondaryButton type="button" size="sm">Open payments</SecondaryButton>
                      </Link>
                    </div>
                    {recentPayments.length ? (
                      <div className="space-y-3">
                        {recentPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-medium capitalize">
                                  {payment.method ?? "Payment"} · {payment.instrument_status ?? "cleared"}
                                </div>
                                <div className="mt-1 text-sm text-[var(--muted)]">
                                  {formatDateTime(payment.payment_date)}
                                  {payment.reference ? ` · Ref ${payment.reference}` : ""}
                                </div>
                                <div className="mt-2 text-sm">
                                  {payment.invoice_id ? (
                                    <Link
                                      className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-strong)]"
                                      href={`/c/${companyId}/sales/invoices/${payment.invoice_id}`}
                                    >
                                      Applied to {payment.invoice_number ?? payment.invoice_id}
                                    </Link>
                                  ) : (
                                    "Unlinked receipt"
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm font-semibold">
                                {formatMoney(payment.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                        No payment activity yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DetailTabPanel>

            <DetailTabPanel value="edit" rail={customerDetailRail}>
              <Card>
                <CardHeader>
                  <CardTitle>Edit customer</CardTitle>
                  <CardDescription>Update master data, commercial controls, and address details from the same screen.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setFormError(null);
                      try {
                        await update.mutateAsync({
                          name: nameValue,
                          email: emailValue || undefined,
                          phone: phoneValue || undefined,
                          gstin: gstinValue || null,
                          state_code: stateCodeValue || null,
                          billing_address: buildAddressPayload(billingAddressValue),
                          shipping_address: buildAddressPayload(shippingAddressValue),
                          pricing_tier: pricingTierValue || null,
                          salesperson_user_id: salespersonValue || null,
                          credit_limit: creditLimitValue || null,
                          credit_days: creditDaysValue ? Number(creditDaysValue) : null,
                          credit_control_mode: creditControlModeValue || null,
                          credit_warning_percent: creditWarningPercentValue || null,
                          credit_block_percent: creditBlockPercentValue || null,
                          credit_hold: creditHoldValue === "true",
                          credit_hold_reason: creditHoldReasonValue || null,
                          credit_override_until: creditOverrideUntilValue || null,
                          credit_override_reason: creditOverrideReasonValue || null,
                        });
                      } catch (error: unknown) {
                        setFormError(getErrorMessage(error, "Failed to update customer"));
                      }
                    }}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField key={`name-${customer.updatedAt ?? "unknown"}`} label="Name" value={nameValue} onChange={(v) => setName(v)} required />
                      <TextField key={`email-${customer.updatedAt ?? "unknown"}`} label="Email" value={emailValue} onChange={(v) => setEmail(v)} type="email" />
                      <TextField label="Phone" value={phoneValue} onChange={(v) => setPhone(v)} />
                      <TextField label="GSTIN" value={gstinValue} onChange={(v) => setGstin(v)} />
                      <TextField label="State code" value={stateCodeValue} onChange={(v) => setStateCode(v)} />
                      <TextField label="Pricing tier" value={pricingTierValue} onChange={(v) => setPricingTier(v)} />
                      <SelectField label="Primary salesperson" value={salespersonValue} onChange={(v) => setSalespersonUserId(v)}>
                        <option value="">Unassigned</option>
                        {salespersonOptions.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name || person.email}
                          </option>
                        ))}
                      </SelectField>
                      <TextField label="Credit limit" value={creditLimitValue} onChange={(v) => setCreditLimit(v)} type="number" />
                      <TextField label="Credit days" value={creditDaysValue} onChange={(v) => setCreditDays(v)} type="number" />
                      <SelectField label="Credit control mode" value={creditControlModeValue} onChange={(v) => setCreditControlMode(v)}>
                        <option value="warn">Warn</option>
                        <option value="block">Block</option>
                      </SelectField>
                      <TextField label="Warning threshold %" value={creditWarningPercentValue} onChange={(v) => setCreditWarningPercent(v)} type="number" />
                      <TextField label="Block threshold %" value={creditBlockPercentValue} onChange={(v) => setCreditBlockPercent(v)} type="number" />
                      <SelectField label="Credit hold" value={creditHoldValue} onChange={(v) => setCreditHold(v)}>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </SelectField>
                      <TextField label="Credit hold reason" value={creditHoldReasonValue} onChange={(v) => setCreditHoldReason(v)} />
                      <TextField label="Override until" value={creditOverrideUntilValue} onChange={(v) => setCreditOverrideUntil(v)} type="date" />
                      <TextField label="Override reason" value={creditOverrideReasonValue} onChange={(v) => setCreditOverrideReason(v)} />
                    </div>

                    <AddressFields prefix="Billing address" value={billingAddressValue} onChange={setBillingAddress} />
                    <AddressFields prefix="Shipping address" value={shippingAddressValue} onChange={setShippingAddress} />

                    {formError ? <InlineError message={formError} /> : null}

                    <div className="flex flex-wrap gap-3">
                      <PrimaryButton type="submit" disabled={update.isPending}>
                        {update.isPending ? "Saving…" : "Save changes"}
                      </PrimaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={del.isPending}
                        onClick={async () => {
                          setFormError(null);
                          const ok = window.confirm("Delete this customer? This cannot be undone.");
                          if (!ok) return;
                          try {
                            await del.mutateAsync();
                            router.replace(`/c/${companyId}/masters/customers`);
                          } catch (error: unknown) {
                            setFormError(getErrorMessage(error, "Failed to delete customer"));
                          }
                        }}
                      >
                        {del.isPending ? "Deleting…" : "Delete"}
                      </SecondaryButton>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </DetailTabPanel>
          </DetailTabs>
        </>
      ) : null}

      {!query.isLoading && !query.isError && !customer ? <EmptyState title="Not found" /> : null}
    </div>
  );
}
