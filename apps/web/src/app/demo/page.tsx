import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHero, PublicSiteShell } from "@/components/public/site-shell";

export default function DemoPage() {
  return (
    <PublicSiteShell
      accent="gold"
      hero={
        <MarketingHero
          eyebrow="Demo"
          title="Use the demo path when you need a guided walkthrough before rollout."
          subtitle="This route is for prospects or internal reviewers who want the workflow story before creating a workspace directly."
          actions={
            <>
              <Button asChild>
                <Link href="/contact">Talk to us</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/onboarding">Skip to onboarding</Link>
              </Button>
            </>
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Workflow demo", body: "Walk through onboarding, billing, GST reports, accounting, and POS in one narrative." },
          { title: "Rollout discussion", body: "Clarify whether your team should start self-serve or needs implementation planning support." },
          { title: "Stakeholder review", body: "Use this path when finance, operations, and founders need shared product context before adoption." },
        ].map((item) => (
          <Card key={item.title} className="rounded-[28px]">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="leading-6">{item.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </PublicSiteShell>
  );
}
