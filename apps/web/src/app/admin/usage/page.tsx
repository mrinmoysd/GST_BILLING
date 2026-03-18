"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title="Usage"
        subtitle="Review the current usage summary payload across a configurable date range."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Select the time range for the current usage summary.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>
      {query.isLoading ? <LoadingBlock label="Loading usage…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load usage")} /> : null}
      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Usage payload</CardTitle>
            <CardDescription>Current backend response while the usage dashboard remains schema-light.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs">{JSON.stringify(query.data.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
