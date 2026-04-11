"use client";

import * as React from "react";

import { useAdminAuditLogs } from "@/lib/admin/hooks";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTimeLabel } from "@/lib/format/date";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { SelectField, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueRowStateBadge, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

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
  const [selectedLogId, setSelectedLogId] = React.useState("");

  React.useEffect(() => {
    if (!rows.length) {
      setSelectedLogId("");
      return;
    }
    if (!selectedLogId || !rows.some((row) => row.id === selectedLogId)) {
      setSelectedLogId(rows[0]?.id ?? "");
    }
  }, [rows, selectedLogId]);

  const selectedRow = rows.find((row) => row.id === selectedLogId) ?? rows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        tone="admin"
        eyebrow="Governance"
        title="Audit logs"
        subtitle="Review privileged changes across tenant lifecycle, billing operations, support actions, and internal admin management."
        badges={[
          <WorkspaceStatBadge key="events" label="Events" value={rows.length} />,
          <WorkspaceStatBadge key="action" label="Action filter" value={action || "All actions"} variant="outline" />,
        ]}
      />

      <QueueToolbar
        filters={<div className="grid gap-4 md:grid-cols-[1fr_280px]">
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
        </div>}
        summary={<Badge variant="secondary">{rows.length} event{rows.length === 1 ? "" : "s"} in view</Badge>}
      />

      {query.isLoading ? <LoadingBlock label="Loading audit logs..." /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load audit logs")} /> : null}

      {rows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected event"
              title={selectedRow?.action ?? "Audit event"}
              subtitle="Use the inspector to review actor identity, tenant scope, and raw metadata while scanning the event stream."
            >
              {selectedRow ? (
                <>
                  <QueueRowStateBadge label={selectedRow.action} variant="outline" />
                  <QueueMetaList
                    items={[
                      { label: "When", value: formatDateTimeLabel(selectedRow.created_at) },
                      { label: "Actor", value: selectedRow.actor?.name || selectedRow.actor?.email || "Unknown actor" },
                      { label: "Target", value: `${selectedRow.target_type}${selectedRow.target_id ? ` · ${selectedRow.target_id}` : ""}` },
                      { label: "Company", value: selectedRow.company?.name || "Global action" },
                    ]}
                  />
                  <WorkspacePanel title="Summary" subtitle="Recorded privileged action summary." tone="muted">
                    <div className="space-y-2 text-sm text-[var(--muted-strong)]">
                      <div>{selectedRow.summary}</div>
                      {selectedRow.metadata ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 font-mono text-xs">{JSON.stringify(selectedRow.metadata, null, 2)}</div> : null}
                    </div>
                  </WorkspacePanel>
                </>
              ) : null}
            </QueueInspector>
          }
        >
          <WorkspacePanel title="Privileged action history" subtitle="This view is backed by the dedicated internal admin audit table.">
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
                    <DataTr
                      key={row.id}
                      className={selectedRow?.id === row.id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                      onClick={() => setSelectedLogId(row.id)}
                    >
                      <DataTd className="whitespace-nowrap">{formatDateTimeLabel(row.created_at)}</DataTd>
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
          </WorkspacePanel>
        </QueueShell>
      ) : null}
    </div>
  );
}
