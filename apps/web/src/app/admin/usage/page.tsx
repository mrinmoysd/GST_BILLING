"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useAdminUsage } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

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
      <PageHeader
        eyebrow="Admin"
        title="Usage"
        subtitle="Review the current usage summary payload across a configurable date range."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Select the time range for the current usage summary.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>
      {query.isLoading ? <LoadingBlock label="Loading usage…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load usage")} /> : null}
      {query.data ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Companies</div><div className="mt-2 text-2xl font-semibold">{data?.summary?.companies ?? 0}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Active subs</div><div className="mt-2 text-2xl font-semibold">{data?.summary?.active_subscriptions ?? 0}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Meter keys</div><div className="mt-2 text-2xl font-semibold">{data?.summary?.meter_keys ?? 0}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Estimated MRR</div><div className="mt-2 text-2xl font-semibold">INR {(data?.summary?.estimated_mrr_inr ?? 0).toLocaleString("en-IN")}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Usage summary</CardTitle>
              <CardDescription>Platform rollup based on stored usage meters and subscription state.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top companies</CardTitle>
              <CardDescription>Highest activity tenants in the current platform footprint.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
