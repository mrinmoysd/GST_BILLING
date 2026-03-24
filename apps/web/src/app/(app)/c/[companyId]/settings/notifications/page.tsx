"use client";

import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateNotificationTemplate,
  useNotificationOutbox,
  useNotificationTemplates,
  useProcessNotifications,
  useRetryNotification,
  useTestNotification,
  useUpdateNotificationTemplate,
} from "@/lib/settings/notificationsHooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

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

  const rows = list.data?.data.data ?? [];
  const outboxRows = outbox.data?.data.data ?? [];
  const firstTemplateCode = rows[0]?.code ?? "";

  React.useEffect(() => {
    if (!testTemplateCode && firstTemplateCode) {
      setTestTemplateCode(firstTemplateCode);
    }
  }, [firstTemplateCode, testTemplateCode]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Notifications"
        subtitle="Manage template definitions and test-send flows from a more structured communications workspace."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} template{rows.length === 1 ? "" : "s"}</Badge>
            <Badge variant="outline">Email / SMS / WhatsApp</Badge>
          </div>
          <CardTitle>Create template</CardTitle>
          <CardDescription>Define reusable outbound message templates for the current company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                toast.success("Template created");
              } catch (e: unknown) {
                const message = getErrorMessage(e, "Failed to create template");
                setError(message);
                toast.error(message);
              }
            }}
          >
            {create.isPending ? "Creating…" : "Create"}
          </PrimaryButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test notification</CardTitle>
          <CardDescription>Queue a test notification from an existing template, then process the outbox to validate provider wiring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  toast.success("Test notification queued");
                  void outbox.refetch();
                } catch (e: unknown) {
                  const message = getErrorMessage(e, "Failed to queue test");
                  setTestError(message);
                  toast.error(message);
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
                  toast.success("Processed pending notifications");
                  void outbox.refetch();
                } catch (e: unknown) {
                  const message = getErrorMessage(e, "Failed to process outbox");
                  setTestError(message);
                  toast.error(message);
                }
              }}
            >
              {processOutbox.isPending ? "Processing…" : "Process outbox"}
            </SecondaryButton>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="text-sm font-medium">Templates</div>
        {list.isLoading ? <LoadingBlock label="Loading templates…" /> : null}
        {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load templates")} /> : null}
        {list.data && rows.length === 0 ? <EmptyState title="No templates" hint="Create your first template above." /> : null}

        {list.data && rows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Current notification template catalog for the company.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Name</DataTh>
                      <DataTh>Channel</DataTh>
                      <DataTh>Actions</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {rows.map((t) => (
                      <DataTr key={t.id}>
                        <DataTd>{t.code}</DataTd>
                        <DataTd>{t.channel}</DataTd>
                        <DataTd>
                      <SecondaryButton
                        type="button"
                        disabled={update.isPending}
                        onClick={async () => {
                          const newName = window.prompt("Update subject", t.subject ?? "");
                          if (!newName || !newName.trim()) return;
                          try {
                            await update.mutateAsync({ templateId: t.id, patch: { subject: newName.trim() } });
                            toast.success("Template updated");
                          } catch (e: unknown) {
                            toast.error(getErrorMessage(e, "Failed to update template"));
                          }
                        }}
                      >
                        Rename
                      </SecondaryButton>
                        </DataTd>
                      </DataTr>
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Outbox</CardTitle>
              <CardDescription>Track delivery attempts, failures, and manual retries.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Template</DataTh>
                      <DataTh>To</DataTh>
                      <DataTh>Status</DataTh>
                      <DataTh>Attempts</DataTh>
                      <DataTh>Actions</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {outboxRows.map((row) => (
                      <DataTr key={row.id}>
                        <DataTd>{row.template_code ?? "Manual"}</DataTd>
                        <DataTd>{row.to_address ?? "—"}</DataTd>
                        <DataTd>{row.status}</DataTd>
                        <DataTd>{row.attempts}</DataTd>
                        <DataTd>
                          <SecondaryButton
                            type="button"
                            disabled={retryNotification.isPending || row.status === "sent"}
                            onClick={async () => {
                              try {
                                await retryNotification.mutateAsync(row.id);
                                toast.success("Notification retry queued");
                              } catch (e: unknown) {
                                toast.error(getErrorMessage(e, "Retry failed"));
                              }
                            }}
                          >
                            Retry
                          </SecondaryButton>
                        </DataTd>
                      </DataTr>
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
