"use client";

import * as React from "react";

import { useAdminSupportTickets } from "@/lib/admin/hooks";
import { apiClient } from "@/lib/api/client";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

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
      }>;
    })?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin — Support tickets" subtitle="Review and update ticket status." />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px] md:items-end">
          <div>
            <label className="block text-sm font-medium">Filter by status</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
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
      </div>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load support tickets")} /> : null}

      {error ? <InlineError message={error} /> : null}

      {query.data && rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Priority</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.name || "—"}</div>
                    <div className="text-xs text-neutral-600">{t.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.subject || "(no subject)"}</div>
                    <div className="mt-1 text-xs text-neutral-600 line-clamp-2">{t.message || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border px-2 py-0.5 text-xs">{t.status || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border px-2 py-0.5 text-xs">{t.priority || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <SecondaryButton
                        type="button"
                        disabled={busyId === t.id}
                        onClick={async () => {
                          try {
                            setError(null);
                            setBusyId(t.id);
                            await apiClient.patch(`/admin/support-tickets/${t.id}`, { status: "in_progress" });
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
                            await apiClient.patch(`/admin/support-tickets/${t.id}`, { status: "resolved" });
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
                            await apiClient.patch(`/admin/support-tickets/${t.id}`, { status: "closed" });
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {query.data && rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-neutral-600">No support tickets found.</div>
      ) : null}
    </div>
  );
}
