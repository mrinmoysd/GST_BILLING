"use client";

import Link from "next/link";
import * as React from "react";

import { useSuppliers } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type Props = { params: Promise<{ companyId: string }> };

export default function SuppliersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const query = useSuppliers({ companyId: companyId, q });
  const suppliers = Array.isArray(query.data?.data) ? query.data.data : [];
  const total =
    (query.data?.meta as { total?: number } | undefined)?.total ?? suppliers.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        subtitle="Search, create, and manage suppliers."
        actions={
          <Link href={`/c/${companyId}/masters/suppliers/new`}>
            <SecondaryButton type="button">New supplier</SecondaryButton>
          </Link>
        }
      />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Name / email / phone" />
          <div className="text-xs text-neutral-500">{total} total</div>
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading suppliers…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load suppliers")} />
      ) : null}

  {!query.isLoading && !query.isError && suppliers.length === 0 ? (
        <EmptyState title="No suppliers yet" hint="Create your first supplier to record purchases." />
      ) : null}

  {suppliers.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      className="underline"
                      href={`/c/${companyId}/masters/suppliers/${s.id}`}
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.email ?? "—"}</td>
                  <td className="px-4 py-3">{s.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
