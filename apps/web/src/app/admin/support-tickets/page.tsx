"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { adminApiClient } from "@/lib/admin/api-client";
import { useAdminSupportTickets } from "@/lib/admin/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTimeLabel } from "@/lib/format/date";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { PrimaryButton, SecondaryButton, SelectField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueRowStateBadge, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

export default function AdminSupportTicketsPage() {
  const [status, setStatus] = React.useState<string>("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const query = useAdminSupportTickets({ status: status || undefined, page: 1, limit: 50 });

  const rows = React.useMemo(
    () =>
      (query.data?.data as unknown as {
      data?: Array<{
        id: string;
        email?: string | null;
        name?: string | null;
        subject?: string | null;
        message?: string;
        status?: string;
        priority?: string;
        created_at?: string;
        assignee?: string | null;
        internal_note?: string | null;
        company_id?: string | null;
        company_name?: string | null;
      }>;
    })?.data ?? [],
    [query.data?.data],
  );

  const [selectedTicketId, setSelectedTicketId] = React.useState("");

  React.useEffect(() => {
    if (!rows.length) {
      setSelectedTicketId("");
      return;
    }
    if (!selectedTicketId || !rows.some((row) => row.id === selectedTicketId)) {
      setSelectedTicketId(rows[0]?.id ?? "");
    }
  }, [rows, selectedTicketId]);

  const selectedTicket = rows.find((row) => row.id === selectedTicketId) ?? rows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        tone="admin"
        eyebrow="Support ops"
        title="Support tickets"
        subtitle="Review inbound support requests and move them through the current status flow."
        badges={[
          <WorkspaceStatBadge key="visible" label="In view" value={rows.length} />,
          <WorkspaceStatBadge key="status" label="Filter" value={status || "All statuses"} variant="outline" />,
        ]}
      />

      <QueueToolbar
        filters={
          <div className="grid gap-3 md:grid-cols-[1fr_200px] md:items-end">
          <div>
            <SelectField label="Filter by status" value={status} onChange={setStatus}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </SelectField>
          </div>
          <div className="flex gap-2">
            <SecondaryButton
              type="button"
              onClick={() => {
                setError(null);
                query.refetch();
              }}
            >
              Refresh
            </SecondaryButton>
            <PrimaryButton type="button" disabled={busyId === "__filter__"} onClick={() => query.refetch()}>
              Apply
            </PrimaryButton>
          </div>
          </div>
        }
        summary={<Badge variant="secondary">{rows.length} ticket{rows.length === 1 ? "" : "s"} in view</Badge>}
      />

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load support tickets")} /> : null}

      {error ? <InlineError message={error} /> : null}

      {query.data && rows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected ticket"
              title={selectedTicket?.subject || "(no subject)"}
              subtitle="Keep ticket context, ownership, and company linkage visible while working the queue."
            >
              {selectedTicket ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <QueueRowStateBadge label={selectedTicket.status || "—"} />
                    <QueueRowStateBadge label={selectedTicket.priority || "—"} variant="outline" />
                  </div>
                  <QueueMetaList
                    items={[
                      { label: "From", value: selectedTicket.email || selectedTicket.name || "—" },
                      { label: "Created", value: formatDateTimeLabel(selectedTicket.created_at ?? null) },
                      { label: "Assignee", value: selectedTicket.assignee || "No assignee" },
                      { label: "Company", value: selectedTicket.company_name || "Unlinked" },
                    ]}
                  />
                  <WorkspacePanel title="Request" subtitle="Latest visible support message." tone="muted">
                    <div className="text-sm leading-6 text-[var(--muted-strong)]">{selectedTicket.message || "No message body."}</div>
                  </WorkspacePanel>
                </>
              ) : null}
            </QueueInspector>
          }
        >
          <WorkspacePanel title="Ticket queue" subtitle="Review request details and update status in place.">
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Created</DataTh>
                    <DataTh>From</DataTh>
                    <DataTh>Subject</DataTh>
                    <DataTh>Status</DataTh>
                    <DataTh>Priority</DataTh>
                    <DataTh>Company</DataTh>
                    <DataTh>Ops note</DataTh>
                    <DataTh className="text-right">Actions</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((t) => (
                    <DataTr
                      key={t.id}
                      className={selectedTicket?.id === t.id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                      onClick={() => setSelectedTicketId(t.id)}
                    >
                      <DataTd className="whitespace-nowrap">{formatDateTimeLabel(t.created_at ?? null)}</DataTd>
                      <DataTd>
                    <div className="font-medium">{t.name || "—"}</div>
                    <div className="text-xs text-[var(--muted)]">{t.email || "—"}</div>
                      </DataTd>
                      <DataTd>
                    <div className="font-medium">{t.subject || "(no subject)"}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{t.message || ""}</div>
                      </DataTd>
                      <DataTd>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs">{t.status || "—"}</span>
                      </DataTd>
                      <DataTd>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs">{t.priority || "—"}</span>
                      </DataTd>
                      <DataTd>
                        {t.company_id ? (
                          <Link href={`/admin/companies/${t.company_id}`} className="font-medium hover:text-[var(--accent)] hover:underline">
                            {t.company_name || "Linked company"}
                          </Link>
                        ) : (
                          <span className="text-[var(--muted)]">Unlinked</span>
                        )}
                      </DataTd>
                      <DataTd>
                        <div className="text-xs text-[var(--muted)]">{t.assignee ? `Assignee: ${t.assignee}` : "No assignee"}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{t.internal_note || "No internal note"}</div>
                      </DataTd>
                      <DataTd className="text-right">
                    <div className="inline-flex gap-2">
                      <SecondaryButton
                        type="button"
                        disabled={busyId === t.id}
                        onClick={async () => {
                          try {
                            setError(null);
                            setBusyId(t.id);
                            await adminApiClient.patch(`/admin/support-tickets/${t.id}`, {
                              status: "in_progress",
                              assignee: "operations_admin",
                              internal_note: "Picked up for triage",
                            });
                            await query.refetch();
                          } catch (e: unknown) {
                            setError(getErrorMessage(e, "Failed to update ticket"));
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        In progress
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={busyId === t.id}
                        onClick={async () => {
                          try {
                            setError(null);
                            setBusyId(t.id);
                            await adminApiClient.patch(`/admin/support-tickets/${t.id}`, {
                              status: "resolved",
                              internal_note: "Resolved from admin support workspace",
                            });
                            await query.refetch();
                          } catch (e: unknown) {
                            setError(getErrorMessage(e, "Failed to update ticket"));
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Resolve
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={busyId === t.id}
                        onClick={async () => {
                          try {
                            setError(null);
                            setBusyId(t.id);
                            await adminApiClient.patch(`/admin/support-tickets/${t.id}`, {
                              status: "closed",
                              internal_note: "Closed from admin support workspace",
                            });
                            await query.refetch();
                          } catch (e: unknown) {
                            setError(getErrorMessage(e, "Failed to update ticket"));
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Close
                      </SecondaryButton>
                    </div>
                      </DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </WorkspacePanel>
        </QueueShell>
      ) : null}

      {query.data && rows.length === 0 ? (
        <WorkspacePanel title="Ticket queue" subtitle="No support tickets found." tone="muted">
          <div className="text-sm text-[var(--muted)]">Try a different status filter or refresh the current result set.</div>
        </WorkspacePanel>
      ) : null}
    </div>
  );
}
