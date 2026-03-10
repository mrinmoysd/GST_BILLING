"use client";

import Link from "next/link";
import * as React from "react";

import { useCustomers } from "@/lib/masters/hooks";
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

type CustomerRow = { id: string; name: string; email?: string | null; phone?: string | null };

export default function CustomersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const query = useCustomers({ companyId, q });
  // Backend returns shape inside ApiEnvelope: { data: Customer[]; meta: {...} }
  // ApiClient returns ApiEnvelope<T>, so here query.data?.data is the *array*.
  const customers: CustomerRow[] = Array.isArray(query.data?.data)
    ? (query.data.data as CustomerRow[])
    : [];
  const total =
    (query.data?.meta as { total?: number } | undefined)?.total ?? customers.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Search, create, and manage customers."
        actions={
          <Link href={`/c/${companyId}/masters/customers/new`}>
            <SecondaryButton type="button">New customer</SecondaryButton>
          </Link>
        }
      />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Name / email / phone" />
          <div className="text-xs text-neutral-500">{total} total</div>
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading customers…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load customers")} />
      ) : null}

  {!query.isLoading && !query.isError && customers.length === 0 ? (
        <EmptyState title="No customers yet" hint="Create your first customer to start invoicing." />
      ) : null}

  {customers.length > 0 ? (
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
              {customers.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      className="underline"
                      href={`/c/${companyId}/masters/customers/${c.id}`}
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
