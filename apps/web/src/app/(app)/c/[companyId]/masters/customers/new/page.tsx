"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useCreateCustomer } from "@/lib/masters/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

export default function NewCustomerPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateCustomer({ companyId: companyId });
  const salespeople = useCompanySalespeople(companyId);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [pricingTier, setPricingTier] = React.useState("");
  const [salespersonUserId, setSalespersonUserId] = React.useState("");
  const [creditLimit, setCreditLimit] = React.useState("");
  const [creditDays, setCreditDays] = React.useState("");
  const [creditControlMode, setCreditControlMode] = React.useState("warn");
  const [creditWarningPercent, setCreditWarningPercent] = React.useState("80");
  const [creditBlockPercent, setCreditBlockPercent] = React.useState("100");
  const [creditHold, setCreditHold] = React.useState("false");
  const [creditHoldReason, setCreditHoldReason] = React.useState("");
  const [creditOverrideUntil, setCreditOverrideUntil] = React.useState("");
  const [creditOverrideReason, setCreditOverrideReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const salespersonOptions = Array.isArray(salespeople.data?.data)
    ? salespeople.data.data
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="New customer" subtitle="Create a customer record." />

      <form
        className="rounded-xl border bg-white p-4 space-y-4 max-w-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const res = await create.mutateAsync({
              name,
              email: email || undefined,
              phone: phone || undefined,
              pricing_tier: pricingTier || undefined,
              salesperson_user_id: salespersonUserId || undefined,
              credit_limit: creditLimit || undefined,
              credit_days: creditDays ? Number(creditDays) : undefined,
              credit_control_mode: creditControlMode || undefined,
              credit_warning_percent: creditWarningPercent || undefined,
              credit_block_percent: creditBlockPercent || undefined,
              credit_hold: creditHold === "true",
              credit_hold_reason: creditHoldReason || undefined,
              credit_override_until: creditOverrideUntil || undefined,
              credit_override_reason: creditOverrideReason || undefined,
            });
            router.replace(`/c/${companyId}/masters/customers/${res.data.id}`);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string"
                ? ((e as { message?: unknown }).message as string)
                : "Failed to create customer";
            setError(message);
          }
        }}
      >
        <TextField label="Name" value={name} onChange={setName} required />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Phone" value={phone} onChange={setPhone} />
        <TextField label="Pricing tier" value={pricingTier} onChange={setPricingTier} placeholder="Optional commercial tier" />
        <SelectField label="Primary salesperson" value={salespersonUserId} onChange={setSalespersonUserId}>
          <option value="">Unassigned</option>
          {salespersonOptions.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name || person.email}
            </option>
          ))}
        </SelectField>
        <TextField label="Credit limit" value={creditLimit} onChange={setCreditLimit} type="number" />
        <TextField label="Credit days" value={creditDays} onChange={setCreditDays} type="number" />
        <SelectField label="Credit control mode" value={creditControlMode} onChange={setCreditControlMode}>
          <option value="warn">Warn</option>
          <option value="block">Block</option>
        </SelectField>
        <TextField label="Warning threshold %" value={creditWarningPercent} onChange={setCreditWarningPercent} type="number" />
        <TextField label="Block threshold %" value={creditBlockPercent} onChange={setCreditBlockPercent} type="number" />
        <SelectField label="Credit hold" value={creditHold} onChange={setCreditHold}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </SelectField>
        <TextField label="Credit hold reason" value={creditHoldReason} onChange={setCreditHoldReason} />
        <TextField label="Override until" value={creditOverrideUntil} onChange={setCreditOverrideUntil} type="date" />
        <TextField label="Override reason" value={creditOverrideReason} onChange={setCreditOverrideReason} />

        {error ? <InlineError message={error} /> : null}

        <PrimaryButton type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create"}
        </PrimaryButton>
      </form>
    </div>
  );
}
