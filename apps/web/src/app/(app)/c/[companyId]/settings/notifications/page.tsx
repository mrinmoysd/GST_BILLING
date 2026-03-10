"use client";

import * as React from "react";

import {
  useCreateNotificationTemplate,
  useNotificationTemplates,
  useTestNotification,
  useUpdateNotificationTemplate,
} from "@/lib/settings/notificationsHooks";
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
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Templates and test sends." />

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Create template</div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={name} onChange={setName} />
          <div>
            <label className="block text-sm font-medium">Channel</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>
        <TextField label="Subject (optional)" value={subject} onChange={setSubject} />
        <div>
          <label className="block text-sm font-medium">Body</label>
          <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm min-h-32" value={body} onChange={(e) => setBody(e.target.value)} />
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
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Test notification</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Channel</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <TextField label="To" value={testTo} onChange={setTestTo} placeholder="email/phone" />
        </div>
        <TextField label="Subject (optional)" value={testSubject} onChange={setTestSubject} />
        <div>
          <label className="block text-sm font-medium">Body</label>
          <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm min-h-24" value={testBody} onChange={(e) => setTestBody(e.target.value)} />
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
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Templates</div>
        {list.isLoading ? <LoadingBlock label="Loading templates…" /> : null}
        {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load templates")} /> : null}
        {list.data && rows.length === 0 ? <EmptyState title="No templates" hint="Create your first template above." /> : null}

        {list.data && rows.length > 0 ? (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Channel</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3">{t.channel}</td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
