"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateIntegrationApiKey,
  useCreateWebhookEndpoint,
  useIntegrationApiKeys,
  useRevokeIntegrationApiKey,
  useRetryWebhookDelivery,
  useTestWebhookEndpoint,
  useWebhookEventCatalog,
  useWebhookDeliveries,
  useWebhookEndpoints,
} from "@/lib/migration/hooks";
import { InlineError, LoadingBlock, PageContextStrip, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function IntegrationsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const webhooks = useWebhookEndpoints(companyId);
  const webhookEvents = useWebhookEventCatalog(companyId);
  const apiKeys = useIntegrationApiKeys(companyId);
  const createWebhook = useCreateWebhookEndpoint(companyId);
  const createKey = useCreateIntegrationApiKey(companyId);
  const revokeKey = useRevokeIntegrationApiKey(companyId);
  const testWebhook = useTestWebhookEndpoint(companyId);
  const retryWebhookDelivery = useRetryWebhookDelivery(companyId);

  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [subscribedEvents, setSubscribedEvents] = React.useState<string[]>([
    "integration.test",
    "import.job.committed",
    "invoice.issued",
    "invoice.payment_recorded",
  ]);
  const [selectedEndpointId, setSelectedEndpointId] = React.useState<string | null>(null);
  const deliveries = useWebhookDeliveries(companyId, selectedEndpointId);
  const [apiKeyName, setApiKeyName] = React.useState("");
  const [revealedSecret, setRevealedSecret] = React.useState<string | null>(null);

  const webhookRows = Array.isArray(webhooks.data?.data) ? webhooks.data.data : [];
  const eventRows = Array.isArray(webhookEvents.data?.data) ? webhookEvents.data.data : [];
  const apiKeyRows = Array.isArray(apiKeys.data?.data) ? apiKeys.data.data : [];
  const deliveryRows = Array.isArray(deliveries.data?.data) ? deliveries.data.data : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Integrations"
        subtitle="Manage D13 webhook endpoints, test deliveries, and create partner API keys without leaving the tenant workspace."
        context={
          <PageContextStrip>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Outbound delivery</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Endpoints stay visible with event subscriptions and retry posture in one place.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Partner access</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">API keys are created once, revealed once, and then managed as integration inventory.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Safe operations</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Manual tests and retries reduce the need to leave the workspace when diagnosing delivery issues.</div>
              </div>
            </div>
          </PageContextStrip>
        }
      />

      {(webhooks.isLoading || apiKeys.isLoading || webhookEvents.isLoading) ? <LoadingBlock label="Loading integrations…" /> : null}
      {webhooks.isError ? <InlineError message={getMessage(webhooks.error, "Failed to load webhooks")} /> : null}
      {webhookEvents.isError ? <InlineError message={getMessage(webhookEvents.error, "Failed to load webhook event catalog")} /> : null}
      {apiKeys.isError ? <InlineError message={getMessage(apiKeys.error, "Failed to load API keys")} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 webhooks</Badge>
            <CardTitle>Create webhook endpoint</CardTitle>
            <CardDescription>Use this for outbound event delivery. D13 now supports signed deliveries for imports plus invoice and payment lifecycle events, with stored retries in the delivery log.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createWebhook.mutateAsync({
                  name,
                  url,
                  secret,
                  subscribed_events: subscribedEvents,
                });
                setName("");
                setUrl("");
                setSecret("");
              }}
            >
              <TextField label="Name" value={name} onChange={setName} required />
              <TextField label="URL" value={url} onChange={setUrl} required />
              <TextField label="Secret" value={secret} onChange={setSecret} required />
              <div className="grid gap-2">
                <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Subscribed events</div>
                <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 shadow-[var(--shadow-soft)]">
                  {eventRows.map((eventRow) => {
                    const checked = subscribedEvents.includes(eventRow.code);
                    return (
                      <label key={eventRow.code} className="flex items-start gap-3 text-sm text-[var(--foreground)]">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={(evt) => {
                            setSubscribedEvents((current) =>
                              evt.target.checked
                                ? Array.from(new Set([...current, eventRow.code]))
                                : current.filter((item) => item !== eventRow.code),
                            );
                          }}
                        />
                        <span>
                          <span className="font-medium">{eventRow.label}</span>
                          <span className="block text-xs text-[var(--muted)]">
                            {eventRow.code} · {eventRow.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <PrimaryButton type="submit" disabled={createWebhook.isPending}>
                {createWebhook.isPending ? "Saving…" : "Create endpoint"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 API keys</Badge>
            <CardTitle>Create integration key</CardTitle>
            <CardDescription>The plaintext secret is shown once after creation, while the stored record only keeps the prefix and hash.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await createKey.mutateAsync({ name: apiKeyName });
                setApiKeyName("");
                setRevealedSecret(result.data.secret ?? null);
              }}
            >
              <TextField label="Key name" value={apiKeyName} onChange={setApiKeyName} required />
              <PrimaryButton type="submit" disabled={createKey.isPending}>
                {createKey.isPending ? "Creating…" : "Create API key"}
              </PrimaryButton>
            </form>
            {revealedSecret ? (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--foreground)] [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                New secret: <code>{revealedSecret}</code>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 delivery log</Badge>
            <CardTitle>Webhook endpoints</CardTitle>
            <CardDescription>Test an endpoint, inspect delivery attempts, and manually retry failed or queued deliveries from the same workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="grid gap-3">
              {webhookRows.map((endpoint) => (
                <div key={endpoint.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{endpoint.name}</div>
                      <div className="text-sm text-[var(--muted)]">{endpoint.url}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{endpoint.status}</Badge>
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          setSelectedEndpointId(endpoint.id);
                          testWebhook.mutate({ endpointId: endpoint.id });
                        }}
                      >
                        Send test
                      </PrimaryButton>
                      <PrimaryButton type="button" onClick={() => setSelectedEndpointId(endpoint.id)}>
                        View deliveries
                      </PrimaryButton>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-[var(--muted)]">
                    Events: {(endpoint.subscribedEvents ?? endpoint.subscribed_events ?? []).join(", ")}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-panel)] p-5 [background-image:var(--panel-highlight)] shadow-[var(--shadow-soft)]">
              <div className="text-sm font-semibold text-[var(--foreground)]">Selected endpoint deliveries</div>
              {deliveries.isLoading ? <LoadingBlock label="Loading deliveries…" /> : null}
              {deliveries.isError ? <InlineError message={getMessage(deliveries.error, "Failed to load deliveries")} /> : null}
              <div className="mt-4 grid gap-3">
                {deliveryRows.map((delivery) => (
                  <div key={delivery.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--foreground)]">{delivery.eventType ?? delivery.event_type}</div>
                      <Badge variant={delivery.status === "failed" ? "destructive" : "outline"}>{delivery.status}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      Status: {delivery.responseStatus ?? delivery.response_status ?? "n/a"}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Attempts: {delivery.attemptCount ?? delivery.attempt_count ?? 1}
                      {delivery.nextRetryAt ?? delivery.next_retry_at ? ` · Next retry ${delivery.nextRetryAt ?? delivery.next_retry_at}` : ""}
                    </div>
                    <div className="mt-2 text-xs text-[var(--muted-strong)]">
                      {delivery.responseBodyExcerpt ?? delivery.response_body_excerpt ?? "No response excerpt"}
                    </div>
                    {selectedEndpointId && delivery.status !== "delivered" ? (
                      <div className="mt-3">
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            retryWebhookDelivery.mutate({
                              endpointId: selectedEndpointId,
                              deliveryId: delivery.id,
                            })
                          }
                        >
                          Retry delivery
                        </PrimaryButton>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 keys</Badge>
            <CardTitle>API key list</CardTitle>
            <CardDescription>Keys keep only their prefix in the workspace after creation, and can be revoked when an integration is retired.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {apiKeyRows.map((key) => (
              <div key={key.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">{key.name}</div>
                    <div className="text-sm text-[var(--muted)]">{key.keyPrefix ?? key.key_prefix}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{key.status}</Badge>
                    {key.status !== "revoked" ? (
                      <PrimaryButton type="button" onClick={() => revokeKey.mutate(key.id)}>
                        Revoke
                      </PrimaryButton>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
