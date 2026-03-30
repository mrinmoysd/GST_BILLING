"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import {
  useAdminSubscriptionPlans,
  useAdminSubscriptions,
  useCreateAdminSubscriptionPlan,
  useUpdateAdminSubscriptionPlan,
} from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  price_inr: number;
  billing_interval: string;
  is_active?: boolean;
  is_public?: boolean;
  display_order?: number;
  trial_days?: number;
  allow_add_ons?: boolean;
  limits?: Record<string, unknown>;
};

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = React.useState("");
  const [editingPlanId, setEditingPlanId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [priceInr, setPriceInr] = React.useState("0");
  const [billingInterval, setBillingInterval] = React.useState<"month" | "year">("month");
  const [trialDays, setTrialDays] = React.useState("30");
  const [displayOrder, setDisplayOrder] = React.useState("100");
  const [isPublic, setIsPublic] = React.useState("true");
  const [allowAddOns, setAllowAddOns] = React.useState("true");
  const [isActive, setIsActive] = React.useState("true");
  const [limitsJson, setLimitsJson] = React.useState("{\n  \"full_seats\": { \"included\": 1, \"max\": 1, \"extra_price_inr\": 0 },\n  \"view_only_seats\": { \"included\": 0, \"max\": 0, \"extra_price_inr\": 0 },\n  \"invoices\": { \"included_per_month\": 450, \"monthly_billing_value_inr\": 150000, \"mode\": \"warn_only\", \"overage_price_inr\": 5 },\n  \"companies\": { \"included\": 1, \"max\": 1, \"extra_price_inr\": 0 },\n  \"features\": {},\n  \"enforcement\": { \"allow_add_ons\": true },\n  \"trial\": { \"enabled\": true, \"days\": 30, \"require_payment_method_upfront\": false, \"allow_full_access\": true, \"allow_grace_period\": false, \"block_on_expiry\": true }\n}");
  const [planError, setPlanError] = React.useState<string | null>(null);
  const [planOk, setPlanOk] = React.useState<string | null>(null);
  const query = useAdminSubscriptions({ status: status || undefined, page: 1, limit: 50 });
  const plansQuery = useAdminSubscriptionPlans();
  const createPlan = useCreateAdminSubscriptionPlan();
  const updatePlan = useUpdateAdminSubscriptionPlan(editingPlanId ?? "");
  const payload = query.data as
    | {
        data?: Array<Record<string, unknown>>;
        meta?: { total?: number };
        summary?: { by_status?: Record<string, number>; by_provider?: Record<string, number> };
      }
    | undefined;
  const rows = payload?.data ?? [];
  const total = payload?.meta?.total ?? rows.length;
  const summary = payload?.summary as
    | { by_status?: Record<string, number>; by_provider?: Record<string, number> }
    | undefined;
  const plansPayload = plansQuery.data as { data?: PlanRow[] } | undefined;
  const plans = plansPayload?.data ?? [];

  function resetPlanForm() {
    setEditingPlanId(null);
    setCode("");
    setName("");
    setPriceInr("0");
    setBillingInterval("month");
    setTrialDays("30");
    setDisplayOrder("100");
    setIsPublic("true");
    setAllowAddOns("true");
    setIsActive("true");
    setLimitsJson("{\n  \"full_seats\": { \"included\": 1, \"max\": 1, \"extra_price_inr\": 0 },\n  \"view_only_seats\": { \"included\": 0, \"max\": 0, \"extra_price_inr\": 0 },\n  \"invoices\": { \"included_per_month\": 450, \"monthly_billing_value_inr\": 150000, \"mode\": \"warn_only\", \"overage_price_inr\": 5 },\n  \"companies\": { \"included\": 1, \"max\": 1, \"extra_price_inr\": 0 },\n  \"features\": {},\n  \"enforcement\": { \"allow_add_ons\": true },\n  \"trial\": { \"enabled\": true, \"days\": 30, \"require_payment_method_upfront\": false, \"allow_full_access\": true, \"allow_grace_period\": false, \"block_on_expiry\": true }\n}");
    setPlanError(null);
    setPlanOk(null);
  }

  function loadPlan(plan: PlanRow) {
    setEditingPlanId(plan.id);
    setCode(plan.code);
    setName(plan.name);
    setPriceInr(String(plan.price_inr ?? 0));
    setBillingInterval(plan.billing_interval === "year" ? "year" : "month");
    setTrialDays(String(plan.trial_days ?? 30));
    setDisplayOrder(String(plan.display_order ?? 100));
    setIsPublic(String(Boolean(plan.is_public)));
    setAllowAddOns(String(Boolean(plan.allow_add_ons)));
    setIsActive(String(plan.is_active !== false));
    setLimitsJson(JSON.stringify(plan.limits ?? {}, null, 2));
    setPlanError(null);
    setPlanOk(null);
  }

  async function submitPlan() {
    try {
      setPlanError(null);
      setPlanOk(null);
      const parsedLimits = JSON.parse(limitsJson) as Record<string, unknown>;
      const createBody = {
        code: code.trim(),
        name: name.trim(),
        price_inr: Number(priceInr || 0),
        billing_interval: billingInterval,
        trial_days: Number(trialDays || 0),
        display_order: Number(displayOrder || 100),
        is_public: isPublic === "true",
        allow_add_ons: allowAddOns === "true",
        is_active: isActive === "true",
        limits: parsedLimits,
      };

      const updateBody = {
        name: name.trim(),
        price_inr: Number(priceInr || 0),
        billing_interval: billingInterval,
        trial_days: Number(trialDays || 0),
        display_order: Number(displayOrder || 100),
        is_public: isPublic === "true",
        allow_add_ons: allowAddOns === "true",
        is_active: isActive === "true",
        limits: parsedLimits,
      };

      if (editingPlanId) {
        await updatePlan.mutateAsync(updateBody);
        setPlanOk(`Updated plan ${name.trim()}`);
      } else {
        await createPlan.mutateAsync(createBody);
        setPlanOk(`Created plan ${name.trim()}`);
        resetPlanForm();
      }
    } catch (error: unknown) {
      setPlanError(getErrorMessage(error, "Failed to save plan"));
    }
  }

  return (
    <div className="space-y-7">
      <WorkspaceHero
        tone="admin"
        eyebrow="Billing list"
        title="Subscriptions"
        subtitle="Inspect provider state, move into remediation workflows, and keep subscription oversight in a denser billing control plane."
        badges={[
          <WorkspaceStatBadge key="subscriptions" label="Subscriptions" value={total} />,
          <WorkspaceStatBadge key="filter" label="Status" value={status || "All"} variant="outline" />,
        ]}
      />

      <WorkspaceSection
        eyebrow="Overview"
        title="Subscription pressure"
        subtitle="Use the KPI strip to read current billing mix before drilling into individual tenant subscriptions."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active" value={summary?.by_status?.active ?? 0} />
          <StatCard label="Past due" value={summary?.by_status?.past_due ?? 0} tone="quiet" />
          <StatCard label="Checkout created" value={summary?.by_status?.checkout_created ?? 0} tone="quiet" />
          <StatCard label="Stripe" value={summary?.by_provider?.stripe ?? 0} />
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        eyebrow="Commercial catalog"
        title="Plan catalog"
        subtitle="Manage the public plan catalog, pricing, trial policy, and structured entitlement limits from one admin surface."
      >
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <WorkspacePanel title="Current plans" subtitle="These plans now power plan selection, entitlement snapshots, and later enforcement.">
            {plansQuery.isLoading ? <LoadingBlock label="Loading plan catalog…" /> : null}
            {plansQuery.isError ? <InlineError message={getErrorMessage(plansQuery.error, "Failed to load plans")} /> : null}
            <div className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{plan.name}</div>
                      <div className="text-xs text-[var(--muted)]">{plan.code}</div>
                    </div>
                    <Badge variant={plan.is_active === false ? "outline" : "secondary"}>
                      {plan.is_active === false ? "Inactive" : "Active"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-[var(--muted-strong)]">
                    <div>INR {plan.price_inr}/{plan.billing_interval}</div>
                    <div>Trial: {plan.trial_days ?? 30} days</div>
                    <div>Public: {plan.is_public ? "Yes" : "No"}</div>
                    <div>Order: {plan.display_order ?? 100}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <SecondaryButton type="button" onClick={() => loadPlan(plan)}>
                      Edit
                    </SecondaryButton>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title={editingPlanId ? "Edit plan" : "Create plan"}
            subtitle="Keep the plan definition explicit. Structured limits are stored as JSON now, but they still follow the backend entitlement contract."
          >
            <div className="space-y-4">
              {planError ? <InlineError message={planError} /> : null}
              {planOk ? <div className="text-sm text-green-700">{planOk}</div> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {editingPlanId ? (
                  <label className="block space-y-2">
                    <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Plan code</div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted-strong)] shadow-sm">
                      {code || "-"}
                    </div>
                    <div className="text-xs text-[var(--muted)]">Plan code is fixed after creation.</div>
                  </label>
                ) : (
                  <TextField label="Plan code" value={code} onChange={setCode} placeholder="nano" />
                )}
                <TextField label="Plan name" value={name} onChange={setName} placeholder="Nano" />
                <TextField label="Price INR" value={priceInr} onChange={setPriceInr} type="number" />
                <SelectField label="Billing interval" value={billingInterval} onChange={(value) => setBillingInterval(value === "year" ? "year" : "month")}>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </SelectField>
                <TextField label="Trial days" value={trialDays} onChange={setTrialDays} type="number" />
                <TextField label="Display order" value={displayOrder} onChange={setDisplayOrder} type="number" />
                <SelectField label="Public plan" value={isPublic} onChange={setIsPublic}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </SelectField>
                <SelectField label="Allow add-ons" value={allowAddOns} onChange={setAllowAddOns}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </SelectField>
                <SelectField label="Active" value={isActive} onChange={setIsActive}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </SelectField>
              </div>

              <label className="block space-y-2">
                <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Structured limits JSON</div>
                <textarea
                  className="min-h-[280px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-field)] px-4 py-3 font-mono text-xs text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  value={limitsJson}
                  onChange={(event) => setLimitsJson(event.target.value)}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" disabled={createPlan.isPending || updatePlan.isPending} onClick={() => void submitPlan()}>
                  {editingPlanId ? "Update plan" : "Create plan"}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={resetPlanForm}>
                  Reset
                </SecondaryButton>
              </div>
            </div>
          </WorkspacePanel>
        </div>
      </WorkspaceSection>

      <WorkspaceFilterBar summary={<Badge variant="secondary">{total} total</Badge>}>
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "trial", label: "Trial" },
            { value: "canceled", label: "Canceled" },
            { value: "past_due", label: "Past due" },
          ]}
        />
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading subscriptions…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load subscriptions")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No subscriptions" hint="Try a different filter." /> : null}

      {query.data && rows.length > 0 ? (
        <WorkspaceSection
          eyebrow="Billing plane"
          title="Subscriptions in view"
          subtitle="The table is the primary remediation and drill-in surface for plan, provider, and billing status review."
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Company</DataTh>
                  <DataTh>Plan</DataTh>
                  <DataTh>Provider</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Provider ref</DataTh>
                  <DataTh>Created</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {rows.map((row, index) => (
                  <DataTr key={String(row.id ?? index)}>
                    <DataTd>
                      <Link href={`/admin/subscriptions/${String(row.id)}`} className="font-semibold hover:text-[var(--accent)] hover:underline">
                        {String(row.company_name ?? "—")}
                      </Link>
                      <div className="text-xs text-[var(--muted)]">{String(row.owner_email ?? "—")}</div>
                    </DataTd>
                    <DataTd className="font-semibold">{String(row.plan ?? row.planId ?? row.plan_id ?? "—")}</DataTd>
                    <DataTd>{String(row.provider ?? "—")}</DataTd>
                    <DataTd>
                      <Badge variant={String(row.status ?? "") === "past_due" ? "outline" : "secondary"}>{String(row.status ?? "—")}</Badge>
                    </DataTd>
                    <DataTd className="max-w-[18ch] truncate text-xs text-[var(--muted)]">{String(row.provider_subscription_id ?? "—")}</DataTd>
                    <DataTd>{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : "—"}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
