import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/demo", label: "Request demo" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help center" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/login", label: "Login" },
    ],
  },
];

export function PublicSiteShell(props: {
  children: React.ReactNode;
  hero?: React.ReactNode;
  accent?: "blue" | "gold";
}) {
  const accentClass =
    props.accent === "gold"
      ? "before:bg-[radial-gradient(circle_at_top_right,rgba(185,120,24,0.16),transparent_34%)]"
      : "before:bg-[radial-gradient(circle_at_top_left,rgba(15,95,140,0.14),transparent_32%)]";

  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-[var(--app-bg)]", "before:absolute before:inset-0 before:pointer-events-none", accentClass)}>
      <div className="relative">
        <PublicHeader />
        {props.hero ? <div className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-6 lg:px-8">{props.hero}</div> : null}
        <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:px-8 lg:py-16">{props.children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-[rgba(244,241,234,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--foreground)] text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
              GB
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">GST Billing</div>
              <div className="text-xs text-[var(--muted)]">India-first billing operations</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                className="rounded-full px-3 py-2 text-sm text-[var(--muted-strong)] hover:bg-white/70 hover:text-[var(--foreground)]"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/onboarding">Create company</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[rgba(255,255,255,0.65)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.25fr_1fr_1fr_1fr] md:px-6 lg:px-8">
        <div className="space-y-4">
          <Badge variant="secondary">Built for GST operations</Badge>
          <div className="max-w-sm text-sm leading-6 text-[var(--muted)]">
            Billing, purchases, GST compliance, accounting, inventory, and POS in one operational workspace for growing Indian businesses.
          </div>
          <div className="text-sm text-[var(--muted-strong)]">
            Start with self-serve onboarding, then scale into tax, finance, and platform workflows.
          </div>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <div className="text-sm font-semibold text-[var(--foreground)]">{group.title}</div>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              {group.links.map((link) => (
                <Link key={link.href} className="hover:text-[var(--foreground)]" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] md:px-6 lg:px-8">
        GST Billing. Operational software for GST billing, accounting, inventory, and POS.
      </div>
    </footer>
  );
}

export function MarketingHero(props: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badges?: string[];
  actions?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="grid gap-8 rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,252,246,0.9))] p-6 shadow-[var(--shadow-soft)] md:p-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-[var(--foreground)] md:text-5xl">
            {props.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">{props.subtitle}</p>
        </div>
        {props.badges?.length ? (
          <div className="flex flex-wrap gap-2">
            {props.badges.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}
        {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
      </div>
      <div>{props.aside}</div>
    </section>
  );
}

export function SectionHeading(props: { eyebrow?: string; title: string; subtitle?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("space-y-3", props.align === "center" ? "text-center" : "")}>
      {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{props.eyebrow}</div> : null}
      <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.title}</h2>
      {props.subtitle ? <p className={cn("text-sm leading-6 text-[var(--muted)]", props.align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl")}>{props.subtitle}</p> : null}
    </div>
  );
}

export function FeatureCard(props: { title: string; description: string; points?: string[] }) {
  return (
    <Card className="rounded-[28px] bg-[rgba(255,255,255,0.9)]">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription className="leading-6">{props.description}</CardDescription>
      </CardHeader>
      {props.points?.length ? (
        <CardContent className="space-y-3">
          {props.points.map((point) => (
            <div key={point} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted-strong)]">
              {point}
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
