"use client";

import * as React from "react";

import { useAdminAuditLogs } from "@/lib/admin/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { SelectField, TextField } from "@/lib/ui/form";

type AuditRow = {
  id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  actor?: { id?: string | null; email?: string | null; name?: string | null; role?: string | null } | null;
  company?: { id: string; name: string; gstin?: string | null } | null;
};

export default function AdminAuditLogsPage() {
  const [q, setQ] = React.useState("");
  const [action, setAction] = React.useState("");
  const query = useAdminAuditLogs({ page: 1, limit: 100, q: q || undefined, action: action || undefined });
  const rows = React.useMemo(
    () => ((query.data?.data as AuditRow[] | undefined) ?? []),
    [query.data],
  );

  const uniqueActions = React.useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.action))).sort();
  }, [rows]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Governance"
        title="Audit logs"
        subtitle="Review privileged changes across tenant lifecycle, billing operations, support actions, and internal admin management."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} event{rows.length === 1 ? "" : "s"} in view</Badge>
            <Badge variant="outline">{action || "All actions"}</Badge>
          </div>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by summary, actor email, or target id, then narrow by action family.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_280px]">
          <TextField label="Search" value={q} onChange={setQ} placeholder="summary, email, target id" />
          <div>
            <SelectField label="Action" value={action} onChange={setAction}>
              <option value="">All actions</option>
              {uniqueActions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading audit logs..." /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load audit logs")} /> : null}

      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Privileged action history</CardTitle>
            <CardDescription>This view is backed by the dedicated internal admin audit table.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>When</DataTh>
                    <DataTh>Actor</DataTh>
                    <DataTh>Action</DataTh>
                    <DataTh>Target</DataTh>
                    <DataTh>Company</DataTh>
                    <DataTh>Summary</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((row) => (
                    <DataTr key={row.id}>
                      <DataTd className="whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</DataTd>
                      <DataTd>
                        <div className="font-medium">{row.actor?.name || row.actor?.email || "Unknown actor"}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {row.actor?.email || "—"} · {row.actor?.role || "—"}
                        </div>
                      </DataTd>
                      <DataTd>
                        <Badge variant="outline">{row.action}</Badge>
                      </DataTd>
                      <DataTd>
                        <div className="font-medium">{row.target_type}</div>
                        <div className="text-xs text-[var(--muted)]">{row.target_id || "—"}</div>
                      </DataTd>
                      <DataTd>
                        {row.company ? (
                          <>
                            <div className="font-medium">{row.company.name}</div>
                            <div className="text-xs text-[var(--muted)]">{row.company.gstin || "No GSTIN"}</div>
                          </>
                        ) : (
                          <span className="text-[var(--muted)]">Global action</span>
                        )}
                      </DataTd>
                      <DataTd>
                        <div className="font-medium">{row.summary}</div>
                        {row.metadata ? (
                          <div className="mt-1 text-xs text-[var(--muted)]">{JSON.stringify(row.metadata)}</div>
                        ) : null}
                      </DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
