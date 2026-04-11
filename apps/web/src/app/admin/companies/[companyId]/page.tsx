"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useAdminCompany, useUpdateAdminCompanyLifecycle } from "@/lib/admin/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";
import { formatDateTimeLabel } from "@/lib/format/date";
import { WorkspaceDetailHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = {
  params: Promise<{ companyId: string }>;
};


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
      <WorkspaceDetailHero
        eyebrow="Tenant detail"
        title={company?.name ?? "Company workspace"}
        subtitle="Review owner identity, GST readiness, subscription context, tenant health, and lifecycle controls."
        badges={[
          <WorkspaceStatBadge key="lifecycle" label="Lifecycle" value={company?.lifecycle?.status ?? "active"} />,
          <WorkspaceStatBadge key="subscription" label="Plan" value={company?.subscription?.plan ?? "—"} variant="outline" />,
        ]}
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
          <WorkspaceSection eyebrow="Overview" title="Status and footprint" subtitle="Read lifecycle, identity, billing, and usage signals before taking action.">
          <div className="grid gap-4 xl:grid-cols-4">
            <WorkspacePanel title="Status" subtitle="Current admin lifecycle state.">
              <div className="space-y-2">
                <Badge variant={isSuspended ? "outline" : "secondary"}>{company.lifecycle?.status ?? "active"}</Badge>
                <div className="text-sm text-[var(--muted)]">{company.lifecycle?.note ?? "No admin note recorded."}</div>
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="Owner" subtitle="Primary company operator.">
              <div className="space-y-1 text-sm">
                <div className="font-medium">{company.owner?.name ?? "—"}</div>
                <div className="text-[var(--muted)]">{company.owner?.email ?? "—"}</div>
                <div className="text-xs text-[var(--muted)]">Last login: {formatDateTimeLabel(company.owner?.last_login ?? null, "Never")}</div>
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="GST" subtitle="Identity and verification state.">
              <div className="space-y-1 text-sm">
                <div>GSTIN: {company.gstin ?? "—"}</div>
                <div>PAN: {company.pan ?? "—"}</div>
                <div className="text-[var(--muted)]">Verification: {company.gst_verification?.status ?? "not_started"}</div>
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="Subscription" subtitle="Most recent billing state.">
              <div className="space-y-1 text-sm">
                <div>Plan: {company.subscription?.plan ?? "—"}</div>
                <div>Status: {company.subscription?.status ?? "—"}</div>
                <div className="text-[var(--muted)]">Provider: {company.subscription?.provider ?? "—"}</div>
              </div>
            </WorkspacePanel>
          </div>
          </WorkspaceSection>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <WorkspacePanel title="Health snapshot" subtitle="Operational volume and tenant footprint.">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(company.health ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{key.replace(/_/g, " ")}</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</div>
                  </div>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Company profile" subtitle="Core setup values for the tenant." tone="muted">
              <div className="space-y-2 text-sm">
                <div>Business type: {company.business_type ?? "—"}</div>
                <div>State: {company.state ?? "—"} {company.state_code ? `(${company.state_code})` : ""}</div>
                <div>Timezone: {company.timezone ?? "—"}</div>
                <div>Created: {formatDateTimeLabel(company.created_at ?? null)}</div>
              </div>
            </WorkspacePanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <WorkspacePanel title="Users" subtitle="Current company users and access posture.">
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
                          <DataTd>{formatDateTimeLabel(user.last_login ?? null, "Never")}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
            </WorkspacePanel>

            <WorkspacePanel title="Recent activity" subtitle="Most recent document and payment events for the tenant." tone="muted">
                <div className="space-y-3">
                  {(company.recent_activity ?? []).map((item) => (
                    <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold capitalize">{item.type}: {item.label}</div>
                          <div className="text-xs text-[var(--muted)]">
                            {item.status} · {formatDateTimeLabel(item.created_at)}
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
            </WorkspacePanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
