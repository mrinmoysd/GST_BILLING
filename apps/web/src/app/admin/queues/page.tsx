"use client";

import { Badge } from "@/components/ui/badge";
import { useAdminQueueMetrics } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { formatDateTimeLabel } from "@/lib/format/date";
import { WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

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


export default function AdminQueuesPage() {
  const query = useAdminQueueMetrics();
  const response = query.data as QueueMetricsPayload | undefined;
  const data = response?.data;
  const pdfCounts = data?.queues?.pdf?.counts ?? {};

  return (
    <div className="space-y-7">
      <WorkspaceHero
        tone="admin"
        eyebrow="Operations"
        title="Queues"
        subtitle="Monitor background jobs, delivery failures, storage posture, and provider-side event health from one platform operations surface."
        badges={[
          <WorkspaceStatBadge key="pdf" label="PDF jobs" value={Object.values(pdfCounts).reduce((sum, value) => sum + Number(value ?? 0), 0)} />,
          <WorkspaceStatBadge key="exports" label="Export signals" value={Object.keys(data?.export_jobs ?? {}).length} variant="outline" />,
        ]}
      />
      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load queue metrics")} /> : null}
      {query.data ? (
        <>
        <WorkspaceSection eyebrow="Health bands" title="Current queue posture" subtitle="Start with the queue and outbox rollups, then move into recent failed items for intervention.">
        <div className="grid gap-4 xl:grid-cols-5">
          <WorkspacePanel title="PDF queue" subtitle="Live BullMQ counters for invoice PDF generation.">
            <div className="flex flex-wrap gap-2">
              {Object.entries(pdfCounts).map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Export jobs" subtitle="Database-level status rollup for GST and report exports.">
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.export_jobs ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Notification outbox" subtitle="Delivery queue status across queued, sent, and failed notifications.">
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.notification_outbox ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Webhook events" subtitle="Provider webhook status rollup.">
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.webhook_events ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="File storage" subtitle="Stored file distribution by backend." tone="muted">
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.file_storage ?? {}).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </WorkspacePanel>
        </div>
        </WorkspaceSection>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <WorkspacePanel title="Failed exports" subtitle="Recent export failures requiring investigation.">
            <div className="space-y-3">
              {(data?.recent_failures?.export_jobs ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold">{item.type}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{item.company_name} · {formatDateTimeLabel(item.created_at)}</div>
                  <div className="mt-2 text-xs text-[#7e3128]">{item.error || "Export failure"}</div>
                </div>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Failed notifications" subtitle="Recent notification delivery failures.">
            <div className="space-y-3">
              {(data?.recent_failures?.notifications ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold">{item.channel}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{item.company_name} · {formatDateTimeLabel(item.created_at)}</div>
                  <div className="mt-2 text-xs text-[#7e3128]">{item.error || "Notification failure"}</div>
                </div>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Failed webhooks" subtitle="Recent provider webhook failures." tone="muted">
            <div className="space-y-3">
              {(data?.recent_failures?.webhooks ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold">{item.provider}: {item.event_type}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{formatDateTimeLabel(item.received_at)}</div>
                  <div className="mt-2 text-xs text-[#7e3128]">{item.error || "Webhook failure"}</div>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>
        </>
      ) : null}
    </div>
  );
}
