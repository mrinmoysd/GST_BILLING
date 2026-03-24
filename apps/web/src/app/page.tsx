import Link from "next/link";
import { ArrowRight, Database, FileText, ShieldCheck, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullBleedHero, PublicSiteShell } from "@/components/public/site-shell";

const operatingLoops = [
  {
    title: "Documents that carry consequences",
    body: "Issue an invoice once and let payments, GST, reports, and accounting inherit the same operational truth.",
  },
  {
    title: "Stock that stays attached to finance",
    body: "Purchases, returns, low-stock visibility, and movement history stay tied to the same company ledger.",
  },
  {
    title: "Compliance that is readable in-product",
    body: "Move from export-only reporting to GST and statement surfaces that can actually be reviewed before filing.",
  },
];

const workflowMarkers = [
  { label: "Sales", value: "Invoices, collections, credit notes" },
  { label: "GST", value: "GSTR-1, GSTR-3B, HSN, ITC" },
  { label: "Accounting", value: "Auto-posted journals, books, statements" },
  { label: "POS", value: "Retail billing, receipt flow, quick settlement" },
];

export default function Home() {
  return (
    <PublicSiteShell
      hero={
        <FullBleedHero
          eyebrow="Operational software for Indian businesses"
          title="Run billing, GST, stock, accounting, and retail from one disciplined workspace."
          subtitle="Built for teams that need invoicing speed without losing tax correctness, stock visibility, or finance control. Start with self-serve onboarding, then operate across collections, GST filing, books, and platform administration."
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
          support={
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">One setup pass</div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Create a company, owner account, invoice defaults, and working session in one onboarding flow.</div>
              </div>
              <div className="rounded-[24px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Control loop</div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Sales, purchases, GST, inventory, accounting, and POS stay in one operational system.</div>
              </div>
            </div>
          }
          visual={
            <div className="grid w-full max-w-[720px] gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="rounded-[34px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Today’s flow</div>
                      <div className="mt-2 font-display text-4xl leading-none font-semibold tracking-[-0.04em] text-[var(--foreground)]">INV → GST → Books</div>
                    </div>
                    <Badge variant="outline">Live ops</Badge>
                  </div>
                  <div className="mt-6 grid gap-3">
                    {workflowMarkers.map((item) => (
                      <div key={item.label} className="grid grid-cols-[80px_1fr] gap-3 border-t border-[rgba(23,32,51,0.08)] pt-3 text-sm">
                        <div className="font-semibold text-[var(--foreground)]">{item.label}</div>
                        <div className="text-[var(--muted-strong)]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-[rgba(23,32,51,0.08)] bg-[rgba(23,32,51,0.94)] p-5 text-white shadow-[var(--shadow-soft)]">
                    <FileText className="h-5 w-5 text-white/70" />
                    <div className="mt-4 font-display text-3xl font-semibold">GST-ready</div>
                    <div className="mt-2 text-sm leading-6 text-white/72">Filing-oriented views and export jobs instead of raw data dumps.</div>
                  </div>
                  <div className="rounded-[28px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[var(--shadow-soft)]">
                    <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                    <div className="mt-4 font-display text-3xl font-semibold text-[var(--foreground)]">Role-aware</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Tenant access, admin operations, auditability, and platform controls.</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-end gap-4">
                <div className="rounded-[34px] border border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,248,251,0.88))] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-[var(--accent)]" />
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Structured operations</div>
                  </div>
                  <div className="mt-5 space-y-4">
                    {operatingLoops.map((item) => (
                      <div key={item.title} className="border-t border-[rgba(23,32,51,0.08)] pt-4">
                        <div className="font-semibold text-[var(--foreground)]">{item.title}</div>
                        <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{item.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[28px] border border-[rgba(23,32,51,0.08)] bg-[rgba(184,120,24,0.14)] p-5 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-3 text-[var(--foreground)]">
                    <Store className="h-5 w-5" />
                    <div className="text-sm font-semibold">Retail and back-office in one system</div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                    POS receipts, purchase intake, GST compliance, payment tracking, and accounting statements stay connected from day one.
                  </div>
                </div>
              </div>
            </div>
          }
        />
      }
    >
      <section className="grid gap-8 border-t border-[rgba(23,32,51,0.08)] py-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
        <div className="space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Why it matters</div>
          <h2 className="max-w-xl font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)]">
            Most billing stacks fracture the moment finance and compliance get involved.
          </h2>
          <p className="max-w-lg text-base leading-7 text-[var(--muted-strong)]">
            The operational problem is not invoice generation. It is keeping documents, cash collection, stock movement, GST obligations, and books aligned as the business keeps moving.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Control surface</div>
            <div className="mt-4 font-display text-3xl leading-[0.96] font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              Built as one operating loop, not a chain of disconnected tools.
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
              GST Billing is designed so invoices, collections, purchases, tax reporting, and books inherit the same operational truth instead of being re-entered later.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              {
                title: "Fast start",
                body: "Self-serve onboarding gets a company live without waiting for a manual setup pass.",
              },
              {
                title: "Depth after go-live",
                body: "The real product value shows up in GST workspaces, books, role-aware control, and admin operations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[26px] border border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(247,244,238,0.86))] px-5 py-5 shadow-[var(--shadow-soft)]"
              >
                <div className="text-sm font-semibold text-[var(--foreground)]">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 py-12 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Control loop</div>
          <h2 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)]">
            One system for the five things businesses repeat every day.
          </h2>
        </div>
        <div className="space-y-4">
          {[
            ["Create documents", "Draft, issue, share, collect, return, and credit without splitting the lifecycle across tools."],
            ["Track money", "Payments, receivables, cash book, bank book, and outstanding reports stay tied to documents."],
            ["Manage stock", "Purchases, adjustments, movements, and low-stock signals remain operationally visible."],
            ["File GST", "GSTR-1, GSTR-3B, HSN, and ITC reporting live alongside the documents that feed them."],
            ["Review books", "Journals, trial balance, P&L, balance sheet, and period locks stay in the same environment."],
          ].map(([title, body]) => (
            <div key={title} className="grid gap-2 border-t border-[rgba(23,32,51,0.08)] pt-4 md:grid-cols-[180px_1fr]">
              <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
              <div className="text-sm leading-6 text-[var(--muted-strong)]">{body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 border-t border-[rgba(23,32,51,0.08)] py-12 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[34px] bg-[rgba(23,32,51,0.96)] p-8 text-white shadow-[var(--shadow-soft)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/54">Public path</div>
          <div className="mt-4 font-display text-5xl leading-[0.92] font-semibold tracking-[-0.05em]">
            Start directly if you need a workspace. Route through demo if you need alignment first.
          </div>
          <div className="mt-4 max-w-2xl text-sm leading-7 text-white/74">
            The public site is meant to move a visitor quickly toward the right path: self-serve onboarding, commercial review, implementation conversation, or product trust validation.
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-[34px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.76)] p-8 shadow-[var(--shadow-soft)]">
          <div className="space-y-4">
            {[
              { href: "/onboarding", label: "Create company", hint: "Go live with a real tenant workspace." },
              { href: "/pricing", label: "View pricing", hint: "See the rollout paths by operating maturity." },
              { href: "/security", label: "Review security", hint: "Check access, auditability, and platform posture." },
              { href: "/help", label: "Open help", hint: "Route product and rollout questions quickly." },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-start justify-between gap-4 border-t border-[rgba(23,32,51,0.08)] pt-4 first:border-t-0 first:pt-0">
                <div>
                  <div className="text-base font-semibold text-[var(--foreground)]">{item.label}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{item.hint}</div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 flex-none text-[var(--accent)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
