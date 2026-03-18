"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Customers"
        subtitle="Search, create, and manage your customer directory with a cleaner, operational list view."
        actions={
          <Link href={`/c/${companyId}/masters/customers/new`}>
            <SecondaryButton type="button">New customer</SecondaryButton>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <TextField label="Search customers" value={q} onChange={setQ} placeholder="Name / email / phone" />
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading customers…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load customers")} />
      ) : null}

  {!query.isLoading && !query.isError && customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          hint="Create your first customer to start invoicing and tracking receivables."
          action={
            <Link href={`/c/${companyId}/masters/customers/new`}>
              <SecondaryButton type="button">Create customer</SecondaryButton>
            </Link>
          }
        />
      ) : null}

  {customers.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Name</DataTh>
                <DataTh>Email</DataTh>
                <DataTh>Phone</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {customers.map((c) => (
                <DataTr key={c.id}>
                  <DataTd>
                    <Link
                      className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                      href={`/c/${companyId}/masters/customers/${c.id}`}
                    >
                      {c.name}
                    </Link>
                  </DataTd>
                  <DataTd>{c.email ?? "—"}</DataTd>
                  <DataTd>{c.phone ?? "—"}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
