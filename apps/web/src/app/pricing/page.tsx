import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell } from "@/components/public/site-shell";

const plans = [
  {
    name: "Starter",
    fit: "For teams leaving spreadsheets or basic invoice software.",
    body: "Use this when you need one disciplined workspace for billing, purchases, inventory, GST, and day-one reporting.",
    points: ["Self-serve onboarding", "Core operations and reporting", "Fast move into a live workspace"],
  },
  {
    name: "Growth",
    fit: "For teams tightening finance and internal control.",
    body: "Use this when accounting discipline, permissions, and broader operating visibility matter as much as billing speed.",
    points: ["Accounting-linked operations", "Settings and role controls", "More mature internal workflows"],
  },
  {
    name: "Platform",
    fit: "For teams rolling out with governance or implementation support.",
    body: "Use this when you need broader rollout planning, internal coordination, and a more operationally guided path into the product.",
    points: ["Rollout and implementation support", "Governance-heavy adoption", "Longer-path operational alignment"],
  },
];

export default function PricingPage() {
  return (
    <PublicSiteShell
      accent="gold"
      hero={
        <FullBleedHero
          accent="gold"
          eyebrow="Commercial model"
          title="Pricing is framed around operating maturity, not vanity usage metrics."
          subtitle="The right plan depends on how much control you need across billing, GST, finance, and rollout governance."
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
            <div className="grid w-full max-w-[760px] gap-4 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`rounded-[30px] border border-[rgba(23,32,51,0.08)] p-6 shadow-[var(--shadow-soft)] ${
                    index === 1 ? "bg-[rgba(23,32,51,0.95)] text-white" : "bg-[rgba(255,255,255,0.78)]"
                  }`}
                >
                  <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${index === 1 ? "text-white/56" : "text-[var(--muted)]"}`}>{plan.fit}</div>
                  <div className={`mt-4 font-display text-4xl font-semibold tracking-[-0.045em] ${index === 1 ? "text-white" : "text-[var(--foreground)]"}`}>{plan.name}</div>
                  <div className={`mt-3 text-sm leading-6 ${index === 1 ? "text-white/78" : "text-[var(--muted-strong)]"}`}>{plan.body}</div>
                </div>
              ))}
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Plan shape"
        title="The product scales by control depth, not by inflating the first invoice screen."
        body="As teams mature, the workload shifts toward permissions, accounting integrity, operational oversight, and rollout governance. The plan model follows that reality."
      />

      <section className="grid gap-6 py-12 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={`rounded-[32px] border border-[rgba(23,32,51,0.08)] p-7 shadow-[var(--shadow-soft)] ${
              index === 1 ? "bg-[rgba(23,32,51,0.96)] text-white" : "bg-[rgba(255,255,255,0.78)]"
            }`}
          >
            <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${index === 1 ? "text-white/56" : "text-[var(--muted)]"}`}>Best fit</div>
            <div className={`mt-4 font-display text-5xl font-semibold tracking-[-0.05em] ${index === 1 ? "text-white" : "text-[var(--foreground)]"}`}>{plan.name}</div>
            <div className={`mt-4 text-sm leading-7 ${index === 1 ? "text-white/78" : "text-[var(--muted-strong)]"}`}>{plan.fit}</div>
            <div className="mt-6 space-y-3 border-t border-[rgba(23,32,51,0.12)] pt-5">
              {plan.points.map((point) => (
                <div key={point} className={`text-sm leading-6 ${index === 1 ? "text-white/84" : "text-[var(--muted-strong)]"}`}>{point}</div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(23,32,51,0.08)] py-12">
        <div>
          <div className="font-display text-4xl font-semibold tracking-[-0.045em] text-[var(--foreground)]">Need rollout guidance first?</div>
          <div className="mt-2 text-sm leading-6 text-[var(--muted)]">Use the contact path if pricing needs to be mapped to your operating structure.</div>
        </div>
        <Link href="/contact" className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
          Talk to us
          <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
        </Link>
      </section>
    </PublicSiteShell>
  );
}
