"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useAdminCompanies } from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar, QueueRowStateBadge } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminCompaniesPage() {
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState("");
  const query = useAdminCompanies({ q: q || undefined, page: 1, limit: 50 });
  const payload = query.data as
    | { data?: Array<Record<string, unknown>>; meta?: { total?: number } }
    | undefined;

  const rows = React.useMemo(() => payload?.data ?? [], [payload]);
  const total = payload?.meta?.total ?? rows.length;
  const counts = React.useMemo(() => {
    const suspended = rows.filter((row) => String(row.admin_status ?? "active") === "suspended").length;
    const active = rows.filter((row) => String(row.admin_status ?? "active") !== "suspended").length;
    return { all: rows.length, active, suspended };
  }, [rows]);
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const status = String(row.admin_status ?? "active");
      if (segment === "suspended") return status === "suspended";
      if (segment === "active") return status !== "suspended";
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedCompanyId("");
      return;
    }
    if (!selectedCompanyId || !filteredRows.some((row) => String(row.id) === selectedCompanyId)) {
      setSelectedCompanyId(String(filteredRows[0]?.id ?? ""));
    }
  }, [filteredRows, selectedCompanyId]);

  const selectedRow = filteredRows.find((row) => String(row.id) === selectedCompanyId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        tone="admin"
        eyebrow="Tenant list"
        title="Companies"
        subtitle="Monitor tenant companies, move into lifecycle operations, and keep the company list as the primary admin control plane."
        badges={[
          <WorkspaceStatBadge key="companies" label="Companies" value={total} />,
          <WorkspaceStatBadge key="view" label="View" value={q ? "Filtered" : "All"} variant="outline" />,
        ]}
        actions={
          <PrimaryButton asChild>
            <Link href="/admin/companies/new">New company</Link>
          </PrimaryButton>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All companies", count: counts.all },
          { id: "active", label: "Active", count: counts.active },
          { id: "suspended", label: "Suspended", count: counts.suspended },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full roster" },
              { id: "active", label: "Healthy tenants" },
              { id: "suspended", label: "Intervention" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={<TextField label="Search companies" value={q} onChange={setQ} placeholder="Name / GSTIN" />}
        summary={<Badge variant="secondary">{total} total</Badge>}
      />

      {query.isLoading ? <LoadingBlock label="Loading companies…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load companies")} /> : null}
      {query.data && filteredRows.length === 0 ? <EmptyState title="No companies" hint="Try a different query." /> : null}

      {query.data && filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected company"
              title={String(selectedRow?.name ?? "Select company")}
              subtitle="Keep owner, status, and usage posture visible while the main table stays tuned for admin scanning."
            >
              {selectedRow ? (
                <>
                  <QueueRowStateBadge label={String(selectedRow.admin_status ?? "active")} />
                  <QueueMetaList
                    items={[
                      { label: "Owner", value: String(selectedRow.owner_name ?? "—") },
                      { label: "Owner email", value: String(selectedRow.owner_email ?? "—") },
                      { label: "GSTIN", value: String(selectedRow.gstin ?? "—") },
                      { label: "Business type", value: String(selectedRow.businessType ?? selectedRow.business_type ?? "—") },
                    ]}
                  />
                </>
              ) : null}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Name</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Owner</DataTh>
                  <DataTh>GSTIN</DataTh>
                  <DataTh>Business type</DataTh>
                  <DataTh>Usage</DataTh>
                  <DataTh>Created</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <DataTr
                    key={String(row.id ?? index)}
                    className={selectedRow?.id === row.id ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedCompanyId(String(row.id))}
                  >
                    <DataTd className="font-semibold">
                      <Link href={`/admin/companies/${String(row.id)}`} className="hover:text-[var(--accent)] hover:underline">
                        {String(row.name ?? "—")}
                      </Link>
                    </DataTd>
                    <DataTd>
                      <Badge variant={String(row.admin_status ?? "active") === "suspended" ? "outline" : "secondary"}>
                        {String(row.admin_status ?? "active")}
                      </Badge>
                    </DataTd>
                    <DataTd>
                      <div className="font-medium">{String(row.owner_name ?? "—")}</div>
                      <div className="text-xs text-[var(--muted)]">{String(row.owner_email ?? "—")}</div>
                    </DataTd>
                    <DataTd>{String(row.gstin ?? "—")}</DataTd>
                    <DataTd>{String(row.businessType ?? row.business_type ?? "—")}</DataTd>
                    <DataTd>
                      <div>{String(row.users_count ?? 0)} users</div>
                      <div className="text-xs text-[var(--muted)]">
                        {String(row.invoices_count ?? 0)} invoices · {String(row.purchases_count ?? 0)} purchases
                      </div>
                    </DataTd>
                    <DataTd>{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : "—"}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </QueueShell>
      ) : null}
    </div>
  );
}
