"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateNotificationTemplate,
  useNotificationTemplates,
  useTestNotification,
  useUpdateNotificationTemplate,
} from "@/lib/settings/notificationsHooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

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

  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState("email");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("Hi {{name}},\n\nThis is a test notification.\n");

  const [testTo, setTestTo] = React.useState("");
  const [testSubject, setTestSubject] = React.useState("Test notification");
  const [testBody, setTestBody] = React.useState("Hello! This is a test.");
  const [testError, setTestError] = React.useState<string | null>(null);
  const [testOk, setTestOk] = React.useState<string | null>(null);

  const rows = list.data?.data.data ?? [];

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
          <TextField label="Name" value={name} onChange={setName} />
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Channel</label>
            <select className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
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
              if (!name.trim()) return setError("Enter a template name.");
              if (!body.trim()) return setError("Enter a template body.");
              try {
                await create.mutateAsync({ name: name.trim(), channel, subject: subject.trim() || undefined, body });
                setName("");
                setSubject("");
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Failed to create template"));
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
          <CardDescription>Send a one-off test message to validate current provider wiring and template assumptions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Channel</label>
            <select className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <TextField label="To" value={testTo} onChange={setTestTo} placeholder="email/phone" />
          </div>
          <TextField label="Subject (optional)" value={testSubject} onChange={setTestSubject} />
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Body</label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm shadow-sm"
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
            />
          </div>
          {testError ? <InlineError message={testError} /> : null}
          {testOk ? <div className="text-sm text-green-700">{testOk}</div> : null}
          <PrimaryButton
            type="button"
            disabled={testNotif.isPending}
            onClick={async () => {
              setTestError(null);
              setTestOk(null);
              if (!testTo.trim()) return setTestError("Enter recipient.");
              if (!testBody.trim()) return setTestError("Enter body.");
              try {
                await testNotif.mutateAsync({ channel, to: testTo.trim(), subject: testSubject.trim() || undefined, body: testBody });
                setTestOk("Queued test notification.");
              } catch (e: unknown) {
                setTestError(getErrorMessage(e, "Failed to send test"));
              }
            }}
          >
            {testNotif.isPending ? "Sending…" : "Send test"}
          </PrimaryButton>
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
                        <DataTd>{t.name}</DataTd>
                        <DataTd>{t.channel}</DataTd>
                        <DataTd>
                      <SecondaryButton
                        type="button"
                        disabled={update.isPending}
                        onClick={async () => {
                          const newName = window.prompt("Rename template", t.name);
                          if (!newName || !newName.trim()) return;
                          try {
                            await update.mutateAsync({ templateId: t.id, patch: { name: newName.trim() } });
                          } catch (e: unknown) {
                            window.alert(getErrorMessage(e, "Failed to update template"));
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
    </div>
  );
}
