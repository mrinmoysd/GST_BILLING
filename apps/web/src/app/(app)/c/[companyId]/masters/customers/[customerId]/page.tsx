"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomer, useDeleteCustomer, useUpdateCustomer } from "@/lib/masters/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
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
  const [formError, setFormError] = React.useState<string | null>(null);

  const nameValue = name ?? query.data?.data?.name ?? "";
  const emailValue = email ?? query.data?.data?.email ?? "";
  const phoneValue = phone ?? query.data?.data?.phone ?? "";
  const pricingTierValue =
    pricingTier ??
    query.data?.data?.pricingTier ??
    query.data?.data?.pricing_tier ??
    "";
  const salespersonValue =
    salespersonUserId ??
    query.data?.data?.salespersonUserId ??
    query.data?.data?.salesperson_user_id ??
    "";
  const creditLimitValue =
    creditLimit ??
    String(query.data?.data?.creditLimit ?? query.data?.data?.credit_limit ?? "");
  const creditDaysValue =
    creditDays ??
    String(query.data?.data?.creditDays ?? query.data?.data?.credit_days ?? "");
  const creditControlModeValue =
    creditControlMode ??
    query.data?.data?.creditControlMode ??
    query.data?.data?.credit_control_mode ??
    "warn";
  const creditWarningPercentValue =
    creditWarningPercent ??
    String(query.data?.data?.creditWarningPercent ?? query.data?.data?.credit_warning_percent ?? "80");
  const creditBlockPercentValue =
    creditBlockPercent ??
    String(query.data?.data?.creditBlockPercent ?? query.data?.data?.credit_block_percent ?? "100");
  const creditHoldValue =
    creditHold ??
    String(query.data?.data?.creditHold ?? query.data?.data?.credit_hold ?? false);
  const creditHoldReasonValue =
    creditHoldReason ??
    query.data?.data?.creditHoldReason ??
    query.data?.data?.credit_hold_reason ??
    "";
  const creditOverrideUntilValue =
    creditOverrideUntil ??
    (query.data?.data?.creditOverrideUntil ?? query.data?.data?.credit_override_until ?? "")?.slice(0, 10);
  const creditOverrideReasonValue =
    creditOverrideReason ??
    query.data?.data?.creditOverrideReason ??
    query.data?.data?.credit_override_reason ??
    "";
  const salespersonOptions = Array.isArray(salespeople.data?.data)
    ? salespeople.data.data
    : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Customer"
        subtitle="Manage profile details and move into the customer ledger from a cleaner detail workspace."
        actions={
          <div className="flex gap-3">
            <Link className="text-sm underline" href={`/c/${companyId}/masters/customers`}>
              Back
            </Link>
            <Link
              className="text-sm underline"
              href={`/c/${companyId}/masters/customers/${customerId}/ledger`}
            >
              Ledger
            </Link>
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading customer…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load customer")} />
      ) : null}
      {query.data ? (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Customer profile</Badge>
              <CardTitle>{query.data.data.name}</CardTitle>
              <CardDescription>Reference id: <code>{customerId}</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Email</div>
                <div className="mt-2 text-sm font-medium">{query.data.data.email ?? "Not set"}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Phone</div>
                <div className="mt-2 text-sm font-medium">{query.data.data.phone ?? "Not set"}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Salesperson</div>
                <div className="mt-2 text-sm font-medium">
                  {query.data.data.salesperson?.name ?? query.data.data.salesperson?.email ?? "Unassigned"}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Pricing tier</div>
                <div className="mt-2 text-sm font-medium">{pricingTierValue || "Not set"}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Credit policy</div>
                <div className="mt-2 space-y-1 text-sm font-medium">
                  <div>Limit: {creditLimitValue || "Not set"}</div>
                  <div>Days: {creditDaysValue || "Not set"}</div>
                  <div>Mode: {creditControlModeValue}</div>
                  <div>Hold: {creditHoldValue === "true" ? "Yes" : "No"}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">
                Customer detail pages will later gain invoice summaries and richer ledger jump-offs. This pass upgrades the layout and action clarity first.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit customer</CardTitle>
              <CardDescription>Update profile fields and keep the directory accurate for billing.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormError(null);
                  try {
                    await update.mutateAsync({
                      name: nameValue,
                      email: emailValue || undefined,
                      phone: phoneValue || undefined,
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
                  } catch (e: unknown) {
                    setFormError(getErrorMessage(e, "Failed to update customer"));
                  }
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    key={`name-${query.data?.data?.updatedAt ?? "unknown"}`}
                    label="Name"
                    value={nameValue}
                    onChange={(v) => setName(v)}
                    required
                  />
                  <TextField
                    key={`email-${query.data?.data?.updatedAt ?? "unknown"}`}
                    label="Email"
                    value={emailValue}
                    onChange={(v) => setEmail(v)}
                    type="email"
                  />
                  <TextField
                    key={`phone-${query.data?.data?.updatedAt ?? "unknown"}`}
                    label="Phone"
                    value={phoneValue}
                    onChange={(v) => setPhone(v)}
                  />
                  <TextField
                    key={`pricing-tier-${query.data?.data?.updatedAt ?? "unknown"}`}
                    label="Pricing tier"
                    value={pricingTierValue}
                    onChange={(v) => setPricingTier(v)}
                  />
                  <SelectField
                    label="Primary salesperson"
                    value={salespersonValue}
                    onChange={(v) => setSalespersonUserId(v)}
                  >
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
                      } catch (e: unknown) {
                        setFormError(getErrorMessage(e, "Failed to delete customer"));
                      }
                    }}
                  >
                    {del.isPending ? "Deleting…" : "Delete"}
                  </SecondaryButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {!query.isLoading && !query.isError && !query.data ? (
        <EmptyState title="Not found" />
      ) : null}
    </div>
  );
}
