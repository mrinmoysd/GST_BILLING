"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

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
    <div className="space-y-6">
      <PageHeader
        title="Supplier"
        subtitle={
          <span>
            <code>{resolved.supplierId}</code>
          </span>
        }
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
        <div className="rounded-xl border bg-white p-4 space-y-4 max-w-xl">
          <div className="text-lg font-semibold">{query.data.data.name}</div>

          <form
            className="space-y-3"
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
            <TextField label="Name" value={name} onChange={setName} required />
            <TextField label="Email" value={email} onChange={setEmail} type="email" />
            <TextField label="Phone" value={phone} onChange={setPhone} />

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
        </div>
      ) : null}
      {!query.isLoading && !query.isError && !query.data ? (
        <EmptyState title="Not found" />
      ) : null}
    </div>
  );
}
