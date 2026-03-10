"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useCreateCustomer } from "@/lib/masters/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

export default function NewCustomerPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateCustomer({ companyId: companyId });

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

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

        {error ? <InlineError message={error} /> : null}

        <PrimaryButton type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create"}
        </PrimaryButton>
      </form>
    </div>
  );
}
