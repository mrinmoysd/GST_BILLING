"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteSupplier, useSupplier, useUpdateSupplier } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string; supplierId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SupplierDetailPage({ params }: Props) {
  const resolved = React.use(params);
  const router = useRouter();
  const query = useSupplier({ companyId: resolved.companyId, supplierId: resolved.supplierId });
  const update = useUpdateSupplier({ companyId: resolved.companyId, supplierId: resolved.supplierId });
  const del = useDeleteSupplier({ companyId: resolved.companyId, supplierId: resolved.supplierId });

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!query.data) return;
    setName(query.data.data.name ?? "");
    setEmail(query.data.data.email ?? "");
    setPhone(query.data.data.phone ?? "");
  }, [query.data]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Supplier"
        subtitle="Maintain supplier contact details and jump into the payable ledger from a cleaner detail page."
        actions={
          <div className="flex gap-3">
            <Link className="text-sm underline" href={`/c/${resolved.companyId}/masters/suppliers`}>
              Back
            </Link>
            <Link
              className="text-sm underline"
              href={`/c/${resolved.companyId}/masters/suppliers/${resolved.supplierId}/ledger`}
            >
              Ledger
            </Link>
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading supplier…" /> : null}
      {query.isError ? (
  <InlineError message={getErrorMessage(query.error, "Failed to load supplier")} />
      ) : null}
      {query.data ? (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Supplier profile</Badge>
              <CardTitle>{query.data.data.name}</CardTitle>
              <CardDescription>Reference id: <code>{resolved.supplierId}</code></CardDescription>
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
                Supplier detail pages will later expand into purchase summaries and payable insights. This pass focuses on stronger structure and editing clarity.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit supplier</CardTitle>
              <CardDescription>Update supplier details before new purchases or payment runs.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormError(null);
                  try {
                    await update.mutateAsync({
                      name,
                      email: email || null,
                      phone: phone || null,
                    });
                  } catch (e: unknown) {
                    setFormError(getErrorMessage(e, "Failed to update supplier"));
                  }
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Name" value={name} onChange={setName} required />
                  <TextField label="Email" value={email} onChange={setEmail} type="email" />
                  <TextField label="Phone" value={phone} onChange={setPhone} />
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
                      const ok = window.confirm("Delete this supplier? This cannot be undone.");
                      if (!ok) return;
                      try {
                        await del.mutateAsync();
                        router.replace(`/c/${resolved.companyId}/masters/suppliers`);
                      } catch (e: unknown) {
                        setFormError(getErrorMessage(e, "Failed to delete supplier"));
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
