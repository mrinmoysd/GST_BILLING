"use client";

import { useAdminQueueMetrics } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminQueuesPage() {
  const query = useAdminQueueMetrics();

  return (
    <div className="space-y-6">
      <PageHeader title="Admin — Queues" subtitle="Queue metrics (auto-refreshes)." />
      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load queue metrics")} /> : null}
      {query.data ? (
        <div className="rounded-xl border bg-white p-4">
          <pre className="text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
