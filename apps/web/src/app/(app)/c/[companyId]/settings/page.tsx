"use client";

import * as React from "react";
import Link from "next/link";

import { hasPermission } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/session";
import { WorkspaceConfigHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

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
      <WorkspaceConfigHero
        eyebrow="Configuration"
        title="Settings"
        subtitle="Use a clearer policy and setup surface for company identity, access, communication, and subscription state."
        badges={[
          <WorkspaceStatBadge key="screens" label="Active screens" value={visibleSections.reduce((count, section) => count + section.items.length, 0)} />,
          <WorkspaceStatBadge key="permissions" label="Controls" value="Permission-aware" variant="outline" />,
        ]}
        aside={
          <WorkspacePanel
            title="Configuration model"
            subtitle="Settings are grouped by business identity, people and messaging, and commercial controls so they read as policy rather than miscellaneous tools."
            tone="muted"
          >
            <div className="text-sm leading-7 text-[var(--muted-strong)]">
              This structure keeps room for invoice design, tax defaults, and later policy surfaces without flattening everything into one route hub.
            </div>
          </WorkspacePanel>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {visibleSections.map((section) => (
          <WorkspacePanel key={section.title} title={section.title}>
            <div className="grid gap-3">
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
            </div>
          </WorkspacePanel>
        ))}
      </div>
    </div>
  );
}
