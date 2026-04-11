import { DocumentFrame, PublicSiteShell } from "@/components/public/site-shell";

export default function TermsPage() {
  return (
    <PublicSiteShell>
      <DocumentFrame
        eyebrow="Legal"
        title="Terms of service"
        subtitle="This remains a production placeholder until approved contractual language is supplied. The structure below exists so the route does not look abandoned while legal content is still pending."
      >
        <div className="space-y-8 text-sm leading-7 text-[var(--muted-strong)]">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Use of the service</h2>
            <p>Use of Vyapar Genie is subject to lawful business operation, valid account ownership, and compliance with billing, tax, accounting, and data obligations applicable to your business.</p>
          </section>
          <section className="space-y-3 border-t border-[var(--public-border)] pt-6">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Commercial terms still required</h2>
            <p>The production version of this page should define subscription commitments, billing rules, cancellation handling, acceptable use, suspension conditions, and service boundaries for the actual operating entity.</p>
          </section>
          <section className="space-y-3 border-t border-[var(--public-border)] pt-6">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Launch note</h2>
            <p>Replace this placeholder before public launch with reviewed legal language covering liability limits, data handling references, governing law, dispute handling, and termination conditions.</p>
          </section>
        </div>
      </DocumentFrame>
    </PublicSiteShell>
  );
}
