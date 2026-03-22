import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHero, PublicSiteShell, SectionHeading } from "@/components/public/site-shell";

export default function AboutPage() {
  return (
    <PublicSiteShell
      hero={
        <MarketingHero
          eyebrow="About"
          title="Built around the real operating tension between speed, compliance, and control."
          subtitle="GST Billing is positioned for teams that want one disciplined product surface instead of scattered tools for invoicing, tax, stock, collections, and finance review."
          actions={
            <>
              <Button asChild>
                <Link href="/features">See capabilities</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contact">Contact the team</Link>
              </Button>
            </>
          }
        />
      }
    >
      <section className="grid gap-6 xl:grid-cols-3">
        {[
          {
            title: "Operating model first",
            description: "The product is structured around workflows businesses repeat every day, not isolated modules that only make sense to implementers.",
          },
          {
            title: "Compliance without fragmentation",
            description: "GST, accounting, and reporting are treated as part of the same business loop rather than separate afterthoughts.",
          },
          {
            title: "Production-minded execution",
            description: "The system includes platform concerns like notifications, files, billing, auditability, and admin operations alongside tenant workflows.",
          },
        ].map((item) => (
          <Card key={item.title} className="rounded-[28px]">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="leading-6">{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mt-16 rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.86)] p-6 md:p-8">
        <SectionHeading title="Who this is for" subtitle="Teams that need more than invoice generation: finance-aware operators, founders, and admins who want operational discipline in the same system." />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            "Retail and trading businesses that need GST-ready billing and stock visibility.",
            "Service and mixed businesses that need collections, reporting, and accounting clarity.",
            "Growing teams moving from ad hoc tools into a more governed product environment.",
            "Operators who need one system for billing, tax, inventory, and finance review.",
          ].map((point) => (
            <div key={point} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]">
              {point}
            </div>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
