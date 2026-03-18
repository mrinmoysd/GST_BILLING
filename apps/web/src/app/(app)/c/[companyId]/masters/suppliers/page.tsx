"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Suppliers"
        subtitle="Maintain suppliers, contacts, and purchasing relationships in one consistent list layout."
        actions={
          <Link href={`/c/${companyId}/masters/suppliers/new`}>
            <SecondaryButton type="button">New supplier</SecondaryButton>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <TextField label="Search suppliers" value={q} onChange={setQ} placeholder="Name / email / phone" />
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading suppliers…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load suppliers")} />
      ) : null}

  {!query.isLoading && !query.isError && suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          hint="Create your first supplier to start tracking purchases and payables."
          action={
            <Link href={`/c/${companyId}/masters/suppliers/new`}>
              <SecondaryButton type="button">Create supplier</SecondaryButton>
            </Link>
          }
        />
      ) : null}

  {suppliers.length > 0 ? (
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
              {suppliers.map((s) => (
                <DataTr key={s.id}>
                  <DataTd>
                    <Link
                      className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                      href={`/c/${companyId}/masters/suppliers/${s.id}`}
                    >
                      {s.name}
                    </Link>
                  </DataTd>
                  <DataTd>{s.email ?? "—"}</DataTd>
                  <DataTd>{s.phone ?? "—"}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
