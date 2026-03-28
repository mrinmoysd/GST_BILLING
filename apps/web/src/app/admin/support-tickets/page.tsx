"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApiClient } from "@/lib/admin/api-client";
import { useAdminSupportTickets } from "@/lib/admin/hooks";
import { getErrorMessage } from "@/lib/errors";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { PrimaryButton, SecondaryButton, SelectField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

export default function AdminSupportTicketsPage() {
  const [status, setStatus] = React.useState<string>("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const query = useAdminSupportTickets({ status: status || undefined, page: 1, limit: 50 });

  const rows =
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
    })?.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title="Support tickets"
        subtitle="Review inbound support requests and move them through the current status flow."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} ticket{rows.length === 1 ? "" : "s"} in view</Badge>
            <Badge variant="outline">{status || "All statuses"}</Badge>
          </div>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status and refresh the current result set.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load support tickets")} /> : null}

      {error ? <InlineError message={error} /> : null}

      {query.data && rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ticket queue</CardTitle>
            <CardDescription>Review request details and update status in place.</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <DataTr key={t.id}>
                      <DataTd className="whitespace-nowrap">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</DataTd>
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
          </CardContent>
        </Card>
      ) : null}

      {query.data && rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--muted)]">No support tickets found.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
