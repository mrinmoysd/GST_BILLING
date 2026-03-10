"use client";

import * as React from "react";

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
    <div className="space-y-6">
      <PageHeader title="Subscription" subtitle="Plan status and checkout." />

      {sub.isLoading ? <LoadingBlock label="Loading subscription…" /> : null}
      {sub.isError ? <InlineError message={getErrorMessage(sub.error, "Failed to load subscription")} /> : null}

      <div className="rounded-xl border bg-white p-4 space-y-2">
        <div className="text-sm font-medium">Current</div>
        <div className="text-sm text-neutral-700">
          {data ? (
            <ul className="space-y-1">
              <li>
                <span className="text-neutral-500">Status:</span> {data.status ?? "—"}
              </li>
              <li>
                <span className="text-neutral-500">Plan:</span> {data.plan ?? "—"}
              </li>
              <li>
                <span className="text-neutral-500">Provider:</span> {data.provider ?? "—"}
              </li>
              <li>
                <span className="text-neutral-500">Expires:</span> {data.expiresAt ?? "—"}
              </li>
            </ul>
          ) : (
            <div className="text-neutral-600">No active subscription found.</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Checkout (MVP)</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
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

        <div className="flex gap-2">
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

        <div className="text-xs text-neutral-500">
          Portal/manage subscription isn’t implemented yet in the backend.
        </div>
      </div>
    </div>
  );
}
