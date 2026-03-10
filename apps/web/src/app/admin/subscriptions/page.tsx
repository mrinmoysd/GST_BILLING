"use client";

import * as React from "react";

import { useAdminSubscriptions } from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = React.useState("");
  const query = useAdminSubscriptions({ status: status || undefined, page: 1, limit: 50 });
  const rows = (query.data?.data as unknown as { data?: Array<Record<string, unknown>> })?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin — Subscriptions" subtitle="Subscription records" />

      <div className="rounded-xl border bg-white p-4 max-w-xl">
        <label className="block text-sm font-medium">Status</label>
        <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past due</option>
        </select>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading subscriptions…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load subscriptions")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No subscriptions" hint="Try a different filter." /> : null}

      {query.data && rows.length > 0 ? (
        <div className="rounded-xl border bg-white p-4">
          <pre className="text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
