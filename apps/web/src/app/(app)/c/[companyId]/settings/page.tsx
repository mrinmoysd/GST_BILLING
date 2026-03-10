import * as React from "react";
import Link from "next/link";

import { PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function SettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Company configuration and notifications." />

      <div className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/settings/company`}>
          <div className="font-medium">Company</div>
          <div className="text-sm text-neutral-600">Profile, GSTIN, timezone, stock policy.</div>
        </Link>

        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/settings/invoice-series`}>
          <div className="font-medium">Invoice series</div>
          <div className="text-sm text-neutral-600">Numbering and prefixes.</div>
        </Link>

        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/settings/users`}>
          <div className="font-medium">Users</div>
          <div className="text-sm text-neutral-600">Invite and manage roles.</div>
        </Link>

        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/settings/subscription`}>
          <div className="font-medium">Subscription</div>
          <div className="text-sm text-neutral-600">Plan status and checkout.</div>
        </Link>

        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/settings/notifications`}>
          <div className="font-medium">Notifications</div>
          <div className="text-sm text-neutral-600">Templates + test send.</div>
        </Link>
      </div>
    </div>
  );
}

