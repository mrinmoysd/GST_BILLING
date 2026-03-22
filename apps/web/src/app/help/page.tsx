import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHero, PublicSiteShell } from "@/components/public/site-shell";

export default function HelpPage() {
  return (
    <PublicSiteShell
      hero={
        <MarketingHero
          eyebrow="Help"
          title="A support entry point for onboarding, product usage, and rollout questions."
          subtitle="This page acts as the public help center entry. It should later evolve into a fuller documentation and support navigation system."
          actions={
            <>
              <Button asChild>
                <Link href="/contact">Contact support</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/security">Review security</Link>
              </Button>
            </>
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Getting started", body: "Create a company, complete onboarding, set your invoice defaults, and reach the company dashboard." },
          { title: "Billing workflows", body: "Sales invoices, purchases, payments, returns, credit notes, and POS-related operational paths." },
          { title: "GST and reports", body: "Use the reporting center for business reports and the GST compliance center for filing-oriented workspaces." },
          { title: "Admin and support", body: "For platform-level help, queue issues, or admin paths, route through support and contact channels." },
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
