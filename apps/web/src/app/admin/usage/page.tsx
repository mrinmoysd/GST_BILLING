"use client";

import * as React from "react";

import { useAdminUsage } from "@/lib/admin/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminUsagePage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useAdminUsage({ from: from || undefined, to: to || undefined });

  return (
    <div className="space-y-6">
      <PageHeader title="Admin — Usage" subtitle="Usage summary" />
      <div className="rounded-xl border bg-white p-4 grid gap-4 md:grid-cols-2 max-w-2xl">
        <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
        <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
      </div>
      {query.isLoading ? <LoadingBlock label="Loading usage…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load usage")} /> : null}
      {query.data ? (
        <div className="rounded-xl border bg-white p-4">
          <pre className="text-xs overflow-auto">{JSON.stringify(query.data.data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
