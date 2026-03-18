"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
