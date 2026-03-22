import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureCard, MarketingHero, PublicSiteShell, SectionHeading } from "@/components/public/site-shell";

const featureGroups = [
  {
    title: "Billing and collections",
    description: "Sales invoices, payments, customer ledgers, credit notes, returns, and receivables in one operational loop.",
  },
  {
    title: "GST compliance",
    description: "GSTR-1, GSTR-3B, HSN summary, ITC reporting, and export jobs from a unified compliance center.",
  },
  {
    title: "Accounting and finance",
    description: "Auto-posted journals, statements, books, and period controls connected directly to business transactions.",
  },
  {
    title: "Inventory and purchases",
    description: "Product masters, low-stock visibility, purchase workflows, stock adjustments, and movement history.",
  },
];

const proofPoints = [
  "Self-serve onboarding creates a company, owner account, invoice series, and authenticated session in one flow.",
  "Tenant workspace already includes dashboards, reports, GST workspaces, POS, settings, and role-aware administration.",
  "The platform layer includes billing integrations, notifications, files, auditability, and queue-backed background jobs.",
];

export default function Home() {
  return (
    <PublicSiteShell
      hero={
        <MarketingHero
          eyebrow="India-first billing operations"
          title="Run GST billing, inventory, accounting, and POS from one disciplined workspace."
          subtitle="GST Billing is built for teams that need invoicing speed without losing compliance, stock accuracy, or finance visibility. Start with self-serve onboarding, then scale into GST reporting, accounting control, and platform operations."
          badges={["GST-ready workflows", "Accounting-linked operations", "POS + inventory + reports"]}
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/onboarding">Create your company</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/demo">Request a demo</Link>
              </Button>
            </>
          }
          aside={
            <Card className="rounded-[28px] border-white/70 bg-[rgba(23,32,51,0.95)] text-white">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white" variant="secondary">
                    Operations
                  </Badge>
                  <Badge className="border-white/15 text-white" variant="outline">
                    Compliance
                  </Badge>
                </div>
                <CardTitle className="text-white">Built for the full control loop</CardTitle>
                <CardDescription className="text-white/70">
                  Not just invoice generation. The product joins sales, purchases, GST, accounting, reports, payments, and POS so teams can operate from one source of truth.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {proofPoints.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/84">
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          }
        />
      }
    >
      <section className="space-y-6">
        <SectionHeading
          eyebrow="Why teams switch"
          title="A product structure that follows the way finance and operations actually work."
          subtitle="The platform is arranged around the workflows businesses repeat daily: create documents, collect money, manage stock, file GST, and review books."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureGroups.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,251,0.92))]">
          <CardHeader>
            <SectionHeading
              eyebrow="Control model"
              title="Move from fragmented tools to one operating system for billing and compliance."
              subtitle="Instead of stitching together spreadsheets, tax exports, accounting adjustments, and stock records, keep the lifecycle inside one disciplined environment."
            />
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Issue invoices and immediately carry tax, collection, and reporting implications downstream.",
              "Keep purchase, stock, and supplier activity tied to the same operational ledger.",
              "Review GST and accounting outputs from product-grade screens rather than export-only utilities.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Onboarding", value: "Self-serve", hint: "Company + owner + invoice series in one pass" },
            { label: "GST workspaces", value: "4 views", hint: "GSTR-1, GSTR-3B, HSN, ITC" },
            { label: "Reports", value: "Business + accounting", hint: "Operational and statement-level reporting" },
            { label: "Public readiness", value: "Legal + trust pages", hint: "Pricing, security, privacy, contact" },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-[28px]">
              <CardHeader>
                <CardDescription className="uppercase tracking-[0.14em]">{stat.label}</CardDescription>
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-[var(--muted)]">{stat.hint}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[32px] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-6 md:p-8">
        <SectionHeading
          eyebrow="Next step"
          title="Choose the fastest path into the product."
          subtitle="Start directly with onboarding if you want a live workspace, or route through pricing, help, and demo pages if you need stakeholder review first."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/onboarding">Start onboarding</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/help">Open help center</Link>
          </Button>
        </div>
      </section>
    </PublicSiteShell>
  );
}
