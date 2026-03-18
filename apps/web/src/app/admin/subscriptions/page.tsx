"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useAdminSubscriptions } from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = React.useState("");
  const query = useAdminSubscriptions({ status: status || undefined, page: 1, limit: 50 });
  const rows = (query.data?.data as unknown as { data?: Array<Record<string, unknown>>; meta?: { total?: number } })?.data ?? [];
  const total = (query.data?.data as unknown as { meta?: { total?: number } })?.meta?.total ?? rows.length;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Admin" title="Subscriptions" subtitle="Review subscription records with cleaner filters and table structure." />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Status</label>
              <select className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past due</option>
              </select>
            </div>
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading subscriptions…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load subscriptions")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No subscriptions" hint="Try a different filter." /> : null}

      {query.data && rows.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Plan</DataTh>
                <DataTh>Provider</DataTh>
                <DataTh>Status</DataTh>
                <DataTh>Created</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {rows.map((row, index) => (
                <DataTr key={String(row.id ?? index)}>
                  <DataTd className="font-semibold">{String(row.plan ?? row.planId ?? row.plan_id ?? "—")}</DataTd>
                  <DataTd>{String(row.provider ?? "—")}</DataTd>
                  <DataTd>
                    <Badge variant="secondary">{String(row.status ?? "—")}</Badge>
                  </DataTd>
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
