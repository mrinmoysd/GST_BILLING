"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminQueueMetrics } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type QueueMetricsPayload = {
  data?: {
    queues?: { pdf?: { name: string; counts: Record<string, number> } };
    export_jobs?: Record<string, number>;
    notification_outbox?: Record<string, number>;
    webhook_events?: Record<string, number>;
    file_storage?: Record<string, number>;
    recent_failures?: {
      export_jobs?: Array<{ id: string; type: string; company_name: string; error?: string | null; created_at: string }>;
      notifications?: Array<{ id: string; channel: string; company_name: string; error?: string | null; created_at: string }>;
      webhooks?: Array<{ id: string; provider: string; event_type: string; error?: string | null; received_at: string }>;
    };
  };
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminQueuesPage() {
  const query = useAdminQueueMetrics();
  const response = query.data as QueueMetricsPayload | undefined;
  const data = response?.data;
  const pdfCounts = data?.queues?.pdf?.counts ?? {};

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
        <>
        <div className="grid gap-4 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle>PDF queue</CardTitle>
              <CardDescription>Live BullMQ counters for invoice PDF generation.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(pdfCounts).map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {key}: {value}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Export jobs</CardTitle>
              <CardDescription>Database-level status rollup for GST and report exports.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(data?.export_jobs ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notification outbox</CardTitle>
              <CardDescription>Delivery queue status across queued, sent, and failed notifications.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(data?.notification_outbox ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Webhook events</CardTitle>
              <CardDescription>Provider webhook status rollup.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(data?.webhook_events ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>File storage</CardTitle>
              <CardDescription>Stored file distribution by backend.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(data?.file_storage ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Failed exports</CardTitle>
              <CardDescription>Recent export failures requiring investigation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recent_failures?.export_jobs ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold">{item.type}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{item.company_name} · {new Date(item.created_at).toLocaleString()}</div>
                  <div className="mt-2 text-xs text-[#7e3128]">{item.error || "Export failure"}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Failed notifications</CardTitle>
              <CardDescription>Recent notification delivery failures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recent_failures?.notifications ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold">{item.channel}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{item.company_name} · {new Date(item.created_at).toLocaleString()}</div>
                  <div className="mt-2 text-xs text-[#7e3128]">{item.error || "Notification failure"}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Failed webhooks</CardTitle>
              <CardDescription>Recent provider webhook failures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recent_failures?.webhooks ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold">{item.provider}: {item.event_type}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{new Date(item.received_at).toLocaleString()}</div>
                  <div className="mt-2 text-xs text-[#7e3128]">{item.error || "Webhook failure"}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        </>
      ) : null}
    </div>
  );
}
