"use client";

import * as React from "react";
import Link from "next/link";

import { BillingWarningStack } from "@/components/billing/warning-stack";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import {
  asStructuredPlanLimits,
  companySummary,
  extraSeatSummary,
  formatCompactNumber,
  formatPlanPrice,
  invoiceSummary,
  invoiceValueSummary,
  overageSummary,
  seatSummary,
  type StructuredPlanLimits,
} from "@/lib/settings/subscriptionCommerce";
import {
  useCancelSubscription,
  useCheckoutSubscription,
  useSubscription,
  useSubscriptionPlans,
} from "@/lib/settings/subscriptionHooks";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { PrimaryButton, SecondaryButton, SelectField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import {
  WorkspaceConfigHero,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatBadge,
} from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function limitLabel(value: number | null | undefined, fallback = "Unlimited") {
  if (value === null || value === undefined) return fallback;
  return formatCompactNumber(value);
}

function enforcementLabel(mode?: StructuredPlanLimits["invoices"]["mode"]) {
  if (mode === "hard_block") return "Hard block";
  if (mode === "wallet_overage") return "Wallet overage";
  return "Warn only";
}

function UsageMeter(props: {
  label: string;
  used: number;
  limit: number | null | undefined;
  detail?: string | null;
  trialFree?: boolean;
}) {
  const ratio =
    props.limit === null || props.limit === undefined || props.limit <= 0
      ? null
      : Math.max(0, Math.min(100, Math.round((props.used / props.limit) * 100)));
  const meterColor = props.trialFree
    ? "var(--secondary)"
    : ratio !== null && ratio >= 100
      ? "var(--danger)"
      : ratio !== null && ratio >= 80
        ? "var(--warning)"
        : "var(--accent)";

  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{props.label}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {props.trialFree ? "Tracked during trial, not capped yet." : props.detail ?? "Current billing-period usage."}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{formatCompactNumber(props.used)}</div>
          <div className="text-xs text-[var(--muted)]">of {limitLabel(props.limit)}</div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ background: meterColor, width: `${ratio ?? 100}%` }}
        />
      </div>
    </div>
  );
}

function PlanCard(props: {
  plan: {
    id: string;
    code: string;
    name: string;
    price_inr: number;
    billing_interval: "month" | "year";
    trial_days?: number;
    limits: StructuredPlanLimits;
  };
  current: boolean;
  selected: boolean;
  pending: boolean;
  onSelect: () => void;
  cta: string;
  disabled?: boolean;
}) {
  const invoiceValue = invoiceValueSummary(props.plan.limits.invoices);
  const overage = overageSummary(props.plan.limits.invoices);
  const companyUpsell = extraSeatSummary(props.plan.limits.companies, "company");
  const userUpsell = extraSeatSummary(props.plan.limits.full_seats, "user");
  const toneClass = props.current
    ? "border-[var(--accent)] bg-[var(--surface-panel)] [background-image:var(--panel-highlight)]"
    : props.selected
      ? "border-[var(--secondary)] bg-[var(--surface-panel)]"
      : "border-[var(--border)] bg-[var(--surface-panel-muted)]";

  return (
    <div
      className={`rounded-[22px] border p-6 shadow-[var(--shadow-soft)] transition ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">18% GST extra</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.plan.name}</div>
          <div className="mt-2 text-base font-semibold text-[var(--accent)]">{formatPlanPrice(props.plan)}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {props.current ? <Badge variant="secondary">Current</Badge> : null}
          {props.selected && !props.current ? <Badge variant="outline">Selected</Badge> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-[var(--muted-strong)]">
        <div>{seatSummary(props.plan.limits.full_seats, "full")}</div>
        {props.plan.limits.view_only_seats.included > 0 ? (
          <div>{seatSummary(props.plan.limits.view_only_seats, "view")}</div>
        ) : null}
        <div>{invoiceSummary(props.plan.limits.invoices)}</div>
        {invoiceValue ? <div>{invoiceValue}</div> : null}
        <div>{companySummary(props.plan.limits.companies)}</div>
        {props.plan.trial_days ? <div>{props.plan.trial_days}-day trial on this plan</div> : null}
        {userUpsell ? <div>{userUpsell}</div> : null}
        {companyUpsell ? <div>{companyUpsell}</div> : null}
        {overage ? <div>{overage}</div> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <PrimaryButton type="button" disabled={props.disabled || props.pending} onClick={props.onSelect}>
          {props.pending ? "Starting…" : props.cta}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default function SubscriptionSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const subscriptionQuery = useSubscription(companyId);
  const plansQuery = useSubscriptionPlans(companyId);
  const checkout = useCheckoutSubscription(companyId);
  const cancelSubscription = useCancelSubscription(companyId);

  const [provider, setProvider] = React.useState<"stripe" | "razorpay">("stripe");
  const [selectedPlanCode, setSelectedPlanCode] = React.useState("");

  const subscription = subscriptionQuery.data ?? null;
  const plans = React.useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const currentPlanCode = subscription?.entitlement?.planCode ?? subscription?.plan ?? null;

  React.useEffect(() => {
    if (plans.length === 0) return;
    if (currentPlanCode && plans.some((plan) => plan.code === currentPlanCode)) {
      setSelectedPlanCode((current) => current || currentPlanCode);
      return;
    }
    setSelectedPlanCode((current) => current || plans[0]?.code || "");
  }, [plans, currentPlanCode]);

  const currentPlan = React.useMemo(
    () => plans.find((plan) => plan.code === currentPlanCode) ?? null,
    [plans, currentPlanCode],
  );
  const selectedPlan = React.useMemo(
    () => plans.find((plan) => plan.code === selectedPlanCode) ?? currentPlan ?? plans[0] ?? null,
    [plans, selectedPlanCode, currentPlan],
  );

  const effectiveLimits =
    asStructuredPlanLimits(subscription?.entitlement?.effectiveLimits) ??
    currentPlan?.limits ??
    selectedPlan?.limits ??
    null;

  const usageSummary = subscription?.usage?.summary ?? {};
  const invoicesUsed = usageSummary.issued_invoice_count ?? 0;
  const fullSeatsUsed = usageSummary.active_full_seat_count ?? 0;
  const viewSeatsUsed = usageSummary.active_view_only_seat_count ?? 0;
  const companiesUsed = usageSummary.active_company_count ?? 0;
  const trialFree = subscription?.trialStatus === "trialing";
  const trialExpired = subscription?.trialStatus === "trial_expired";
  const writesBlocked = subscription?.accessControl?.operationalWriteBlocked ?? trialExpired;
  const canCancel =
    subscription &&
    !["active", "past_due", "cancelled"].includes(String(subscription.status ?? ""));

  async function startCheckout(planCode: string) {
    try {
      const baseUrl = window.location.origin;
      const returnPath = `/c/${companyId}/settings/subscription`;
      const res = await checkout.mutateAsync({
        provider,
        plan_code: planCode,
        success_url: `${baseUrl}${returnPath}`,
        cancel_url: `${baseUrl}${returnPath}`,
      });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      toastInfo("Checkout initialized", {
        description: "The subscription was created locally. Provider redirect was not returned.",
      });
    } catch (error: unknown) {
      toastError(error, {
        fallback: "Checkout could not be started.",
        context: "subscription-checkout",
      });
    }
  }

  async function cancelCurrentSubscription() {
    try {
      await cancelSubscription.mutateAsync();
      toastSuccess("Subscription cancelled", {
        description: "The current trial or pending subscription has been closed.",
      });
    } catch (error: unknown) {
      toastError(error, {
        fallback: "Subscription could not be cancelled.",
        context: "subscription-cancel",
      });
    }
  }

  return (
    <div className="space-y-8">
      <WorkspaceConfigHero
        eyebrow="Commercial"
        title="Subscription and usage"
        subtitle="See the current plan, trial posture, entitlement policy, and metered usage from one commercial workspace. Checkout stays provider-backed, but the product now explains the plan before you commit."
        badges={[
          <WorkspaceStatBadge key="status" label="Status" value={subscription?.status ?? "No subscription"} />,
          <WorkspaceStatBadge key="trial" label="Trial" value={subscription?.trialStatus ?? "Not applicable"} variant="outline" />,
          <WorkspaceStatBadge key="provider" label="Provider" value={subscription?.provider ?? provider} variant="outline" />,
          <WorkspaceStatBadge key="warnings" label="Warnings" value={subscription?.warnings?.items.length ?? 0} variant="outline" />,
        ]}
      />

      {subscriptionQuery.isLoading || plansQuery.isLoading ? <LoadingBlock label="Loading commercial workspace…" /> : null}
      {subscriptionQuery.isError ? <InlineError message={getErrorMessage(subscriptionQuery.error, "Failed to load subscription")} /> : null}
      {plansQuery.isError ? <InlineError message={getErrorMessage(plansQuery.error, "Failed to load pricing plans")} /> : null}
      <BillingWarningStack summary={subscription?.warnings} limit={3} />

      {subscription ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Current plan"
            value={currentPlan?.name ?? subscription.planName ?? "No plan"}
            hint={currentPlan ? formatPlanPrice(currentPlan) : "Plan not assigned yet"}
          />
          <StatCard
            label="Trial posture"
            value={
              subscription.trialStatus === "trialing"
                ? `${subscription.trialDaysRemaining ?? 0} days left`
                : subscription.trialStatus === "trial_expired"
                  ? "Expired"
                  : subscription.trialStatus === "converted"
                    ? "Converted"
                    : "Not in trial"
            }
            tone={trialExpired ? "strong" : "default"}
            hint={`Writes ${writesBlocked ? "blocked" : "available"}`}
          />
          <StatCard
            label="Invoice policy"
            value={invoiceSummary(effectiveLimits?.invoices ?? { included_per_month: null, monthly_billing_value_inr: null, mode: "warn_only", overage_price_inr: 0 })}
            hint={enforcementLabel(effectiveLimits?.invoices?.mode)}
            tone="quiet"
          />
          <StatCard
            label="Seat posture"
            value={seatSummary(effectiveLimits?.full_seats ?? { included: 0, max: null, extra_price_inr: 0 }, "full")}
            hint={companySummary(effectiveLimits?.companies ?? { included: 1, max: null, extra_price_inr: 0 })}
            tone="quiet"
          />
        </div>
      ) : null}

      {writesBlocked ? (
        <WorkspacePanel
          tone="strong"
          title="Operational writes are blocked"
          subtitle="This company is outside the trial window. Upgrade to a paid plan to resume operational writes, or cancel the unused subscription."
        >
          <div className="flex flex-wrap gap-3">
            {selectedPlan ? (
              <PrimaryButton type="button" disabled={checkout.isPending} onClick={() => void startCheckout(selectedPlan.code)}>
                {checkout.isPending ? "Starting…" : "Upgrade now"}
              </PrimaryButton>
            ) : null}
            {canCancel ? (
              <SecondaryButton type="button" disabled={cancelSubscription.isPending} onClick={() => void cancelCurrentSubscription()}>
                {cancelSubscription.isPending ? "Cancelling…" : "Cancel subscription"}
              </SecondaryButton>
            ) : null}
          </div>
        </WorkspacePanel>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <WorkspacePanel
          title="Current commercial state"
          subtitle="This panel reflects the active subscription row plus the entitlement snapshot resolved on the backend."
          tone="muted"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3 text-sm text-[var(--muted-strong)]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Plan</div>
                <div className="mt-1 text-lg font-semibold text-[var(--foreground)]">{currentPlan?.name ?? subscription?.planName ?? "No active plan"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Billing period</div>
                <div className="mt-1">{formatDate(subscription?.entitlement?.billingPeriodStart)} to {formatDate(subscription?.entitlement?.billingPeriodEnd)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Provider</div>
                <div className="mt-1">{subscription?.provider ?? "Provider not selected yet"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Renewal / expiry</div>
                <div className="mt-1">{formatDate(subscription?.expiresAt)}</div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Trial posture</div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                {subscription?.trialStatus === "trialing"
                  ? `${subscription?.trialDaysRemaining ?? 0} days left`
                  : subscription?.trialStatus === "trial_expired"
                    ? "Trial expired"
                    : subscription?.trialStatus === "converted"
                      ? "Converted"
                      : "Not in trial"}
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Starts {formatDate(subscription?.trialStartedAt)} and ends {formatDate(subscription?.trialEndsAt)}.
              </div>
              {trialFree ? (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--muted-strong)]">
                  Trial access is full. Seats and invoice caps are tracked for visibility, but they do not block the team during the trial window.
                </div>
              ) : null}
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Checkout control"
          subtitle="Pick the provider and launch checkout on the plan you want. Success and cancel return to this workspace automatically."
        >
          <div className="space-y-4">
            <SelectField
              label="Checkout provider"
              value={provider}
              onChange={(value) => {
                if (value === "stripe" || value === "razorpay") setProvider(value);
              }}
              options={[
                { value: "stripe", label: "Stripe" },
                { value: "razorpay", label: "Razorpay" },
              ]}
            />
            {selectedPlan ? (
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Selected plan</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{selectedPlan.name}</div>
                    <div className="mt-1 text-sm text-[var(--muted-strong)]">{formatPlanPrice(selectedPlan)}</div>
                  </div>
                  <Badge variant={trialExpired ? "warning" : "outline"}>{trialExpired ? "Upgrade required" : "Ready for checkout"}</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--muted-strong)]">
                  <div>{invoiceSummary(selectedPlan.limits.invoices)}</div>
                  <div>{seatSummary(selectedPlan.limits.full_seats, "full")}</div>
                  <div>{companySummary(selectedPlan.limits.companies)}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <PrimaryButton type="button" disabled={checkout.isPending} onClick={() => void startCheckout(selectedPlan.code)}>
                    {checkout.isPending ? "Starting…" : trialExpired ? "Upgrade now" : "Start checkout"}
                  </PrimaryButton>
                  {canCancel ? (
                    <SecondaryButton type="button" disabled={cancelSubscription.isPending} onClick={() => void cancelCurrentSubscription()}>
                      {cancelSubscription.isPending ? "Cancelling…" : "Cancel current trial"}
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                No active commercial plans are published yet. Create public plans from the super-admin subscriptions workspace first.
              </div>
            )}
            <div className="text-xs leading-5 text-[var(--muted)]">
              Need a different pricing structure or rollout model? <Link href="/contact" className="font-semibold text-[var(--accent)]">Talk to us</Link>.
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <WorkspaceSection
        eyebrow="Current usage"
        title="Metered usage against this billing period"
        subtitle="These counters come from backend lifecycle events. During trial they are visible for planning, but they do not cap operations."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <UsageMeter
            label="Issued invoices"
            used={invoicesUsed}
            limit={effectiveLimits?.invoices?.included_per_month}
            detail={invoiceValueSummary(effectiveLimits?.invoices ?? { included_per_month: null, monthly_billing_value_inr: null, mode: "warn_only", overage_price_inr: 0 })}
            trialFree={trialFree}
          />
          <UsageMeter
            label="Full-right seats"
            used={fullSeatsUsed}
            limit={effectiveLimits?.full_seats?.included}
            detail={seatSummary(effectiveLimits?.full_seats ?? { included: 0, max: null, extra_price_inr: 0 }, "full")}
            trialFree={trialFree}
          />
          <UsageMeter
            label="View-only seats"
            used={viewSeatsUsed}
            limit={effectiveLimits?.view_only_seats?.included}
            detail={seatSummary(effectiveLimits?.view_only_seats ?? { included: 0, max: null, extra_price_inr: 0 }, "view")}
            trialFree={trialFree}
          />
          <UsageMeter
            label="Active companies"
            used={companiesUsed}
            limit={effectiveLimits?.companies?.included}
            detail={companySummary(effectiveLimits?.companies ?? { included: 1, max: null, extra_price_inr: 0 })}
            trialFree={trialFree}
          />
        </div>
        <div className="text-xs text-[var(--muted)]">
          Period: {formatDate(subscription?.usage?.period_start)} to {formatDate(subscription?.usage?.period_end)}
        </div>
      </WorkspaceSection>

      {effectiveLimits ? (
        <WorkspaceSection
          eyebrow="Entitlement policy"
          title="What this plan actually controls"
          subtitle="The limits below are the effective resolved limits after plan defaults and any backend commercial overrides."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <WorkspacePanel title="Invoice issuance" subtitle="Monthly invoice quota and over-limit handling.">
              <div className="space-y-2 text-sm text-[var(--muted-strong)]">
                <div>{invoiceSummary(effectiveLimits.invoices)}</div>
                {invoiceValueSummary(effectiveLimits.invoices) ? <div>{invoiceValueSummary(effectiveLimits.invoices)}</div> : null}
                {overageSummary(effectiveLimits.invoices) ? <div>{overageSummary(effectiveLimits.invoices)}</div> : null}
                <div>Mode: {enforcementLabel(effectiveLimits.invoices.mode)}</div>
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="User seats" subtitle="Current full-right and optional view-only seat policy.">
              <div className="space-y-2 text-sm text-[var(--muted-strong)]">
                <div>{seatSummary(effectiveLimits.full_seats, "full")}</div>
                <div>{seatSummary(effectiveLimits.view_only_seats, "view")}</div>
                {extraSeatSummary(effectiveLimits.full_seats, "user") ? <div>{extraSeatSummary(effectiveLimits.full_seats, "user")}</div> : null}
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="Company scope" subtitle="How many active companies this subscription can control.">
              <div className="space-y-2 text-sm text-[var(--muted-strong)]">
                <div>{companySummary(effectiveLimits.companies)}</div>
                {extraSeatSummary(effectiveLimits.companies, "company") ? <div>{extraSeatSummary(effectiveLimits.companies, "company")}</div> : null}
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="Trial policy" subtitle="Resolved trial posture used for the current company.">
              <div className="space-y-2 text-sm text-[var(--muted-strong)]">
                <div>{effectiveLimits.trial.enabled ? `${effectiveLimits.trial.days} day trial enabled` : "Trial disabled"}</div>
                <div>{effectiveLimits.trial.allow_full_access ? "Full access during trial" : "Restricted trial access"}</div>
                <div>{effectiveLimits.trial.block_on_expiry ? "Writes block on expiry" : "Writes remain available on expiry"}</div>
              </div>
            </WorkspacePanel>
          </div>
        </WorkspaceSection>
      ) : null}

      <WorkspaceSection
        eyebrow="Plan catalog"
        title="Choose the plan that matches your operating control"
        subtitle="Public pricing and tenant pricing now come from the same plan catalog, so the team always sees the same commercial model before checkout."
      >
        {plans.length === 0 && !plansQuery.isLoading ? (
          <WorkspacePanel title="No public plans yet" subtitle="Publish active public plans from super admin to turn on the commercial catalog here.">
            <div className="text-sm text-[var(--muted)]">
              Once plans are published, this workspace will show the same commercial catalog that appears on the public pricing page.
            </div>
          </WorkspacePanel>
        ) : null}
        <div className="grid gap-4 2xl:grid-cols-4 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const isSelected = plan.code === selectedPlan?.code;
            const cta =
              isCurrent && subscription?.status === "active"
                ? "Current plan"
                : trialExpired
                  ? "Upgrade to this plan"
                  : isCurrent
                    ? "Continue with this plan"
                    : "Choose this plan";

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={isCurrent}
                selected={isSelected}
                pending={checkout.isPending && isSelected}
                disabled={isCurrent && subscription?.status === "active"}
                cta={cta}
                onSelect={() => {
                  setSelectedPlanCode(plan.code);
                  if (!(isCurrent && subscription?.status === "active")) {
                    void startCheckout(plan.code);
                  }
                }}
              />
            );
          })}
        </div>
      </WorkspaceSection>
    </div>
  );
}
