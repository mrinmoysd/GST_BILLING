import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/session";
import { PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function SettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { session } = useAuth();
  const sections = [
    {
      title: "Business identity",
      items: [
        { href: `/c/${companyId}/settings/company`, title: "Company", hint: "Profile, GSTIN, state, timezone, and stock policy.", permission: "settings.company.manage" },
        { href: `/c/${companyId}/settings/invoice-series`, title: "Invoice series", hint: "Numbering rules and active series management.", permission: "settings.invoice_series.manage" },
      ],
    },
    {
      title: "People and messaging",
      items: [
        { href: `/c/${companyId}/settings/users`, title: "Users", hint: "Invite teammates and adjust current role assignments.", permission: "settings.users.manage" },
        { href: `/c/${companyId}/settings/roles`, title: "Roles", hint: "Create custom roles and choose their permission inventory.", permission: "settings.roles.manage" },
        { href: `/c/${companyId}/settings/notifications`, title: "Notifications", hint: "Template configuration and test-send workspace.", permission: "settings.notifications.manage" },
      ],
    },
    {
      title: "Commercial",
      items: [
        { href: `/c/${companyId}/settings/subscription`, title: "Subscription", hint: "Current plan status and provider checkout flow.", permission: "settings.subscription.manage" },
      ],
    },
  ];
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(session, item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Use a cleaner control surface for company setup, users, notifications, and subscription state."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <CardTitle>Configuration areas</CardTitle>
            <CardDescription>Settings are grouped by company identity, people and communication, and commercial controls.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">{visibleSections.reduce((count, section) => count + section.items.length, 0)} active settings screens</Badge>
            <Badge variant="outline">Permission-aware controls</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Future fit</CardTitle>
            <CardDescription>This structure leaves room for RBAC, invoice design, tax defaults, and portal-grade billing later.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {visibleSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:bg-[var(--surface)]"
                  href={item.href}
                >
                  <div className="font-semibold text-[var(--foreground)]">{item.title}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">{item.hint}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
