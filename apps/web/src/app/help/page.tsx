import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell, RouteCluster } from "@/components/public/site-shell";

export default function HelpPage() {
  return (
    <PublicSiteShell
      hero={
        <FullBleedHero
          eyebrow="Support entry"
          title="Use help when you need orientation, not a sales pitch."
          subtitle="This route should help a team choose the right next step quickly: onboarding guidance, workflow clarification, GST and report context, or escalation to support."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/contact">Contact support</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/security">Review security</Link>
              </Button>
            </>
          }
          visual={
            <div className="w-full max-w-[680px] rounded-[34px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.8)] p-8 shadow-[var(--shadow-soft)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Primary support paths</div>
              <div className="mt-5 space-y-4">
                {[
                  "Getting started and company setup",
                  "Billing, purchases, payments, and lifecycle flows",
                  "GST reporting, exports, and filing-oriented views",
                  "Accounting books, statements, and settings control",
                ].map((item) => (
                  <div key={item} className="border-t border-[rgba(23,32,51,0.08)] pt-4 text-sm leading-6 text-[var(--muted-strong)] first:border-t-0 first:pt-0">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Help structure"
        title="Support should route people, not make them scan a wall of equal boxes."
        body="The public help surface should behave like a control desk. Each route below maps to a kind of question rather than forcing visitors to interpret generic support cards."
      />

      <RouteCluster
        items={[
          { href: "/onboarding", label: "Getting started", body: "Create a company, establish defaults, and move into the first working tenant environment." },
          { href: "/features", label: "Workflow reference", body: "Understand how billing, stock, GST, accounting, and admin capabilities fit together." },
          { href: "/contact", label: "Escalate to support", body: "Use contact if you need product help, rollout clarification, or a direct response path." },
          { href: "/demo", label: "Review in guided form", body: "Use the demo route when finance, operations, or stakeholders want the product narrative first." },
        ]}
      />
    </PublicSiteShell>
  );
}
