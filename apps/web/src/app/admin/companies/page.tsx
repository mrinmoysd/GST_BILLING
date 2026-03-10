"use client";

import * as React from "react";

import { useAdminCompanies } from "@/lib/admin/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminCompaniesPage() {
  const [q, setQ] = React.useState("");
  const query = useAdminCompanies({ q: q || undefined, page: 1, limit: 50 });

  const rows = (query.data?.data as unknown as { data?: Array<Record<string, unknown>> })?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin — Companies" subtitle="Platform tenants" />

      <div className="rounded-xl border bg-white p-4 max-w-xl">
        <TextField label="Search" value={q} onChange={setQ} placeholder="Name / owner" />
      </div>

      {query.isLoading ? <LoadingBlock label="Loading companies…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load companies")} /> : null}
      {query.data && rows.length === 0 ? <EmptyState title="No companies" hint="Try a different query." /> : null}

      {query.data && rows.length > 0 ? (
        <div className="rounded-xl border bg-white p-4">
          <pre className="text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
