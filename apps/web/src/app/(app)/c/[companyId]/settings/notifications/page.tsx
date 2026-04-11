"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTimeLabel } from "@/lib/format/date";
import {
  useCreateNotificationTemplate,
  useNotificationOutbox,
  useNotificationTemplates,
  useProcessNotifications,
  useRetryNotification,
  useTestNotification,
  useUpdateNotificationTemplate,
} from "@/lib/settings/notificationsHooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { WorkspaceConfigHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type NotificationTemplateRow = {
  id: string;
  code: string;
  channel: string;
  subject?: string | null;
};

type NotificationOutboxRow = {
  id: string;
  template_code?: string | null;
  to_address?: string | null;
  status: string;
  attempts?: number | null;
  updated_at?: string | null;
};

type Props = { params: Promise<{ companyId: string }> };

export default function NotificationsSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const list = useNotificationTemplates(companyId);
  const create = useCreateNotificationTemplate(companyId);
  const update = useUpdateNotificationTemplate(companyId);
  const testNotif = useTestNotification(companyId);
  const outbox = useNotificationOutbox(companyId);
  const processOutbox = useProcessNotifications(companyId);
  const retryNotification = useRetryNotification(companyId);

  const [error, setError] = React.useState<string | null>(null);

  const [code, setCode] = React.useState("");
  const [channel, setChannel] = React.useState("email");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("Hi {{name}},\n\nThis is a test notification.\n");

  const [testTo, setTestTo] = React.useState("");
  const [testTemplateCode, setTestTemplateCode] = React.useState("");
  const [testPayload, setTestPayload] = React.useState('{"name":"Demo User"}');
  const [testError, setTestError] = React.useState<string | null>(null);
  const [testOk, setTestOk] = React.useState<string | null>(null);

  const rows = (list.data ?? []) as NotificationTemplateRow[];
  const outboxRows = (outbox.data ?? []) as NotificationOutboxRow[];
  const firstTemplateCode = rows[0]?.code ?? "";

  const templateColumns = React.useMemo<ColumnDef<NotificationTemplateRow>[]>(
    () => [
      {
        id: "code",
        header: "Template",
        accessorFn: (row) => row.code,
        meta: { label: "Template" },
        cell: ({ row }) => <div className="font-medium text-[var(--foreground)]">{row.original.code}</div>,
      },
      {
        id: "channel",
        header: "Channel",
        accessorFn: (row) => row.channel,
        meta: { label: "Channel" },
        cell: ({ row }) => row.original.channel,
      },
      {
        id: "subject",
        header: "Subject",
        accessorFn: (row) => row.subject ?? "",
        meta: { label: "Subject" },
        cell: ({ row }) => row.original.subject ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        accessorFn: (row) => row.id,
        enableSorting: false,
        meta: { label: "Actions", cellClassName: "text-right" },
        cell: ({ row }) => (
          <SecondaryButton
            type="button"
            disabled={update.isPending}
            onClick={async (event) => {
              event.stopPropagation();
              const newName = window.prompt("Update subject", row.original.subject ?? "");
              if (!newName || !newName.trim()) return;
              try {
                await update.mutateAsync({ templateId: row.original.id, patch: { subject: newName.trim() } });
                toastSuccess("Template updated.");
              } catch (e: unknown) {
                toastError(e, {
                  fallback: "Failed to update template.",
                  context: "notifications-template-update",
                  metadata: { companyId, templateId: row.original.id },
                });
              }
            }}
          >
            Rename
          </SecondaryButton>
        ),
      },
    ],
    [companyId, update],
  );

  const outboxColumns = React.useMemo<ColumnDef<NotificationOutboxRow>[]>(
    () => [
      {
        id: "template",
        header: "Template",
        accessorFn: (row) => row.template_code ?? "Manual",
        meta: { label: "Template" },
        cell: ({ row }) => row.original.template_code ?? "Manual",
      },
      {
        id: "to",
        header: "Recipient",
        accessorFn: (row) => row.to_address ?? "",
        meta: { label: "Recipient" },
        cell: ({ row }) => row.original.to_address ?? "—",
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        meta: { label: "Status" },
        cell: ({ row }) => <Badge variant={row.original.status === "sent" ? "secondary" : "outline"}>{row.original.status}</Badge>,
      },
      {
        id: "attempts",
        header: "Attempts",
        accessorFn: (row) => row.attempts ?? 0,
        meta: { label: "Attempts", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.attempts ?? 0,
      },
      {
        id: "updated",
        header: "Updated",
        accessorFn: (row) => row.updated_at ?? "",
        meta: { label: "Updated" },
        cell: ({ row }) => formatDateTimeLabel(row.original.updated_at),
      },
      {
        id: "actions",
        header: "Actions",
        accessorFn: (row) => row.id,
        enableSorting: false,
        meta: { label: "Actions", cellClassName: "text-right" },
        cell: ({ row }) => (
          <SecondaryButton
            type="button"
            disabled={retryNotification.isPending || row.original.status === "sent"}
            onClick={async (event) => {
              event.stopPropagation();
              try {
                await retryNotification.mutateAsync(row.original.id);
                toastSuccess("Notification retry queued.");
              } catch (e: unknown) {
                toastError(e, {
                  fallback: "Retry failed.",
                  context: "notifications-retry",
                  metadata: { companyId, notificationId: row.original.id },
                });
              }
            }}
          >
            Retry
          </SecondaryButton>
        ),
      },
    ],
    [companyId, retryNotification],
  );

  React.useEffect(() => {
    if (!testTemplateCode && firstTemplateCode) {
      setTestTemplateCode(firstTemplateCode);
    }
  }, [firstTemplateCode, testTemplateCode]);

  return (
    <div className="space-y-7">
      <WorkspaceConfigHero
        eyebrow="Communications"
        title="Notifications"
        subtitle="Manage template definitions, test-send flows, and delivery review from a more structured communications workspace."
        badges={[
          <WorkspaceStatBadge key="templates" label="Templates" value={rows.length} />,
          <WorkspaceStatBadge key="channels" label="Channels" value="Email / SMS / WhatsApp" variant="outline" />,
        ]}
      />

      <WorkspacePanel title="Create template" subtitle="Define reusable outbound message templates for the current company.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} template{rows.length === 1 ? "" : "s"}</Badge>
            <Badge variant="outline">Email / SMS / WhatsApp</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Code" value={code} onChange={setCode} />
            <SelectField
              label="Channel"
              value={channel}
              onChange={setChannel}
              options={[
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
              ]}
            />
          </div>
          <TextField label="Subject (optional)" value={subject} onChange={setSubject} />
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Body</label>
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm shadow-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          {error ? <InlineError message={error} /> : null}
          <PrimaryButton
            type="button"
            disabled={create.isPending}
            onClick={async () => {
              setError(null);
              if (!code.trim()) return setError("Enter a template code.");
              if (!body.trim()) return setError("Enter a template body.");
              try {
                await create.mutateAsync({ code: code.trim(), channel, subject: subject.trim() || undefined, body });
                setCode("");
                setSubject("");
                toastSuccess("Template created.");
              } catch (e: unknown) {
                const message = getErrorMessage(e, "Failed to create template.");
                setError(message);
                toastError(e, {
                  fallback: "Failed to create template.",
                  title: message,
                  context: "notifications-template-create",
                  metadata: { companyId, code: code.trim(), channel },
                });
              }
            }}
          >
            {create.isPending ? "Creating…" : "Create"}
          </PrimaryButton>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Test notification" subtitle="Queue a test notification from an existing template, then process the outbox to validate provider wiring." tone="muted">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Channel"
              value={channel}
              onChange={setChannel}
              options={[
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
              ]}
            />
            <TextField label="To" value={testTo} onChange={setTestTo} placeholder="email/phone" />
          </div>
          <SelectField
            label="Template"
            value={testTemplateCode}
            onChange={setTestTemplateCode}
            options={[
              { value: "", label: "Select template" },
              ...rows.filter((row) => row.channel === channel).map((row) => ({ value: row.code, label: row.code })),
            ]}
          />
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Sample payload JSON</label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm shadow-sm"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
            />
          </div>
          {testError ? <InlineError message={testError} /> : null}
          {testOk ? <div className="text-sm text-green-700">{testOk}</div> : null}
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              disabled={testNotif.isPending}
              onClick={async () => {
                setTestError(null);
                setTestOk(null);
                if (!testTo.trim()) return setTestError("Enter recipient.");
                if (!testTemplateCode.trim()) return setTestError("Select a template.");
                try {
                  const payload = testPayload.trim() ? JSON.parse(testPayload) : {};
                  await testNotif.mutateAsync({
                    channel,
                    to_address: testTo.trim(),
                    template_code: testTemplateCode.trim(),
                    sample_payload: payload,
                  });
                  setTestOk("Queued test notification.");
                  toastSuccess("Test notification queued.");
                  void outbox.refetch();
                } catch (e: unknown) {
                  const message = getErrorMessage(e, "Failed to queue test.");
                  setTestError(message);
                  toastError(e, {
                    fallback: "Failed to queue test.",
                    title: message,
                    context: "notifications-test",
                    metadata: { companyId, channel, templateCode: testTemplateCode },
                  });
                }
              }}
            >
              {testNotif.isPending ? "Queueing…" : "Queue test"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={processOutbox.isPending}
              onClick={async () => {
                setTestError(null);
                setTestOk(null);
                try {
                  await processOutbox.mutateAsync();
                  setTestOk("Processed pending notifications.");
                  toastSuccess("Processed pending notifications.");
                  void outbox.refetch();
                } catch (e: unknown) {
                  const message = getErrorMessage(e, "Failed to process outbox.");
                  setTestError(message);
                  toastError(e, {
                    fallback: "Failed to process outbox.",
                    title: message,
                    context: "notifications-process-outbox",
                    metadata: { companyId },
                  });
                }
              }}
            >
              {processOutbox.isPending ? "Processing…" : "Process outbox"}
            </SecondaryButton>
          </div>
        </div>
      </WorkspacePanel>

      <div className="space-y-3">
        <div className="text-sm font-medium">Templates</div>
        {list.isLoading ? <LoadingBlock label="Loading templates…" /> : null}
        {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load templates")} /> : null}
        {list.data && rows.length === 0 ? <EmptyState title="No templates" hint="Create your first template above." /> : null}

        {list.data && rows.length > 0 ? (
          <WorkspacePanel title="Template catalog" subtitle="Current notification template inventory for the company.">
            <DataGrid
              data={rows}
              columns={templateColumns}
              getRowId={(row) => row.id}
              initialSorting={[{ id: "code", desc: false }]}
              toolbarTitle="Templates"
              toolbarDescription="Review channel coverage and rename template subjects when needed."
            />
          </WorkspacePanel>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Delivery outbox</div>
          <SecondaryButton type="button" onClick={() => void outbox.refetch()}>
            Refresh
          </SecondaryButton>
        </div>
        {outbox.isLoading ? <LoadingBlock label="Loading outbox…" /> : null}
        {outbox.isError ? <InlineError message={getErrorMessage(outbox.error, "Failed to load outbox")} /> : null}
        {outbox.data && outboxRows.length === 0 ? <EmptyState title="No notifications yet" hint="Queued test notifications will appear here." /> : null}
        {outbox.data && outboxRows.length > 0 ? (
          <WorkspacePanel title="Outbox" subtitle="Track delivery attempts, failures, and manual retries from one operations queue.">
            <DataGrid
              data={outboxRows}
              columns={outboxColumns}
              getRowId={(row) => row.id}
              initialSorting={[{ id: "updated", desc: true }]}
              toolbarTitle="Delivery queue"
              toolbarDescription="Queued, failed, and delivered notifications for the current company."
            />
          </WorkspacePanel>
        ) : null}
      </div>
    </div>
  );
}
