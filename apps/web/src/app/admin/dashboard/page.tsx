import Link from "next/link";

import { PageHeader } from "@/lib/ui/state";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin dashboard" subtitle="Platform administration." />

      <div className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href="/admin/companies">
          <div className="font-medium">Companies</div>
          <div className="text-sm text-neutral-600">Search and review tenants.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href="/admin/subscriptions">
          <div className="font-medium">Subscriptions</div>
          <div className="text-sm text-neutral-600">List subscription records.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href="/admin/usage">
          <div className="font-medium">Usage</div>
          <div className="text-sm text-neutral-600">Usage summary by date range.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href="/admin/support-tickets">
          <div className="font-medium">Support tickets</div>
          <div className="text-sm text-neutral-600">Placeholder in backend.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href="/admin/queues">
          <div className="font-medium">Queue metrics</div>
          <div className="text-sm text-neutral-600">BullMQ queue counts.</div>
        </Link>
      </div>
    </div>
  );
}
