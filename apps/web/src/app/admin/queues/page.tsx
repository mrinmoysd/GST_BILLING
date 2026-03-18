"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title="Queues"
        subtitle="Monitor background queue metrics from a clearer operational screen."
      />
      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load queue metrics")} /> : null}
      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Queue metrics payload</CardTitle>
            <CardDescription>Current backend metrics response. This remains generic until queue-specific cards are introduced.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{JSON.stringify(query.data.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
