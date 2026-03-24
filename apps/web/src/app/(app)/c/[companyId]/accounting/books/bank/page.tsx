"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBankBook } from "@/lib/billing/hooks";
import { DateField } from "@/lib/ui/form";
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

  const pretty = JSON.stringify(query.data?.data ?? null, null, 2);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Bank book"
        subtitle="Review bank receipts and payments using a cleaner report container while the backend shape remains generic."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Filter bank entries by date range.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading bank book…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load bank book")} /> : null}

      {!query.isLoading && !query.isError && items.length === 0 ? <EmptyState title="No entries" hint="Try adjusting the date range." /> : null}

      {!query.isLoading && !query.isError && items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Book entries</CardTitle>
            <CardDescription>The API response is still rendered generically until a dedicated bank-book schema is added.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[70vh] overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{pretty}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
