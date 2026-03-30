import { DocumentFrame, PublicSiteShell } from "@/components/public/site-shell";

export default function PrivacyPage() {
  return (
    <PublicSiteShell>
      <DocumentFrame
        eyebrow="Legal"
        title="Privacy policy"
        subtitle="This public legal page should feel like a reviewed document surface. Replace placeholder policy language with approved production text before launch."
      >
        <div className="space-y-8 text-sm leading-7 text-[var(--muted-strong)]">
          {[
            [
              "Privacy overview",
              "GST Billing processes account, company, billing, document, report, and operational activity data in order to provide the product experience and platform operations.",
            ],
            [
              "What the product uses",
              "Information is used for authentication, company setup, document generation, reporting, notifications, support operations, billing workflows, and platform administration.",
            ],
            [
              "Before production launch",
              "This page should be replaced with reviewed legal language covering data handling, retention, subprocessors, user rights, lawful basis, and contact or escalation mechanisms.",
            ],
          ].map(([title, body]) => (
            <section key={title} className="border-t border-[var(--public-border)] pt-6 first:border-t-0 first:pt-0">
              <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
              <p className="mt-3">{body}</p>
            </section>
          ))}
        </div>
      </DocumentFrame>
    </PublicSiteShell>
  );
}
