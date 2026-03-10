"use client";

import * as React from "react";

import { useCreateLedger, useLedgers } from "@/lib/billing/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function LedgersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const query = useLedgers(companyId);
  const create = useCreateLedger(companyId);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const rows = query.data?.data ?? [];

  return (
  <div className="space-y-6">
      <PageHeader title="Ledgers" subtitle="Create and manage ledgers." />

      <div className="rounded-xl border bg-white p-4 space-y-3 max-w-2xl">
        <div className="text-sm font-medium">Create ledger</div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Type (optional)" value={type} onChange={setType} placeholder="ASSET / LIABILITY / INCOME / EXPENSE" />
        </div>
        {error ? <InlineError message={error} /> : null}
        <PrimaryButton
          type="button"
          disabled={create.isPending}
          onClick={async () => {
            setError(null);
            if (!name.trim()) return setError("Enter a ledger name.");
            try {
              await create.mutateAsync({ name: name.trim(), type: type.trim() || undefined });
              setName("");
              setType("");
            } catch (e: unknown) {
              setError(getErrorMessage(e, "Failed to create ledger"));
            }
          }}
        >
          {create.isPending ? "Creating…" : "Create"}
        </PrimaryButton>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading ledgers…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load ledgers")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No ledgers" hint="Create a ledger to start posting journals." /> : null}

      {query.data && rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3">{l.name}</td>
                  <td className="px-4 py-3">{l.type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
