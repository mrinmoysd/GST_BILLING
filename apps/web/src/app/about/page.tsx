import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell, RouteCluster } from "@/components/public/site-shell";

export default function AboutPage() {
  return (
    <PublicSiteShell
      hero={
        <FullBleedHero
          eyebrow="About the operating thesis"
          title="Built around the real operating tension between speed, compliance, and control."
          subtitle="Vyapar Genie is not positioned as a generic invoicing tool. The thesis is narrower and stronger: Indian businesses need one product surface where billing, GST, stock, collections, and books stay connected."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/features">See capabilities</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Contact the team</Link>
              </Button>
            </>
          }
          visual={
            <div className="grid w-full max-w-[720px] gap-4">
              {[
                {
                  icon: <Workflow className="h-5 w-5 text-[var(--accent)]" />,
                  title: "Workflow-first structure",
                  body: "The system is organized around the loops a business repeats every day, not isolated modules that only make sense on an implementation diagram.",
                },
                {
                  icon: <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />,
                  title: "Control without fragmentation",
                  body: "Compliance, accounting, and auditability are part of the product surface instead of bolt-on utilities after document creation.",
                },
                {
                  icon: <Building2 className="h-5 w-5 text-[var(--accent)]" />,
                  title: "Built for real operators",
                  body: "The intended user is not just a cashier or accountant. It is the business that needs one controlled operating environment.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className={`rounded-[30px] p-6 ${index === 1 ? "public-card-strong-surface" : "public-card-surface"}`}
                >
                  <div className="flex items-center gap-3">{item.icon}<div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${index === 1 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted)]"}`}>Design principle</div></div>
                  <div className={`mt-4 font-display text-3xl leading-[0.96] font-semibold tracking-[-0.04em] ${index === 1 ? "text-white" : "text-[var(--foreground)]"}`}>{item.title}</div>
                  <div className={`mt-3 text-sm leading-7 ${index === 1 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted-strong)]"}`}>{item.body}</div>
                </div>
              ))}
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Positioning"
        title="The product exists for teams that have already learned that invoice generation is the easy part."
        body="The harder problem is holding together documents, money movement, stock movement, GST obligations, and finance review once the business is actually operating. That is why the product combines tenant workflows with platform controls, auditability, and reporting depth."
      />

      <section className="grid gap-10 py-12 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Who it serves</div>
          <h2 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)]">
            Teams that need operational discipline, not another loosely connected business tool.
          </h2>
        </div>
        <div className="space-y-4">
          {[
            "Retail and trading businesses that need GST-ready billing with stock visibility.",
            "Service and mixed businesses that need collections, reporting, and accounting clarity.",
            "Growing teams moving from ad hoc tools into a more governed product environment.",
            "Founders and finance-aware operators who need one system for billing, tax, inventory, and review.",
          ].map((point) => (
            <div key={point} className="grid gap-3 border-t border-[var(--public-border)] pt-4 md:grid-cols-[20px_1fr]">
              <ArrowRight className="mt-1 h-4 w-4 text-[var(--accent)]" />
              <div className="text-sm leading-7 text-[var(--muted-strong)]">{point}</div>
            </div>
          ))}
        </div>
      </section>

      <RouteCluster
        items={[
          { href: "/features", label: "Explore capabilities", body: "See how the workflow bands map from billing and GST through books, reports, POS, and admin operations." },
          { href: "/security", label: "Review trust posture", body: "Inspect how the product thinks about access, auditability, governance, and platform integrity." },
          { href: "/contact", label: "Talk to the team", body: "Use the contact path if the next step is rollout planning, migration discussion, or operational fit review." },
        ]}
      />
    </PublicSiteShell>
  );
}
