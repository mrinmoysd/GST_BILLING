"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useAdminUsage } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { DateField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel, WorkspaceSection } from "@/lib/ui/workspace";

type UsagePayload = {
  data?: {
    summary?: {
      companies?: number;
      active_subscriptions?: number;
      meter_keys?: number;
      totals_by_key?: Record<string, number>;
      estimated_mrr_inr?: number;
      subscriptions_by_plan?: Record<string, number>;
      subscriptions_by_provider?: Record<string, number>;
    };
    meters?: Array<{ id: string; key: string; value: string | number }>;
    top_companies?: Array<{
      id: string;
      name: string;
      activity_score: number;
      invoices_count: number;
      purchases_count: number;
      users_count: number;
    }>;
  };
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminUsagePage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useAdminUsage({ from: from || undefined, to: to || undefined });
  const response = query.data as UsagePayload | undefined;
  const data = response?.data;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Admin"
        title="Usage"
        subtitle="Review platform activity, subscriptions, and meter rollups through a denser operations surface instead of a generic admin report."
      />
      <WorkspaceFilterBar>
        <div className="grid max-w-2xl gap-4 md:grid-cols-2">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>
      </WorkspaceFilterBar>
      {query.isLoading ? <LoadingBlock label="Loading usage…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load usage")} /> : null}
      {query.data ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Companies" value={data?.summary?.companies ?? 0} tone="quiet" />
            <StatCard label="Active subs" value={data?.summary?.active_subscriptions ?? 0} tone="quiet" />
            <StatCard label="Meter keys" value={data?.summary?.meter_keys ?? 0} tone="quiet" />
            <StatCard label="Estimated MRR" value={`INR ${(data?.summary?.estimated_mrr_inr ?? 0).toLocaleString("en-IN")}`} tone="strong" />
          </div>
          <WorkspacePanel title="Usage summary" subtitle="Platform rollup based on stored usage meters and subscription state." tone="muted">
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.summary?.totals_by_key ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
              {Object.entries(data?.summary?.subscriptions_by_plan ?? {}).map(([key, value]) => (
                <Badge key={`plan-${key}`} variant="secondary">
                  plan {key}: {value}
                </Badge>
              ))}
              {Object.entries(data?.summary?.subscriptions_by_provider ?? {}).map(([key, value]) => (
                <Badge key={`provider-${key}`} variant="outline">
                  provider {key}: {value}
                </Badge>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspaceSection eyebrow="Adoption" title="Top companies" subtitle="Highest activity tenants in the current platform footprint.">
              <DataTableShell className="shadow-none">
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Company</DataTh>
                      <DataTh>Activity</DataTh>
                      <DataTh>Invoices</DataTh>
                      <DataTh>Purchases</DataTh>
                      <DataTh>Users</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {(data?.top_companies ?? []).map((company) => (
                      <DataTr key={company.id}>
                        <DataTd className="font-medium">{company.name}</DataTd>
                        <DataTd>{company.activity_score}</DataTd>
                        <DataTd>{company.invoices_count}</DataTd>
                        <DataTd>{company.purchases_count}</DataTd>
                        <DataTd>{company.users_count}</DataTd>
                      </DataTr>
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
          </WorkspaceSection>
        </div>
      ) : null}
    </div>
  );
}
