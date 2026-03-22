import { PublicSiteShell, SectionHeading } from "@/components/public/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <PublicSiteShell>
      <section className="space-y-6">
        <SectionHeading eyebrow="Legal" title="Privacy policy" subtitle="This is a starter privacy page for deployment readiness. Replace placeholder legal language with approved policy text before production launch." />
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardTitle>Privacy overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted-strong)]">
            <p>GST Billing processes account, company, billing, document, and operational data to provide the product experience.</p>
            <p>We collect information necessary for authentication, company setup, document generation, reporting, notification delivery, and support operations.</p>
            <p>Before production release, this page should be replaced with a reviewed legal policy covering data handling, retention, subprocessors, user rights, and contact mechanisms.</p>
          </CardContent>
        </Card>
      </section>
    </PublicSiteShell>
  );
}
