"use client";

import * as React from "react";
import Link from "next/link";

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
  const payload = query.data as
    | {
        data?: Array<Record<string, unknown>>;
        meta?: { total?: number };
        summary?: { by_status?: Record<string, number>; by_provider?: Record<string, number> };
      }
    | undefined;
  const rows = payload?.data ?? [];
  const total = payload?.meta?.total ?? rows.length;
  const summary = payload?.summary as
    | { by_status?: Record<string, number>; by_provider?: Record<string, number> }
    | undefined;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title="Subscriptions"
        subtitle="Inspect provider state, move into remediation workflows, and review plan distribution across tenants."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Active</div><div className="mt-2 text-2xl font-semibold">{summary?.by_status?.active ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Past due</div><div className="mt-2 text-2xl font-semibold">{summary?.by_status?.past_due ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Checkout created</div><div className="mt-2 text-2xl font-semibold">{summary?.by_status?.checkout_created ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Stripe</div><div className="mt-2 text-2xl font-semibold">{summary?.by_provider?.stripe ?? 0}</div></CardContent></Card>
      </div>

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
                <DataTh>Company</DataTh>
                <DataTh>Plan</DataTh>
                <DataTh>Provider</DataTh>
                <DataTh>Status</DataTh>
                <DataTh>Provider ref</DataTh>
                <DataTh>Created</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {rows.map((row, index) => (
                <DataTr key={String(row.id ?? index)}>
                  <DataTd>
                    <Link href={`/admin/subscriptions/${String(row.id)}`} className="font-semibold hover:text-[var(--accent)] hover:underline">
                      {String(row.company_name ?? "—")}
                    </Link>
                    <div className="text-xs text-[var(--muted)]">{String(row.owner_email ?? "—")}</div>
                  </DataTd>
                  <DataTd className="font-semibold">{String(row.plan ?? row.planId ?? row.plan_id ?? "—")}</DataTd>
                  <DataTd>{String(row.provider ?? "—")}</DataTd>
                  <DataTd>
                    <Badge variant={String(row.status ?? "") === "past_due" ? "outline" : "secondary"}>{String(row.status ?? "—")}</Badge>
                  </DataTd>
                  <DataTd className="max-w-[18ch] truncate text-xs text-[var(--muted)]">{String(row.provider_subscription_id ?? "—")}</DataTd>
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
