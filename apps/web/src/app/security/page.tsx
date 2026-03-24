import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorialBand, FullBleedHero, PublicSiteShell } from "@/components/public/site-shell";

export default function SecurityPage() {
  return (
    <PublicSiteShell
      hero={
        <FullBleedHero
          eyebrow="Security posture"
          title="Security is treated as controlled access, auditability, and platform integrity."
          subtitle="The public posture is built around scoped sessions, role-aware access, webhook verification, audit records, file controls, and operator visibility."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/privacy">Read privacy</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Contact the team</Link>
              </Button>
            </>
          }
          visual={
            <div className="grid w-full max-w-[720px] gap-4">
              {[
                ["Auth and sessions", "Email/password login, refresh-session handling, password recovery, and secure entry flows."],
                ["Access and governance", "RBAC, company-scoped access, internal admin roles, and audit visibility."],
                ["Platform integrity", "Webhook verification, queue-backed jobs, file controls, and environment validation."],
              ].map(([title, body], index) => (
                <div key={title} className={`rounded-[30px] border border-[rgba(23,32,51,0.08)] p-6 shadow-[var(--shadow-soft)] ${index === 1 ? "bg-[rgba(23,32,51,0.95)] text-white" : "bg-[rgba(255,255,255,0.78)]"}`}>
                  <div className={`font-display text-3xl font-semibold tracking-[-0.04em] ${index === 1 ? "text-white" : "text-[var(--foreground)]"}`}>{title}</div>
                  <div className={`mt-3 text-sm leading-6 ${index === 1 ? "text-white/76" : "text-[var(--muted-strong)]"}`}>{body}</div>
                </div>
              ))}
            </div>
          }
        />
      }
    >
      <EditorialBand
        eyebrow="Public summary"
        title="This is a posture statement, not a decorative trust page."
        body="Security pages should help a serious buyer or operator understand the discipline around access, auditability, and platform safeguards. The design stays closer to an institutional brief than a SaaS brochure."
      />

      <section className="grid gap-8 py-12 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Control areas</div>
          <h2 className="font-display text-4xl leading-[0.94] font-semibold tracking-[-0.045em] text-[var(--foreground)]">
            Three layers define the security model.
          </h2>
        </div>
        <div className="space-y-4">
          {[
            ["Identity", "Login, reset-password, session restoration, and protected-route behavior."],
            ["Authorization", "Tenant roles, permissions, admin roles, and route-level access enforcement."],
            ["Platform controls", "Files, queues, webhooks, notifications, audit logs, and release validation."],
          ].map(([title, body]) => (
            <div key={title} className="border-t border-[rgba(23,32,51,0.08)] pt-4 text-sm leading-6 text-[var(--muted-strong)] first:border-t-0 first:pt-0">
              <span className="font-semibold text-[var(--foreground)]">{title}</span>
              {" — "}
              {body}
            </div>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
