import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/lib/ui/state";

export default function AdminDashboardPage() {
  const cards = [
    { href: "/admin/companies", title: "Companies", hint: "Search and review tenants." },
    { href: "/admin/subscriptions", title: "Subscriptions", hint: "Inspect billing records and provider state." },
    { href: "/admin/usage", title: "Usage", hint: "Review platform activity within a selected date range." },
    { href: "/admin/support-tickets", title: "Support tickets", hint: "Triage and update ticket status." },
    { href: "/admin/queues", title: "Queue metrics", hint: "Watch background job health and queue pressure." },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform"
        title="Admin dashboard"
        subtitle="A clearer operations hub for tenant oversight, support, usage, and queue health."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <CardTitle>Operations overview</CardTitle>
            <CardDescription>Use the admin area to manage the platform rather than exposing raw debugging surfaces.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">5 admin workspaces</Badge>
            <Badge variant="outline">Tenants + support + queue health</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Priority path</CardTitle>
            <CardDescription>Companies, subscriptions, usage, support, and queues are now grouped as the main operating loop.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:bg-[var(--surface-muted)]"
            href={card.href}
          >
            <div className="font-semibold text-[var(--foreground)]">{card.title}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{card.hint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
