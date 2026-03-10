"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useCustomer, useDeleteCustomer, useUpdateCustomer } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

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

  const [name, setName] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const nameValue = name ?? query.data?.data?.name ?? "";
  const emailValue = email ?? query.data?.data?.email ?? "";
  const phoneValue = phone ?? query.data?.data?.phone ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer"
        subtitle={
          <span>
            <code>{customerId}</code>
          </span>
        }
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
        <div className="rounded-xl border bg-white p-4 space-y-4 max-w-xl">
          <div className="text-lg font-semibold">{query.data.data.name}</div>

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              try {
                await update.mutateAsync({
                  name: nameValue,
                  email: emailValue || undefined,
                  phone: phoneValue || undefined,
                });
              } catch (e: unknown) {
                setFormError(getErrorMessage(e, "Failed to update customer"));
              }
            }}
          >
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

            {formError ? <InlineError message={formError} /> : null}

            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save"}
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
        </div>
      ) : null}
      {!query.isLoading && !query.isError && !query.data ? (
        <EmptyState title="Not found" />
      ) : null}
    </div>
  );
}
