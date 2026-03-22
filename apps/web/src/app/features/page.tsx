import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FeatureCard, MarketingHero, PublicSiteShell, SectionHeading } from "@/components/public/site-shell";

const sections = [
  {
    title: "Sales and collections",
    description: "Invoices, payments, customer ledgers, returns, credit notes, and document lifecycle actions from one sales workspace.",
    points: ["Draft, issue, collect, share, credit, and cancel", "Receivables and outstanding visibility", "Invoice PDFs and document history"],
  },
  {
    title: "Purchases and stock",
    description: "Purchase intake, stock movements, low-stock visibility, purchase returns, and supplier-side finance tracking.",
    points: ["Purchase receive and return flows", "Inventory movement and adjustment pages", "Supplier ledgers and payment traceability"],
  },
  {
    title: "GST and reporting",
    description: "GST compliance workspaces and business reports that are readable directly in-product.",
    points: ["GSTR-1, GSTR-3B, HSN, ITC", "Sales, purchases, outstanding, top products", "GST export jobs with download status"],
  },
  {
    title: "Accounting and finance",
    description: "Auto-posted journals, books, statements, and role-aware settings for tighter finance control.",
    points: ["Trial balance, profit & loss, balance sheet", "Cash and bank books", "Period lock and accounting-linked transactions"],
  },
  {
    title: "Platform and admin",
    description: "Billing, notifications, files, auditability, and platform operations infrastructure.",
    points: ["Notification templates and outbox", "Files, webhooks, and subscription state", "Admin companies, usage, support, and queue metrics"],
  },
  {
    title: "Retail POS",
    description: "Fast billing path for retail scenarios with receipt generation and print-ready output.",
    points: ["POS billing workspace", "Receipt route and print action", "Product search and quick settlement"],
  },
];

export default function FeaturesPage() {
  return (
    <PublicSiteShell
      hero={
        <MarketingHero
          eyebrow="Feature map"
          title="A GST billing platform that goes beyond invoice creation."
          subtitle="The product is organized around the end-to-end operational system a business actually needs: sales, purchases, stock, GST, accounting, reporting, admin, and retail billing."
          actions={
            <>
              <Button asChild>
                <Link href="/onboarding">Create company</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/pricing">Compare plans</Link>
              </Button>
            </>
          }
        />
      }
    >
      <section className="space-y-6">
        <SectionHeading title="Capability areas" subtitle="Each area maps to a real operating responsibility rather than a loose set of screens." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <FeatureCard key={section.title} title={section.title} description={section.description} points={section.points} />
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
