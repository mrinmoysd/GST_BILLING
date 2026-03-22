import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FeatureCard, MarketingHero, PublicSiteShell, SectionHeading } from "@/components/public/site-shell";

export default function SecurityPage() {
  return (
    <PublicSiteShell
      hero={
        <MarketingHero
          eyebrow="Security"
          title="Security posture centered on scoped access, auditability, and platform control."
          subtitle="The current platform includes session-based auth, permission-aware tenant access, files, audit logging, billing webhooks, and notification workflow controls. This page communicates the posture publicly."
          actions={
            <>
              <Button asChild>
                <Link href="/privacy">Read privacy</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contact">Contact the team</Link>
              </Button>
            </>
          }
        />
      }
    >
      <section className="space-y-6">
        <SectionHeading title="Security pillars" subtitle="This is a public summary, not a substitute for a full internal security program." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard title="Auth and sessions" description="Email/password login, refresh-session handling, password reset, and scoped user sessions." />
          <FeatureCard title="Access control" description="Role and permission-aware tenant access with company scoping for operational routes." />
          <FeatureCard title="Auditability" description="Admin audit logging and platform event handling for traceable operational changes." />
          <FeatureCard title="Platform integrity" description="Webhook verification, file controls, queue-based jobs, and environment validation for release readiness." />
        </div>
      </section>
    </PublicSiteShell>
  );
}
