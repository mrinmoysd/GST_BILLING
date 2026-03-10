"use client";

import * as React from "react";

import { useBankBook } from "@/lib/billing/hooks";
import { TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function BankBookPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const query = useBankBook({
    companyId: companyId,
    from: from || undefined,
    to: to || undefined,
  });

  const items = (query.data?.data as unknown as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Bank book" subtitle="Bank receipts and payments." />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading bank book…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load bank book")} /> : null}

      {!query.isLoading && !query.isError && items.length === 0 ? (
  <EmptyState title="No entries" hint="Try adjusting the date range." />
      ) : null}

      {!query.isLoading && !query.isError && items.length > 0 ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-neutral-600">Raw response (temporary UI)</div>
          <pre className="mt-3 max-h-[70vh] overflow-auto rounded-lg bg-neutral-50 p-3 text-xs">
            {JSON.stringify(query.data?.data ?? null, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
