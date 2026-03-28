"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAdminDashboard } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";


export default function AdminDashboardPage() {
  const query = useAdminDashboard();
  const data = query.data?.data as
    | {
        kpis?: Record<string, number>;
        subscription_mix?: { by_status?: Record<string, number>; by_provider?: Record<string, number> };
        platform_health?: Record<string, number>;
        recent_companies?: Array<{ id: string; name: string; created_at: string }>;
        recent_support_tickets?: Array<{ id: string; subject?: string | null; status: string; priority: string; created_at: string }>;
        recent_webhook_failures?: Array<{ id: string; provider: string; event_type: string; error?: string | null; received_at: string }>;
      }
    | undefined;

  const cards = [
    { href: "/admin/companies", title: "Companies", hint: "Search and review tenants." },
    { href: "/admin/subscriptions", title: "Subscriptions", hint: "Inspect billing records and provider state." },
    { href: "/admin/usage", title: "Usage", hint: "Review platform activity within a selected date range." },
    { href: "/admin/support-tickets", title: "Support tickets", hint: "Triage and update ticket status." },
    { href: "/admin/queues", title: "Queue metrics", hint: "Watch background job health and queue pressure." },
    { href: "/admin/internal-users", title: "Internal users", hint: "Manage admin operators and role assignments." },
    { href: "/admin/audit-logs", title: "Audit logs", hint: "Review privileged actions across the admin console." },
  ];

  return (
    <div className="space-y-7">
      <WorkspaceHero
        tone="admin"
        eyebrow="Platform control"
        title="Admin dashboard"
        subtitle="A live operations surface for tenant growth, billing pressure, support load, platform failures, and privileged governance."
        badges={[
          <WorkspaceStatBadge key="scope" label="Scope" value="Platform-wide" />,
          <WorkspaceStatBadge key="governance" label="Governance" value="Enabled" variant="outline" />,
        ]}
        actions={
          <>
            <Button asChild>
              <Link href="/admin/companies/new">Create company</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/queues">View queues</Link>
            </Button>
          </>
        }
        aside={
          <WorkspacePanel
            tone="strong"
            title="Operator priorities"
            subtitle="Use this surface to decide whether the next move is tenant intervention, billing correction, support triage, or governance review."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">Open tickets</div>
                <div className="mt-2 text-2xl font-semibold">{data?.kpis?.open_support_tickets ?? 0}</div>
                <div className="mt-1 text-sm text-white/72">Support items currently need operator review.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">Platform failures</div>
                <div className="mt-2 text-2xl font-semibold">{data?.kpis?.platform_failures ?? 0}</div>
                <div className="mt-1 text-sm text-white/72">Recent operational failures across jobs and webhooks.</div>
              </div>
            </div>
          </WorkspacePanel>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading admin dashboard..." /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load dashboard")} /> : null}

      {data ? (
        <>
          <WorkspaceSection
            eyebrow="Overview"
            title="Current platform pressure"
            subtitle="Use the KPI band first, then move into subscription health, company growth, support, and incident detail."
          >
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard label="Companies" value={data.kpis?.companies ?? 0} />
              <StatCard label="Active subs" value={data.kpis?.active_subscriptions ?? 0} />
              <StatCard label="Past due" value={data.kpis?.past_due_subscriptions ?? 0} tone="quiet" />
              <StatCard label="Open tickets" value={data.kpis?.open_support_tickets ?? 0} tone="quiet" />
              <StatCard label="Platform failures" value={data.kpis?.platform_failures ?? 0} tone="strong" />
            </div>
          </WorkspaceSection>

          <section className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
            <WorkspacePanel title="Subscription mix" subtitle="Current platform distribution by billing status and provider.">
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.subscription_mix?.by_status ?? {}).map(([key, value]) => (
                  <WorkspaceStatBadge key={`status-${key}`} label={key} value={value} />
                ))}
                {Object.entries(data.subscription_mix?.by_provider ?? {}).map(([key, value]) => (
                  <WorkspaceStatBadge key={`provider-${key}`} label={key} value={value} variant="outline" />
                ))}
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="Platform health" subtitle="Recent failed operational signals." tone="muted">
              <div className="space-y-2 text-sm">
                <div>Export failures: {data.platform_health?.export_failures ?? 0}</div>
                <div>Notification failures: {data.platform_health?.notification_failures ?? 0}</div>
                <div>Webhook failures: {data.platform_health?.webhook_failures ?? 0}</div>
              </div>
            </WorkspacePanel>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <WorkspacePanel title="Recent companies" subtitle="Latest tenant additions to the platform.">
              <div className="space-y-3">
                {(data.recent_companies ?? []).map((company) => (
                  <Link key={company.id} href={`/admin/companies/${company.id}`} className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 hover:border-[var(--accent-soft)]">
                    <div className="font-semibold">{company.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{new Date(company.created_at).toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </WorkspacePanel>
            <WorkspacePanel title="Recent support and incidents" subtitle="Fresh operator items from support and webhook failures." tone="muted">
              <div className="space-y-3">
                {(data.recent_support_tickets ?? []).map((ticket) => (
                  <div key={`ticket-${ticket.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="font-semibold">{ticket.subject || "(no subject)"}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{ticket.status} · {ticket.priority} · {new Date(ticket.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {(data.recent_webhook_failures ?? []).map((event) => (
                  <div key={`webhook-${event.id}`} className="rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4">
                    <div className="font-semibold">{event.provider}: {event.event_type}</div>
                    <div className="mt-1 text-xs text-[var(--foreground)]">{event.error || "Webhook failure"}</div>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          </section>
        </>
      ) : null}

      <WorkspaceSection
        eyebrow="Operator routes"
        title="Move from overview into action"
        subtitle="These routes handle the recurring jobs platform operators need for growth, billing, support, queues, and governance."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-soft)] transition [background-image:var(--surface-highlight)] hover:-translate-y-0.5 hover:border-[var(--secondary-soft)]"
              href={card.href}
            >
              <div className="font-semibold text-[var(--foreground)]">{card.title}</div>
              <div className="mt-1 text-sm leading-6 text-[var(--muted)]">{card.hint}</div>
            </Link>
          ))}
        </div>
      </WorkspaceSection>
    </div>
  );
}
