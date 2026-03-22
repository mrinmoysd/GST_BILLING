"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCheckoutSubscription, useSubscription } from "@/lib/settings/subscriptionHooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SubscriptionSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const sub = useSubscription(companyId);
  const checkout = useCheckoutSubscription(companyId);

  const [provider, setProvider] = React.useState<"stripe" | "razorpay">("stripe");
  const [planCode, setPlanCode] = React.useState("basic");
  const [successUrl, setSuccessUrl] = React.useState("http://localhost:3000/");
  const [cancelUrl, setCancelUrl] = React.useState("http://localhost:3000/");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const data = sub.data?.data.data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Subscription"
        subtitle="Review current subscription state and launch the live provider checkout flow from a clearer billing surface."
      />

      {sub.isLoading ? <LoadingBlock label="Loading subscription…" /> : null}
      {sub.isError ? <InlineError message={getErrorMessage(sub.error, "Failed to load subscription")} /> : null}

      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{data?.status ?? "No active subscription"}</Badge>
            <Badge variant="outline">{data?.provider ?? "Provider pending"}</Badge>
          </div>
          <CardTitle>Current subscription</CardTitle>
          <CardDescription>Billing state returned by the current backend integration.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--foreground)]">
          {data ? (
            <ul className="space-y-1">
              <li>
                <span className="text-[var(--muted)]">Status:</span> {data.status ?? "—"}
              </li>
              <li>
                <span className="text-[var(--muted)]">Plan:</span> {data.plan ?? "—"}
              </li>
              <li>
                <span className="text-[var(--muted)]">Provider:</span> {data.provider ?? "—"}
              </li>
              <li>
                <span className="text-[var(--muted)]">Expires:</span> {data.expiresAt ?? "—"}
              </li>
            </ul>
          ) : (
            <div className="text-[var(--muted)]">No active subscription found.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Create a provider checkout session for Stripe or Razorpay using the configured billing credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Provider</label>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
              value={provider}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "stripe" || v === "razorpay") setProvider(v);
              }}
            >
              <option value="stripe">Stripe</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
          <TextField label="Plan code" value={planCode} onChange={setPlanCode} />
          <TextField label="Success URL" value={successUrl} onChange={setSuccessUrl} />
          <TextField label="Cancel URL" value={cancelUrl} onChange={setCancelUrl} />
          </div>

          {error ? <InlineError message={error} /> : null}
          {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              disabled={checkout.isPending}
              onClick={async () => {
                setError(null);
                setOk(null);
                try {
                  const res = await checkout.mutateAsync({
                    provider,
                    plan_code: planCode.trim() || undefined,
                    success_url: successUrl.trim() || undefined,
                    cancel_url: cancelUrl.trim() || undefined,
                  });
                  const url = res.data.data.checkout_url;
                  if (url) {
                    window.location.href = url;
                  } else {
                    setOk(`Created pending subscription: ${res.data.data.subscription_id}`);
                  }
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Checkout failed"));
                }
              }}
            >
              {checkout.isPending ? "Starting…" : "Start checkout"}
            </PrimaryButton>

            <SecondaryButton
              type="button"
              onClick={() => {
                void sub.refetch();
              }}
            >
              Refresh
            </SecondaryButton>
          </div>

          <div className="text-xs text-[var(--muted)]">Webhook-driven activation and subscription status sync now run through the backend integration layer.</div>
        </CardContent>
      </Card>
    </div>
  );
}
