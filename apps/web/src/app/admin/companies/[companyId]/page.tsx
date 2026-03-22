"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCompany, useUpdateAdminCompanyLifecycle } from "@/lib/admin/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";

type Props = {
  params: Promise<{ companyId: string }>;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminCompanyDetailPage({ params }: Props) {
  const { companyId } = React.use(params);
  const query = useAdminCompany(companyId);
  const lifecycle = useUpdateAdminCompanyLifecycle(companyId);
  const [error, setError] = React.useState<string | null>(null);

  const company = query.data?.data as
    | {
        id: string;
        name: string;
        gstin?: string | null;
        pan?: string | null;
        business_type?: string | null;
        state?: string | null;
        state_code?: string | null;
        timezone?: string | null;
        created_at?: string;
        lifecycle?: { status?: string; note?: string | null; updated_at?: string | null };
        gst_verification?: { status?: string; note?: string | null };
        owner?: { email?: string | null; name?: string | null; last_login?: string | null };
        users?: Array<{ id: string; email: string; name?: string | null; role: string; is_active: boolean; last_login?: string | null }>;
        subscription?: { plan?: string | null; status?: string | null; provider?: string | null; expires_at?: string | null } | null;
        health?: Record<string, number>;
        recent_activity?: Array<{ id: string; type: string; label: string; status: string; amount: number; created_at: string }>;
      }
    | undefined;

  const isSuspended = company?.lifecycle?.status === "suspended";

  async function runLifecycle(action: "suspend" | "reactivate") {
    try {
      setError(null);
      await lifecycle.mutateAsync({ action });
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to update company status"));
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title={company?.name ?? "Company workspace"}
        subtitle="Review owner identity, GST readiness, subscription context, tenant health, and lifecycle controls."
        actions={
          <div className="flex flex-wrap gap-3">
            <SecondaryButton asChild type="button">
              <Link href="/admin/companies">Back</Link>
            </SecondaryButton>
            {isSuspended ? (
              <PrimaryButton type="button" disabled={lifecycle.isPending} onClick={() => void runLifecycle("reactivate")}>
                {lifecycle.isPending ? "Updating..." : "Reactivate company"}
              </PrimaryButton>
            ) : (
              <SecondaryButton type="button" disabled={lifecycle.isPending} onClick={() => void runLifecycle("suspend")}>
                {lifecycle.isPending ? "Updating..." : "Suspend company"}
              </SecondaryButton>
            )}
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading company workspace..." /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load company")} /> : null}
      {error ? <InlineError message={error} /> : null}

      {company ? (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Current admin lifecycle state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={isSuspended ? "outline" : "secondary"}>{company.lifecycle?.status ?? "active"}</Badge>
                <div className="text-sm text-[var(--muted)]">{company.lifecycle?.note ?? "No admin note recorded."}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Owner</CardTitle>
                <CardDescription>Primary company operator.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-medium">{company.owner?.name ?? "—"}</div>
                <div className="text-[var(--muted)]">{company.owner?.email ?? "—"}</div>
                <div className="text-xs text-[var(--muted)]">Last login: {company.owner?.last_login ? new Date(company.owner.last_login).toLocaleString() : "Never"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>GST</CardTitle>
                <CardDescription>Identity and verification state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>GSTIN: {company.gstin ?? "—"}</div>
                <div>PAN: {company.pan ?? "—"}</div>
                <div className="text-[var(--muted)]">Verification: {company.gst_verification?.status ?? "not_started"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Most recent billing state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>Plan: {company.subscription?.plan ?? "—"}</div>
                <div>Status: {company.subscription?.status ?? "—"}</div>
                <div className="text-[var(--muted)]">Provider: {company.subscription?.provider ?? "—"}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Health snapshot</CardTitle>
                <CardDescription>Operational volume and tenant footprint.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(company.health ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{key.replace(/_/g, " ")}</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company profile</CardTitle>
                <CardDescription>Core setup values for the tenant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>Business type: {company.business_type ?? "—"}</div>
                <div>State: {company.state ?? "—"} {company.state_code ? `(${company.state_code})` : ""}</div>
                <div>Timezone: {company.timezone ?? "—"}</div>
                <div>Created: {company.created_at ? new Date(company.created_at).toLocaleString() : "—"}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Current company users and access posture.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTableShell className="shadow-none">
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>User</DataTh>
                        <DataTh>Role</DataTh>
                        <DataTh>Status</DataTh>
                        <DataTh>Last login</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(company.users ?? []).map((user) => (
                        <DataTr key={user.id}>
                          <DataTd>
                            <div className="font-medium">{user.name ?? "—"}</div>
                            <div className="text-xs text-[var(--muted)]">{user.email}</div>
                          </DataTd>
                          <DataTd>{user.role}</DataTd>
                          <DataTd>
                            <Badge variant={user.is_active ? "secondary" : "outline"}>
                              {user.is_active ? "active" : "inactive"}
                            </Badge>
                          </DataTd>
                          <DataTd>{user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Most recent document and payment events for the tenant.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(company.recent_activity ?? []).map((item) => (
                    <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold capitalize">{item.type}: {item.label}</div>
                          <div className="text-xs text-[var(--muted)]">
                            {item.status} · {new Date(item.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm font-medium">INR {item.amount.toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  ))}
                  {(company.recent_activity ?? []).length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No recent operational activity yet.</div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
