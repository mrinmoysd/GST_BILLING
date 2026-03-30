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
    <div className={cn("relative min-h-screen overflow-hidden bg-[var(--background)]", "before:absolute before:inset-0 before:pointer-events-none", accentClass)}>
      <div className="relative">
        <PublicHeader />
        {props.hero ? <div className="pt-0">{props.hero}</div> : null}
        <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:px-8 lg:py-16">{props.children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--public-border)] bg-[var(--public-header-bg)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-3" href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--foreground)] text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
                GB
              </div>
              <div>
                <div className="font-display text-lg leading-none font-semibold text-[var(--foreground)]">GST Billing</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">India-first billing operations</div>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-full px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--public-header-hover)] hover:text-[var(--foreground)]"
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
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {[...primaryNav, { href: "/login", label: "Login" }].map((item) => (
            <Link
              key={item.href}
              className="whitespace-nowrap rounded-full border border-[var(--public-border)] bg-[var(--public-mobile-chip-bg)] px-3 py-2 text-sm text-[var(--muted-strong)] shadow-[var(--shadow-soft)]"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--public-border)] bg-[var(--public-footer-bg)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.45fr_1fr_1fr_1fr] md:px-6 lg:px-8">
        <div className="space-y-5">
          <Badge variant="secondary">Built for GST operations</Badge>
          <div className="font-display text-3xl font-semibold leading-[0.95] tracking-[-0.04em] text-[var(--foreground)]">
            Billing, tax, stock, and books in one operating surface.
          </div>
          <div className="max-w-sm text-sm leading-6 text-[var(--muted)]">
            Designed for Indian teams that need invoicing speed without giving up compliance, finance visibility, or internal control.
          </div>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{group.title}</div>
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
      <div className="border-t border-[var(--public-border)] bg-[var(--public-footer-bottom-bg)] px-4 py-4 text-center text-xs text-[var(--muted)] md:px-6 lg:px-8">
        GST Billing. Operational software for GST billing, accounting, inventory, and POS.
      </div>
    </footer>
  );
}

export function FullBleedHero(props: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  support?: React.ReactNode;
  visual?: React.ReactNode;
  accent?: "blue" | "gold";
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-[var(--public-border)]",
        props.accent === "gold" ? "bg-[var(--public-hero-bg-gold)]" : "bg-[var(--public-hero-bg)]",
      )}
    >
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-y-0 right-0 w-[62%] bg-[var(--public-hero-right-plane)]" />
        <div className="absolute bottom-0 left-[-6%] h-[48%] w-[62%] rounded-tr-[160px] border-t border-r border-[var(--public-border)] bg-[var(--public-hero-left-plane)]" />
      </div>
      <div className="relative mx-auto grid min-h-[clamp(38rem,calc(100svh-76px),46rem)] max-w-7xl items-center gap-10 px-4 py-14 md:px-6 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-18">
        <div className="flex flex-col justify-center gap-8">
          <div className="space-y-5">
            <div className="animate-hero-rise text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
              {props.eyebrow}
            </div>
            <div className="animate-hero-rise-delay font-display text-6xl leading-[0.9] font-semibold tracking-[-0.055em] text-[var(--foreground)] md:text-7xl lg:text-[6.1rem]">
              GST Billing
            </div>
            <h1 className="animate-hero-rise-delay max-w-xl text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--foreground)] md:text-5xl">
              {props.title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-[var(--muted-strong)] md:text-lg">{props.subtitle}</p>
          </div>
          {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
          {props.support ? <div className="max-w-xl border-t border-[var(--public-border)] pt-5">{props.support}</div> : null}
        </div>
        <div className="animate-hero-fade flex items-center justify-center lg:justify-end">
          {props.visual}
        </div>
      </div>
    </section>
  );
}

export function EditorialBand(props: {
  eyebrow?: string;
  title: string;
  body: string;
  aside?: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-[var(--public-border)] py-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
      <div className="space-y-3">
        {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div> : null}
        <h2 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)]">{props.title}</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">{props.body}</p>
        {props.aside ? <div>{props.aside}</div> : null}
      </div>
    </section>
  );
}

export function RouteCluster(props: {
  items: Array<{ href: string; label: string; body: string }>;
}) {
  return (
    <div className="divide-y divide-[var(--public-border)] border-y border-[var(--public-border)]">
      {props.items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group grid gap-3 py-5 transition md:grid-cols-[220px_1fr_auto] md:items-start"
        >
          <div className="text-sm font-semibold text-[var(--foreground)]">{item.label}</div>
          <div className="max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">{item.body}</div>
          <div className="text-sm font-medium text-[var(--accent)] transition group-hover:translate-x-1">Open</div>
        </Link>
      ))}
    </div>
  );
}

export function DocumentFrame(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-4xl rounded-[34px] border border-[var(--public-border)] bg-[var(--public-card-bg)] p-6 shadow-[var(--shadow-soft)] md:p-10">
      <div className="space-y-3 border-b border-[var(--public-border)] pb-6">
        {props.eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{props.eyebrow}</div> : null}
        <h1 className="font-display text-4xl leading-[0.92] font-semibold tracking-[-0.045em] text-[var(--foreground)] md:text-5xl">{props.title}</h1>
        {props.subtitle ? <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{props.subtitle}</p> : null}
      </div>
      <div className="pt-6">{props.children}</div>
    </section>
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
    <section className="grid gap-8 rounded-[32px] border border-[var(--public-border)] bg-[var(--public-card-muted)] p-6 shadow-[var(--shadow-soft)] md:p-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
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
    <Card className="rounded-[28px] border-[var(--public-border)] bg-[var(--public-card-bg)]">
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
