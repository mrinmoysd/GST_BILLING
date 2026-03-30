import Link from "next/link";
import { ArrowRight, FileText, Layers3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell, RouteCluster } from "@/components/public/site-shell";

export default function FeaturesPage() {
  return (
    <PublicSiteShell
      hero={
        <FullBleedHero
          eyebrow="Capability map"
          title="The product is built as one operating system, not a loose set of billing screens."
          subtitle="Follow the workflow bands that matter in practice: documents, collections, stock, GST, books, admin operations, and retail billing."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/onboarding">Create company</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/demo">Book demo</Link>
              </Button>
            </>
          }
          visual={
            <div className="w-full max-w-[720px] space-y-4">
              {[
                ["Sales and collections", "Draft, issue, collect, share, credit, and return from one surface."],
                ["Purchases and stock", "Receive, adjust, and trace stock with supplier and inventory context intact."],
                ["GST and accounting", "Read GST views, statements, journals, and books directly in-product."],
              ].map(([title, body], index) => (
                <div
                  key={title}
                  className={`rounded-[30px] p-6 ${index === 1 ? "public-card-strong-surface" : "public-card-surface"}`}
                >
                  <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${index === 1 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted)]"}`}>
                    Workflow band
                  </div>
                  <div className={`mt-3 font-display text-3xl font-semibold tracking-[-0.04em] ${index === 1 ? "text-white" : "text-[var(--foreground)]"}`}>
                    {title}
                  </div>
                  <div className={`mt-2 text-sm leading-6 ${index === 1 ? "text-[var(--public-card-strong-muted)]" : "text-[var(--muted-strong)]"}`}>{body}</div>
                </div>
              ))}
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Feature structure"
        title="Every capability area is organized around an operating responsibility."
        body="The product avoids the usual split between billing tool, GST utility, inventory tracker, and accounting add-on. The same company workspace handles the lifecycle from document creation through compliance and finance review."
      />

      <section className="grid gap-10 py-12">
        {[
          {
            icon: <FileText className="h-5 w-5 text-[var(--accent)]" />,
            title: "Sales, purchases, and collections",
            body: "Create documents, record payments, manage credit notes and returns, and keep lifecycle history visible for both customer and supplier operations.",
            points: [
              "Invoices, payments, receivables, and lifecycle actions",
              "Purchases, supplier settlements, bill attachments, and returns",
              "Customer and supplier ledgers connected to the same records",
            ],
          },
          {
            icon: <Layers3 className="h-5 w-5 text-[var(--accent)]" />,
            title: "Inventory, reporting, and GST",
            body: "Stock changes, GST reporting, and business reports sit in the same product instead of living in separate export paths.",
            points: [
              "Low-stock, movements, adjustments, and intake visibility",
              "GSTR-1, GSTR-3B, HSN, ITC, and export jobs",
              "Sales, purchases, outstanding, top products, and profit snapshots",
            ],
          },
          {
            icon: <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />,
            title: "Accounting, admin, and platform operations",
            body: "Auto-posted journals, books, statement views, admin governance, and platform operations are all included in the product footprint.",
            points: [
              "Trial balance, P&L, balance sheet, cash book, and bank book",
              "RBAC, settings, auditability, internal admin, and company operations",
              "Billing, notifications, files, queues, webhooks, and support surfaces",
            ],
          },
        ].map((section) => (
          <div key={section.title} className="grid gap-5 border-t border-[var(--public-border)] pt-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">{section.icon}<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Capability area</div></div>
              <h2 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)]">{section.title}</h2>
              <p className="text-sm leading-7 text-[var(--muted-strong)]">{section.body}</p>
            </div>
            <div className="space-y-4">
              {section.points.map((point) => (
                <div key={point} className="border-t border-[var(--public-border)] pt-4 text-sm leading-6 text-[var(--muted-strong)] first:border-t-0 first:pt-0">
                  {point}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <RouteCluster
        items={[
          { href: "/pricing", label: "Pricing", body: "See the rollout paths that match operational maturity and control needs." },
          { href: "/security", label: "Security", body: "Review how access, auditability, and platform integrity are handled." },
          { href: "/help", label: "Help", body: "Open the support entry point if you want implementation or product guidance." },
        ]}
      />

      <section className="py-12">
        <Link href="/demo" className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
          Walk through the product story in a guided demo
          <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
        </Link>
      </section>
    </PublicSiteShell>
  );
}
