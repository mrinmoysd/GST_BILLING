import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHero, PublicSiteShell, SectionHeading } from "@/components/public/site-shell";

const plans = [
  {
    name: "Starter",
    badge: "Recommended for new teams",
    price: "Contact sales",
    description: "For businesses moving from spreadsheets or basic invoicing into one GST-ready operating workspace.",
    points: ["Billing, purchases, inventory, GST, reports", "Onboarding and day-one operational setup", "Email-based support path"],
  },
  {
    name: "Growth",
    badge: "Operations-focused",
    price: "Custom",
    description: "For teams that need tighter finance control, admin visibility, and scaled internal operations.",
    points: ["Accounting-linked operations", "Role and permission management", "Platform admin and support workflows"],
  },
  {
    name: "Platform",
    badge: "For mature teams",
    price: "Custom",
    description: "For organizations that need broader rollout, higher governance, and implementation collaboration.",
    points: ["Implementation planning", "Environment and release support", "Operational scaling assistance"],
  },
];

export default function PricingPage() {
  return (
    <PublicSiteShell
      accent="gold"
      hero={
        <MarketingHero
          eyebrow="Pricing"
          title="Choose the rollout path that matches your operational maturity."
          subtitle="The right plan depends less on invoice volume and more on how much control you need across GST, inventory, finance, and platform operations."
          badges={["India-first workflows", "Operational rollout", "Finance-aligned structure"]}
          actions={
            <>
              <Button asChild>
                <Link href="/onboarding">Start with onboarding</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/demo">Talk through your use case</Link>
              </Button>
            </>
          }
        />
      }
    >
      <section className="space-y-6">
        <SectionHeading title="Plan structure" subtitle="These plans are intentionally framed around operating complexity, not vanity metrics." />
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className="rounded-[30px]">
              <CardHeader>
                <Badge variant="secondary">{plan.badge}</Badge>
                <CardTitle className="mt-3 text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-semibold tracking-[-0.03em]">{plan.price}</div>
                <CardDescription className="leading-6">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted-strong)]">
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.86)] p-6 md:p-8">
        <SectionHeading title="What happens next" subtitle="If you already know your team is ready, go straight into onboarding. If you need internal buy-in, route through demo or contact first." />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/onboarding">Create company</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </PublicSiteShell>
  );
}
