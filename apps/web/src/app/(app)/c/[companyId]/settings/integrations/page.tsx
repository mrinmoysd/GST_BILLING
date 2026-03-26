"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateIntegrationApiKey,
  useCreateWebhookEndpoint,
  useIntegrationApiKeys,
  useRevokeIntegrationApiKey,
  useTestWebhookEndpoint,
  useWebhookDeliveries,
  useWebhookEndpoints,
} from "@/lib/migration/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
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
  const apiKeys = useIntegrationApiKeys(companyId);
  const createWebhook = useCreateWebhookEndpoint(companyId);
  const createKey = useCreateIntegrationApiKey(companyId);
  const revokeKey = useRevokeIntegrationApiKey(companyId);
  const testWebhook = useTestWebhookEndpoint(companyId);

  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [selectedEndpointId, setSelectedEndpointId] = React.useState<string | null>(null);
  const deliveries = useWebhookDeliveries(companyId, selectedEndpointId);
  const [apiKeyName, setApiKeyName] = React.useState("");
  const [revealedSecret, setRevealedSecret] = React.useState<string | null>(null);

  const webhookRows = Array.isArray(webhooks.data?.data) ? webhooks.data.data : [];
  const apiKeyRows = Array.isArray(apiKeys.data?.data) ? apiKeys.data.data : [];
  const deliveryRows = Array.isArray(deliveries.data?.data) ? deliveries.data.data : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Integrations"
        subtitle="Manage D13 webhook endpoints, test deliveries, and create partner API keys without leaving the tenant workspace."
      />

      {(webhooks.isLoading || apiKeys.isLoading) ? <LoadingBlock label="Loading integrations…" /> : null}
      {webhooks.isError ? <InlineError message={getMessage(webhooks.error, "Failed to load webhooks")} /> : null}
      {apiKeys.isError ? <InlineError message={getMessage(apiKeys.error, "Failed to load API keys")} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 webhooks</Badge>
            <CardTitle>Create webhook endpoint</CardTitle>
            <CardDescription>Use this for outbound event delivery. The D13 implementation currently includes signed test delivery, import-commit delivery, and delivery history.</CardDescription>
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
                  subscribed_events: ["integration.test", "import.job.committed"],
                });
                setName("");
                setUrl("");
                setSecret("");
              }}
            >
              <TextField label="Name" value={name} onChange={setName} required />
              <TextField label="URL" value={url} onChange={setUrl} required />
              <TextField label="Secret" value={secret} onChange={setSecret} required />
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
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
                New secret: <code>{revealedSecret}</code>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 delivery log</Badge>
            <CardTitle>Webhook endpoints</CardTitle>
            <CardDescription>Test an endpoint, then inspect the stored response excerpt and status in the delivery log.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="grid gap-3">
              {webhookRows.map((endpoint) => (
                <div key={endpoint.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
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

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              <div className="text-sm font-semibold text-[var(--foreground)]">Selected endpoint deliveries</div>
              {deliveries.isLoading ? <LoadingBlock label="Loading deliveries…" /> : null}
              {deliveries.isError ? <InlineError message={getMessage(deliveries.error, "Failed to load deliveries")} /> : null}
              <div className="mt-4 grid gap-3">
                {deliveryRows.map((delivery) => (
                  <div key={delivery.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--foreground)]">{delivery.eventType ?? delivery.event_type}</div>
                      <Badge variant={delivery.status === "failed" ? "destructive" : "outline"}>{delivery.status}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      Status: {delivery.responseStatus ?? delivery.response_status ?? "n/a"}
                    </div>
                    <div className="mt-2 text-xs text-[var(--muted-strong)]">
                      {delivery.responseBodyExcerpt ?? delivery.response_body_excerpt ?? "No response excerpt"}
                    </div>
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
              <div key={key.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
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
