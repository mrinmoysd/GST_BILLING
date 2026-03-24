"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useAdminSubscriptions } from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SelectField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

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
      <WorkspaceHero
        tone="admin"
        eyebrow="Billing list"
        title="Subscriptions"
        subtitle="Inspect provider state, move into remediation workflows, and keep subscription oversight in a denser billing control plane."
        badges={[
          <WorkspaceStatBadge key="subscriptions" label="Subscriptions" value={total} />,
          <WorkspaceStatBadge key="filter" label="Status" value={status || "All"} variant="outline" />,
        ]}
      />

      <WorkspaceSection
        eyebrow="Overview"
        title="Subscription pressure"
        subtitle="Use the KPI strip to read current billing mix before drilling into individual tenant subscriptions."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active" value={summary?.by_status?.active ?? 0} />
          <StatCard label="Past due" value={summary?.by_status?.past_due ?? 0} tone="quiet" />
          <StatCard label="Checkout created" value={summary?.by_status?.checkout_created ?? 0} tone="quiet" />
          <StatCard label="Stripe" value={summary?.by_provider?.stripe ?? 0} />
        </div>
      </WorkspaceSection>

      <WorkspaceFilterBar summary={<Badge variant="secondary">{total} total</Badge>}>
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "trial", label: "Trial" },
            { value: "canceled", label: "Canceled" },
            { value: "past_due", label: "Past due" },
          ]}
        />
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading subscriptions…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load subscriptions")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No subscriptions" hint="Try a different filter." /> : null}

      {query.data && rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Billing plane"
          title="Subscriptions in view"
          subtitle="The table is the primary remediation and drill-in surface for plan, provider, and billing status review."
        >
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
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
