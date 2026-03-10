import * as React from "react";

type Props = {
  // Next (this repo version) types dynamic `params` as a Promise.
  params: Promise<{ companyId: string }>;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function CompanyDashboardPage({ params }: Props) {
  const { companyId } = React.use(params);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Company: <code>{companyId}</code>
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Today sales" value="—" />
        <StatCard label="This month sales" value="—" />
        <StatCard label="GST due (est.)" value="—" />
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="font-medium">Quick actions</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
            href={`/c/${companyId}/sales/invoices/new`}
          >
            New invoice
          </a>
          <a
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
            href={`/c/${companyId}/masters/customers`}
          >
            Add customer
          </a>
          <a
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
            href={`/c/${companyId}/masters/products`}
          >
            Add product
          </a>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          FE-02 MVP: stat cards and quick links. Real metrics will be wired once we decide the
          dashboard API contract.
        </p>
      </section>
    </div>
  );
}
