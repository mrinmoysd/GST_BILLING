import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell, RouteCluster } from "@/components/public/site-shell";

export default function ContactPage() {
  return (
    <PublicSiteShell
      hero={
        <FullBleedHero
          eyebrow="Contact"
          title="Use this route when the next step needs a conversation."
          subtitle="The contact surface should route by intent: commercial fit, rollout guidance, product support, or direct move into onboarding."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/demo">Book demo</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/onboarding">Create company</Link>
              </Button>
            </>
          }
          visual={
            <div className="public-card-surface w-full max-w-[720px] rounded-[34px] p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Contact routing</div>
              <div className="mt-5 space-y-4">
                {[
                  ["Sales conversation", "For plan guidance, rollout fit, and stakeholder support."],
                  ["Implementation planning", "For teams already planning migration or structured rollout."],
                  ["Product support", "For questions that should move through support rather than sales."],
                ].map(([title, body]) => (
                  <div key={title} className="border-t border-[var(--public-border)] pt-4 first:border-t-0 first:pt-0">
                    <div className="font-semibold text-[var(--foreground)]">{title}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{body}</div>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Direct channels"
        title="Choose the route that matches the work you actually need done."
        body="This page should behave like a routing desk rather than a generic contact form landing. The public site’s job is to help people self-sort into the right path quickly."
      />

      <RouteCluster
        items={[
          { href: "/demo", label: "Book demo", body: "Use this when you want a guided walkthrough before creating a live workspace." },
          { href: "/help", label: "Support questions", body: "Use help and support channels when the issue is product understanding or operator guidance." },
          { href: "/onboarding", label: "Go direct", body: "Skip the queue and create a company immediately if you already know you want the product." },
        ]}
      />

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--public-border)] py-12">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">Placeholder production channels</div>
          <div className="mt-2 text-sm leading-6 text-[var(--muted)]">Replace these with the real support and sales details during deployment hardening.</div>
        </div>
        <div className="text-sm leading-7 text-[var(--muted-strong)]">
          support@example.com
          <br />
          sales@example.com
        </div>
        <Link href="/help" className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
          Open help
          <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
        </Link>
      </section>
    </PublicSiteShell>
  );
}
