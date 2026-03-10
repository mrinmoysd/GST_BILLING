"use client";

import * as React from "react";

import {
  useCreateInvoiceSeries,
  useDeleteInvoiceSeries,
  useInvoiceSeries,
  useUpdateInvoiceSeries,
} from "@/lib/settings/invoiceSeriesHooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function InvoiceSeriesSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const list = useInvoiceSeries(companyId);
  const create = useCreateInvoiceSeries(companyId);
  const update = useUpdateInvoiceSeries(companyId);
  const del = useDeleteInvoiceSeries(companyId);

  const [code, setCode] = React.useState("");
  const [prefix, setPrefix] = React.useState("INV-");
  const [nextNumber, setNextNumber] = React.useState("1");
  const [error, setError] = React.useState<string | null>(null);

  const rows = list.data?.data.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Invoice series" subtitle="Numbering configuration." />

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Create series</div>
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Code" value={code} onChange={setCode} placeholder="DEFAULT" />
          <TextField label="Prefix" value={prefix} onChange={setPrefix} placeholder="INV-" />
          <TextField label="Next number" value={nextNumber} onChange={setNextNumber} type="number" />
        </div>
        {error ? <InlineError message={error} /> : null}
        <PrimaryButton
          type="button"
          disabled={create.isPending}
          onClick={async () => {
            setError(null);
            if (!code.trim()) return setError("Code is required");
            const nn = Number(nextNumber);
            if (!Number.isFinite(nn) || nn < 1) return setError("Next number must be >= 1");
            try {
              await create.mutateAsync({ code: code.trim(), prefix: prefix.trim() || undefined, next_number: nn, is_active: true });
              setCode("");
              setNextNumber("1");
            } catch (e: unknown) {
              setError(getErrorMessage(e, "Failed to create"));
            }
          }}
        >
          {create.isPending ? "Creating…" : "Create"}
        </PrimaryButton>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Series</div>
        {list.isLoading ? <LoadingBlock label="Loading series…" /> : null}
        {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load series")} /> : null}
        {list.data && rows.length === 0 ? <EmptyState title="No series" hint="Create one above. (DEFAULT typically exists from seed.)" /> : null}

        {list.data && rows.length > 0 ? (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Prefix</th>
                  <th className="text-left px-4 py-3 font-medium">Next</th>
                  <th className="text-left px-4 py-3 font-medium">Active</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-3">{s.prefix ?? "—"}</td>
                    <td className="px-4 py-3">{s.nextNumber}</td>
                    <td className="px-4 py-3">{s.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 space-x-2">
                      <SecondaryButton
                        type="button"
                        disabled={update.isPending}
                        onClick={async () => {
                          const newPrefix = window.prompt("Prefix", s.prefix ?? "");
                          if (newPrefix === null) return;
                          try {
                            await update.mutateAsync({ seriesId: s.id, patch: { prefix: newPrefix } });
                          } catch (e: unknown) {
                            window.alert(getErrorMessage(e, "Failed to update"));
                          }
                        }}
                      >
                        Edit prefix
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={del.isPending}
                        onClick={async () => {
                          if (!window.confirm("Delete this series?")) return;
                          try {
                            await del.mutateAsync(s.id);
                          } catch (e: unknown) {
                            window.alert(getErrorMessage(e, "Failed to delete"));
                          }
                        }}
                      >
                        Delete
                      </SecondaryButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
