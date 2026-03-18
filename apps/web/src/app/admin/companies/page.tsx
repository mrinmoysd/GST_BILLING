"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useAdminCompanies } from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminCompaniesPage() {
  const [q, setQ] = React.useState("");
  const query = useAdminCompanies({ q: q || undefined, page: 1, limit: 50 });

  const rows = (query.data?.data as unknown as { data?: Array<Record<string, unknown>>; meta?: { total?: number } })?.data ?? [];
  const total = (query.data?.data as unknown as { meta?: { total?: number } })?.meta?.total ?? rows.length;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Admin" title="Companies" subtitle="Monitor tenant companies on the platform with a clearer operational table." />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <TextField label="Search companies" value={q} onChange={setQ} placeholder="Name / GSTIN" />
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading companies…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load companies")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No companies" hint="Try a different query." /> : null}

      {query.data && rows.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Name</DataTh>
                <DataTh>GSTIN</DataTh>
                <DataTh>Business type</DataTh>
                <DataTh>Created</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {rows.map((row, index) => (
                <DataTr key={String(row.id ?? index)}>
                  <DataTd className="font-semibold">{String(row.name ?? "—")}</DataTd>
                  <DataTd>{String(row.gstin ?? "—")}</DataTd>
                  <DataTd>{String(row.businessType ?? row.business_type ?? "—")}</DataTd>
                  <DataTd>{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : "—"}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
