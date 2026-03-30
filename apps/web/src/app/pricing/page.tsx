"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import {
  companySummary,
  extraSeatSummary,
  formatPlanPrice,
  invoiceSummary,
  invoiceValueSummary,
  overageSummary,
  seatSummary,
} from "@/lib/settings/subscriptionCommerce";
import { useSubscriptionPlans } from "@/lib/settings/subscriptionHooks";
import { EditorialBand, FullBleedHero, PublicSiteShell } from "@/components/public/site-shell";
import { getErrorMessage } from "@/lib/errors";

export default function PricingPage() {
  const plansQuery = useSubscriptionPlans();
  const plans = plansQuery.data ?? [];

  return (
    <PublicSiteShell
      accent="gold"
      hero={
        <FullBleedHero
          accent="gold"
          eyebrow="Commercial model"
          title="Plans are sold by operating headroom, not by hiding the limits."
          subtitle="Choose the plan by seats, invoice volume, company count, and commercial control. Every plan includes a trial, and the live catalog below comes from the same entitlement engine used inside the product."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/onboarding">Create company</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </>
          }
          visual={
            <div className="grid w-full max-w-[820px] gap-3">
              {plans.slice(0, 4).map((plan, index) => (
                <div
                  key={plan.id}
                  className={`rounded-[28px] px-6 py-5 ${
                    index === 2 ? "public-card-strong-surface" : "public-card-surface"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${index === 2 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted)]"}`}>
                        18% GST extra
                      </div>
                      <div className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${index === 2 ? "text-white" : "text-[var(--foreground)]"}`}>
                        {plan.name}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${index === 2 ? "text-white" : "text-[var(--accent)]"}`}>
                      {formatPlanPrice(plan)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Pricing rules"
        title="The commercial model is explicit."
        body="Seats, invoice volume, company allowance, trial policy, and overage posture are all visible before checkout. There is no payment method required upfront for trial starts, and limits are explained in product terms instead of hidden in provider checkout."
      />

      {plansQuery.isLoading ? <LoadingBlock label="Loading pricing plans…" /> : null}
      {plansQuery.isError ? <InlineError message={getErrorMessage(plansQuery.error, "Failed to load pricing plans")} /> : null}
      {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
        <EmptyState
          title="Pricing is not published yet"
          hint="Public plans have not been published from super admin yet. Use the contact path if you need the commercial model before the catalog is turned on."
        />
      ) : null}

      {plans.length > 0 ? (
        <section className="grid gap-6 py-8 xl:grid-cols-4 lg:grid-cols-2">
          {plans.map((plan, index) => {
            const invoiceValue = invoiceValueSummary(plan.limits.invoices);
            const overage = overageSummary(plan.limits.invoices);
            const extraUser = extraSeatSummary(plan.limits.full_seats, "user");
            const extraCompany = extraSeatSummary(plan.limits.companies, "company");

            return (
              <div
                key={plan.id}
                className={`rounded-[34px] border p-7 shadow-[var(--shadow-soft)] ${
                  index === 2 ? "public-card-strong-surface" : "public-card-surface"
                }`}
              >
                <div className="flex min-h-[120px] flex-col justify-between gap-4">
                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${index === 2 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted)]"}`}>
                      {plan.limits.trial.enabled ? `${plan.trial_days ?? plan.limits.trial.days} day trial` : "No trial"}
                    </div>
                    <div className={`mt-3 text-4xl font-semibold tracking-[-0.05em] ${index === 2 ? "text-white" : "text-[var(--foreground)]"}`}>
                      {plan.name}
                    </div>
                    <div className={`mt-2 text-xl font-semibold ${index === 2 ? "text-white" : "text-[var(--accent)]"}`}>
                      {formatPlanPrice(plan)}
                    </div>
                  </div>
                  <div className={`text-sm ${index === 2 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted-strong)]"}`}>
                    18% GST extra
                  </div>
                </div>

                <div className={`mt-7 space-y-3 border-t pt-5 ${index === 2 ? "border-white/12 text-[var(--public-card-strong-muted)]" : "border-[var(--public-border)] text-[var(--muted-strong)]"}`}>
                  <div>{seatSummary(plan.limits.full_seats, "full")}</div>
                  {plan.limits.view_only_seats.included > 0 ? <div>{seatSummary(plan.limits.view_only_seats, "view")}</div> : null}
                  <div>{companySummary(plan.limits.companies)}</div>
                  <div>{invoiceSummary(plan.limits.invoices)}</div>
                  {invoiceValue ? <div>{invoiceValue}</div> : null}
                  {extraUser ? <div>{extraUser}</div> : null}
                  {extraCompany ? <div>{extraCompany}</div> : null}
                  {overage ? <div>{overage}</div> : null}
                  {plan.limits.trial.require_payment_method_upfront ? (
                    <div>Payment method required before trial</div>
                  ) : (
                    <div>No payment method required to start trial</div>
                  )}
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild className={index === 2 ? "bg-white text-slate-900 hover:bg-white/92" : undefined}>
                    <Link href="/onboarding">Start with {plan.name}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="grid gap-6 border-t border-[var(--public-border)] py-12 lg:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--public-border)] bg-[var(--public-card-bg)] p-6 shadow-[var(--shadow-soft)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Trial policy</div>
          <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">30-day promotional trial</div>
          <div className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
            Every plan starts with a trial by default. No payment method is required upfront. Trial usage is tracked, but seats and invoice caps do not block the team until the trial ends.
          </div>
        </div>
        <div className="rounded-[28px] border border-[var(--public-border)] bg-[var(--public-card-bg)] p-6 shadow-[var(--shadow-soft)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">After trial expiry</div>
          <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Upgrade or stop writes</div>
          <div className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
            There is no grace period and no degraded mode. Once the trial expires, the tenant must upgrade to a paid plan or cancel the inactive subscription.
          </div>
        </div>
        <div className="rounded-[28px] border border-[var(--public-border)] bg-[var(--public-card-bg)] p-6 shadow-[var(--shadow-soft)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Need custom rollout?</div>
          <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Map the plan to your ops model</div>
          <div className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
            If you need a different company structure, assisted rollout, or governance-heavy deployment, use the contact path and we can map the commercial package accordingly.
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--public-border)] py-12">
        <div>
          <div className="font-display text-4xl font-semibold tracking-[-0.045em] text-[var(--foreground)]">
            Need help choosing the right edition?
          </div>
          <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
            We can help map the right seat, invoice, and company envelope before you roll out.
          </div>
        </div>
        <Link href="/contact" className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
          Talk to us
          <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
        </Link>
      </section>
    </PublicSiteShell>
  );
}
