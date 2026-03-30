import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell } from "@/components/public/site-shell";

export default function DemoPage() {
  return (
    <PublicSiteShell
      accent="gold"
      hero={
        <FullBleedHero
          accent="gold"
          eyebrow="Guided walkthrough"
          title="Use the demo path when you want the workflow story before rollout."
          subtitle="This route is for teams who need a guided review across onboarding, billing, GST, accounting, reporting, POS, and platform operations before moving into a live workspace."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/contact">Talk to us</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/onboarding">Skip to onboarding</Link>
              </Button>
            </>
          }
          visual={
            <div className="grid w-full max-w-[720px] gap-4 md:grid-cols-3">
              {[
                ["Workflow tour", "See the lifecycle from onboarding to books."],
                ["Rollout fit", "Decide whether self-serve or guided rollout is right."],
                ["Stakeholder review", "Give finance, ops, and founders one product narrative."],
              ].map(([title, body], index) => (
                <div key={title} className={`rounded-[30px] p-6 ${index === 1 ? "public-card-strong-surface" : "public-card-surface"}`}>
                  <div className={`font-display text-3xl font-semibold tracking-[-0.04em] ${index === 1 ? "text-white" : "text-[var(--foreground)]"}`}>{title}</div>
                  <div className={`mt-3 text-sm leading-6 ${index === 1 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted-strong)]"}`}>{body}</div>
                </div>
              ))}
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="What the demo should do"
        title="The goal is to shorten decision time, not just present features."
        body="A good demo route should explain product fit, operating structure, rollout path, and the role of the public site versus the live workspace. It is a guided review surface, not a duplicate homepage."
      />
    </PublicSiteShell>
  );
}
