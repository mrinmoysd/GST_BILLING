import { PublicSiteShell, SectionHeading } from "@/components/public/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <PublicSiteShell>
      <section className="space-y-6">
        <SectionHeading eyebrow="Legal" title="Terms of service" subtitle="This is a deployment-ready placeholder page that should be replaced with approved contractual terms before public launch." />
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardTitle>Terms overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted-strong)]">
            <p>Use of GST Billing is subject to account ownership, lawful operational use, and compliance with applicable billing, tax, and data requirements.</p>
            <p>The production version of this page should cover subscription terms, acceptable use, service limitations, liability boundaries, termination, and governing-law language.</p>
            <p>Replace this copy before launch with legal text approved for your actual operating entity and commercial model.</p>
          </CardContent>
        </Card>
      </section>
    </PublicSiteShell>
  );
}
