"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { getErrorMessage } from "@/lib/errors";
import { useAdminSubscription, useUpdateAdminSubscription } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = {
  params: Promise<{ subscriptionId: string }>;
};

export default function AdminSubscriptionDetailPage({ params }: Props) {
  const { subscriptionId } = React.use(params);
  const query = useAdminSubscription(subscriptionId);
  const update = useUpdateAdminSubscription(subscriptionId);
  const [selectedPlan, setSelectedPlan] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const subscription = query.data?.data as
    | {
        id: string;
        company: { id: string; name: string; gstin?: string | null; owner_name?: string | null; owner_email?: string | null };
        current: { plan?: string | null; plan_name?: string | null; status?: string | null; provider?: string | null; provider_subscription_id?: string | null; started_at?: string | null; expires_at?: string | null; created_at: string };
        metadata?: { success_url?: string | null; cancel_url?: string | null; provider_session_id?: string | null; admin_last_operation?: { action?: string; note?: string | null; updated_at?: string | null } | null };
        available_plans?: Array<{ code: string; name: string; price_inr: number; billing_interval: string }>;
        company_usage?: Array<{ id: string; key: string; value: number; period_start: string; period_end: string; updated_at: string }>;
        webhooks?: Array<{ id: string; provider: string; event_type: string; status: string; error?: string | null; received_at: string; processed_at?: string | null }>;
        company_subscriptions?: Array<{ id: string; plan?: string | null; status?: string | null; provider?: string | null; created_at: string }>;
        provider_health?: { failed_webhooks?: number; last_webhook_status?: string | null };
      }
    | undefined;

  const currentPlan = subscription?.current?.plan;

  React.useEffect(() => {
    if (currentPlan) {
      setSelectedPlan(currentPlan);
    }
  }, [currentPlan]);

  async function runAction(
    action: "cancel" | "reactivate" | "mark_past_due" | "mark_active" | "change_plan" | "reconcile",
  ) {
    try {
      setError(null);
      await update.mutateAsync({
        action,
        plan_code: action === "change_plan" ? selectedPlan || undefined : undefined,
        note: note || undefined,
      });
      if (action !== "change_plan") setNote("");
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to update subscription"));
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title={subscription?.company?.name ?? "Subscription workspace"}
        subtitle="Inspect provider state, usage rollups, webhook health, and apply operator remediation actions."
        actions={
          <SecondaryButton asChild type="button">
            <Link href="/admin/subscriptions">Back</Link>
          </SecondaryButton>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading subscription workspace..." /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load subscription")} /> : null}
      {error ? <InlineError message={error} /> : null}

      {subscription ? (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            <Card>
              <CardHeader><CardTitle>Status</CardTitle><CardDescription>Current billing state.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={subscription.current.status === "past_due" ? "outline" : "secondary"}>
                  {subscription.current.status ?? "—"}
                </Badge>
                <div className="text-xs text-[var(--muted)]">Created {new Date(subscription.current.created_at).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Plan</CardTitle><CardDescription>Current commercial mapping.</CardDescription></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>{subscription.current.plan_name ?? subscription.current.plan ?? "—"}</div>
                <div className="text-[var(--muted)]">Code: {subscription.current.plan ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Provider</CardTitle><CardDescription>Remote billing provider linkage.</CardDescription></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>{subscription.current.provider ?? "—"}</div>
                <div className="break-all text-xs text-[var(--muted)]">{subscription.current.provider_subscription_id ?? "No provider reference"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Webhook health</CardTitle><CardDescription>Recent provider sync posture.</CardDescription></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>Failed: {subscription.provider_health?.failed_webhooks ?? 0}</div>
                <div className="text-[var(--muted)]">Last status: {subscription.provider_health?.last_webhook_status ?? "—"}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Company context</CardTitle>
                <CardDescription>Tenant tied to this subscription record.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">
                  <Link href={`/admin/companies/${subscription.company.id}`} className="hover:text-[var(--accent)] hover:underline">
                    {subscription.company.name}
                  </Link>
                </div>
                <div>Owner: {subscription.company.owner_name ?? "—"} · {subscription.company.owner_email ?? "—"}</div>
                <div>GSTIN: {subscription.company.gstin ?? "—"}</div>
                <div className="text-[var(--muted)]">Started: {subscription.current.started_at ? new Date(subscription.current.started_at).toLocaleString() : "—"}</div>
                <div className="text-[var(--muted)]">Expires: {subscription.current.expires_at ? new Date(subscription.current.expires_at).toLocaleString() : "—"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operator actions</CardTitle>
                <CardDescription>Adjust plan and subscription state from admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block">
                  <SelectField label="Plan" value={selectedPlan} onChange={setSelectedPlan}>
                    {(subscription.available_plans ?? []).map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.name} ({plan.code}) · INR {plan.price_inr}/{plan.billing_interval}
                      </option>
                    ))}
                  </SelectField>
                </label>
                <TextField label="Operator note" value={note} onChange={setNote} placeholder="Optional action note" />
                <div className="flex flex-wrap gap-3">
                  <PrimaryButton type="button" disabled={update.isPending} onClick={() => void runAction("change_plan")}>Change plan</PrimaryButton>
                  <SecondaryButton type="button" disabled={update.isPending} onClick={() => void runAction("mark_past_due")}>Mark past due</SecondaryButton>
                  <SecondaryButton type="button" disabled={update.isPending} onClick={() => void runAction("mark_active")}>Mark active</SecondaryButton>
                  <SecondaryButton type="button" disabled={update.isPending} onClick={() => void runAction("cancel")}>Cancel</SecondaryButton>
                  <SecondaryButton type="button" disabled={update.isPending} onClick={() => void runAction("reactivate")}>Reactivate</SecondaryButton>
                  <SecondaryButton type="button" disabled={update.isPending} onClick={() => void runAction("reconcile")}>Reconcile</SecondaryButton>
                </div>
                {subscription.metadata?.admin_last_operation ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                    <div className="font-medium">Last admin operation</div>
                    <div className="mt-1 text-[var(--muted)]">
                      {String(subscription.metadata.admin_last_operation.action ?? "—")} ·{" "}
                      {subscription.metadata.admin_last_operation.updated_at
                        ? new Date(String(subscription.metadata.admin_last_operation.updated_at)).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Usage rollups</CardTitle>
                <CardDescription>Recent usage-meter rows for the tenant.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTableShell className="shadow-none">
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Key</DataTh>
                        <DataTh>Value</DataTh>
                        <DataTh>Window</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(subscription.company_usage ?? []).map((meter) => (
                        <DataTr key={meter.id}>
                          <DataTd>{meter.key}</DataTd>
                          <DataTd>{meter.value}</DataTd>
                          <DataTd>{new Date(meter.period_start).toLocaleDateString()} - {new Date(meter.period_end).toLocaleDateString()}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent webhooks</CardTitle>
                <CardDescription>Latest provider events for this tenant/provider.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(subscription.webhooks ?? []).map((event) => (
                    <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{event.event_type}</div>
                          <div className="text-xs text-[var(--muted)]">{new Date(event.received_at).toLocaleString()}</div>
                        </div>
                        <Badge variant={event.status === "failed" ? "outline" : "secondary"}>{event.status}</Badge>
                      </div>
                      {event.error ? <div className="mt-2 text-xs text-[#7e3128]">{event.error}</div> : null}
                    </div>
                  ))}
                  {(subscription.webhooks ?? []).length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No recent webhooks for this provider.</div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
