import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,95,140,0.08),transparent_28%),var(--app-bg)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">GST Billing</div>
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Self-serve onboarding is now available</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Create a company, bootstrap the owner account, and land in a usable dashboard without manual seed steps.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/onboarding">Create company</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Owner bootstrap</CardTitle>
              <CardDescription>Create the owner user and authenticated session in one flow.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Company setup</CardTitle>
              <CardDescription>Capture GST, invoice prefix, timezone, and stock policy defaults up front.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Immediate access</CardTitle>
              <CardDescription>On success, the app signs the user in and routes directly into the company dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utility routes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Link href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">/onboarding</Link>
            <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">/signup</Link>
            <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">/login</Link>
            <Link href="/admin/login" className="font-medium text-[var(--accent)] hover:underline">/admin/login</Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
