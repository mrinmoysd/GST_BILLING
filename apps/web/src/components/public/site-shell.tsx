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
    <header className="sticky top-0 z-30 border-b border-[rgba(23,32,51,0.08)] bg-[rgba(244,241,234,0.72)] backdrop-blur-xl">
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
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {[...primaryNav, { href: "/login", label: "Login" }].map((item) => (
            <Link
              key={item.href}
              className="whitespace-nowrap rounded-full border border-[rgba(23,32,51,0.08)] bg-white/72 px-3 py-2 text-sm text-[var(--muted-strong)] shadow-[0_8px_24px_rgba(23,32,51,0.04)]"
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
    <footer className="border-t border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.52)]">
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
      <div className="border-t border-[rgba(23,32,51,0.08)] px-4 py-4 text-center text-xs text-[var(--muted)] md:px-6 lg:px-8">
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
        "relative isolate overflow-hidden border-b border-[rgba(23,32,51,0.08)]",
        props.accent === "gold"
          ? "bg-[linear-gradient(180deg,#f3ead7_0%,#efe6d8_28%,#fbf8f1_100%)]"
          : "bg-[linear-gradient(180deg,#e9eef3_0%,#f1ece3_30%,#f8f5ee_100%)]",
      )}
    >
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-y-0 right-0 w-[62%] bg-[radial-gradient(circle_at_30%_40%,rgba(15,95,140,0.22),transparent_34%),radial-gradient(circle_at_65%_48%,rgba(23,32,51,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.26),rgba(23,32,51,0.04))]" />
        <div className="absolute bottom-0 left-[-6%] h-[48%] w-[62%] rounded-tr-[160px] border-t border-r border-[rgba(23,32,51,0.09)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,251,245,0.66))]" />
      </div>
      <div className="relative mx-auto grid min-h-[calc(100svh-76px)] max-w-7xl gap-10 px-4 pb-12 pt-16 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-18 lg:pt-20">
        <div className="flex flex-col justify-end gap-8">
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
          {props.support ? <div className="max-w-xl border-t border-[rgba(23,32,51,0.1)] pt-5">{props.support}</div> : null}
        </div>
        <div className="animate-hero-fade flex items-end justify-end">
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
    <section className="grid gap-6 border-t border-[rgba(23,32,51,0.08)] py-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
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
    <div className="divide-y divide-[rgba(23,32,51,0.08)] border-y border-[rgba(23,32,51,0.08)]">
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
    <section className="mx-auto max-w-4xl rounded-[34px] border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.76)] p-6 shadow-[var(--shadow-soft)] md:p-10">
      <div className="space-y-3 border-b border-[rgba(23,32,51,0.08)] pb-6">
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
