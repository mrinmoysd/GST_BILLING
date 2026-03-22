import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHero, PublicSiteShell } from "@/components/public/site-shell";

export default function ContactPage() {
  return (
    <PublicSiteShell
      hero={
        <MarketingHero
          eyebrow="Contact"
          title="Talk through rollout, migration, or product fit."
          subtitle="Use this route when you need a guided conversation rather than going straight into self-serve onboarding."
          actions={
            <>
              <Button asChild>
                <Link href="/demo">Request a demo</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/onboarding">Create company instead</Link>
              </Button>
            </>
          }
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-[30px]">
          <CardHeader>
            <CardTitle>Contact paths</CardTitle>
            <CardDescription>Choose the route that best matches what you need next.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Sales conversation", body: "Use when you want plan guidance, rollout scoping, or stakeholder support." },
              { title: "Implementation planning", body: "Use when you already know you need help structuring rollout, migration, or process design." },
              { title: "Support / product question", body: "Use the help route if you want product guidance, FAQs, or route-by-route references." },
              { title: "Direct onboarding", body: "If you are ready to create a workspace, skip the queue and go straight into onboarding." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="font-semibold text-[var(--foreground)]">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardTitle>Default contact details</CardTitle>
            <CardDescription>Replace these placeholders with production contact channels during deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[var(--muted-strong)]">
            <div>
              <div className="font-semibold text-[var(--foreground)]">Email</div>
              <div className="mt-1">support@example.com</div>
            </div>
            <div>
              <div className="font-semibold text-[var(--foreground)]">Sales</div>
              <div className="mt-1">sales@example.com</div>
            </div>
            <div>
              <div className="font-semibold text-[var(--foreground)]">Response model</div>
              <div className="mt-1">Route product questions to help, commercial discussions to demo/contact, and urgent tenant issues into support workflows.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicSiteShell>
  );
}
