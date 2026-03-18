"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateJournal, useJournals, useLedgers } from "@/lib/billing/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type LineDraft = { side: "debit" | "credit"; ledgerId: string; amount: string };

export default function JournalsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useJournals({ companyId: companyId, from: from || undefined, to: to || undefined, page: 1, limit: 20 });
  const ledgers = useLedgers(companyId);
  const create = useCreateJournal(companyId);

  const [date, setDate] = React.useState("");
  const [narration, setNarration] = React.useState("");
  const [lines, setLines] = React.useState<LineDraft[]>([
    { side: "debit", ledgerId: "", amount: "" },
    { side: "credit", ledgerId: "", amount: "" },
  ]);

  const [error, setError] = React.useState<string | null>(null);

  const ledgerRows = ledgers.data?.data ?? [];
  const journals = query.data?.data.data ?? [];

  const totals = lines.reduce(
    (acc, l) => {
      const amt = Number(l.amount || 0);
      if (l.side === "debit") acc.debit += amt;
      else acc.credit += amt;
      return acc;
    },
    { debit: 0, credit: 0 },
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounting"
        title="Journals"
        subtitle="Create balanced journal entries and review recent posting activity from a stronger workspace layout."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{ledgerRows.length} ledgers available</Badge>
            <Badge variant="outline">Manual posting</Badge>
          </div>
          <CardTitle>Create journal entry</CardTitle>
          <CardDescription>Build a balanced debit-credit entry and post it directly into the accounting subsystem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />
          <TextField label="Narration (optional)" value={narration} onChange={setNarration} />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-[var(--muted-strong)]">Lines</div>
          {lines.map((l, idx) => (
            <div key={idx} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-[120px_1fr_160px_auto] md:items-end">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Side</label>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                  value={l.side}
                  onChange={(e) => {
                    const side = e.target.value === "credit" ? "credit" : "debit";
                    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, side } : x)));
                  }}
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Ledger</label>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                  value={l.ledgerId}
                  onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, ledgerId: e.target.value } : x)))}
                >
                  <option value="">Select…</option>
                  {ledgerRows.map((lr) => (
                    <option key={lr.id} value={lr.id}>
                      {lr.name}
                    </option>
                  ))}
                </select>
              </div>

              <TextField
                label="Amount"
                value={l.amount}
                onChange={(v) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, amount: v } : x)))}
                type="number"
              />

              <SecondaryButton
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                disabled={lines.length <= 2}
              >
                Remove
              </SecondaryButton>
            </div>
          ))}
          <SecondaryButton type="button" onClick={() => setLines((prev) => [...prev, { side: "debit", ledgerId: "", amount: "" }])}>
            Add line
          </SecondaryButton>
        </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
            Totals. Debit: <span className="font-semibold text-[var(--foreground)]">{totals.debit}</span> | Credit:{" "}
            <span className="font-semibold text-[var(--foreground)]">{totals.credit}</span>
          </div>

          {error ? <InlineError message={error} /> : null}

          <PrimaryButton
            type="button"
            disabled={create.isPending}
            onClick={async () => {
              setError(null);
              if (!date.trim()) return setError("Enter a date.");
              if (lines.length < 2) return setError("Add at least 2 lines.");
              if (totals.debit !== totals.credit) return setError("Debit and credit totals must match.");

              const payloadLines = lines.map((l) => {
                if (!l.ledgerId) throw new Error("Select ledger for each line");
                if (!l.amount || Number(l.amount) <= 0) throw new Error("Enter amount for each line");
                return l.side === "debit"
                  ? { debit_ledger_id: l.ledgerId, amount: l.amount }
                  : { credit_ledger_id: l.ledgerId, amount: l.amount };
              });

              try {
                await create.mutateAsync({ date: date.trim(), narration: narration.trim() || undefined, lines: payloadLines });
                setNarration("");
                setLines([
                  { side: "debit", ledgerId: "", amount: "" },
                  { side: "credit", ledgerId: "", amount: "" },
                ]);
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Failed to create journal"));
              }
            }}
          >
            {create.isPending ? "Posting…" : "Post journal"}
          </PrimaryButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter the recent journal list by date range.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading journals…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load journals")} /> : null}
      {query.data && journals.length === 0 ? <EmptyState title="No journals" hint="Post a journal entry to see it here." /> : null}

      {query.data && journals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent journals</CardTitle>
            <CardDescription>Most recent journal entries returned by the current query.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>ID</DataTh>
                    <DataTh>Date</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {journals.map((j) => (
                    <DataTr key={j.id}>
                      <DataTd>
                        <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/accounting/journals/${j.id}`}>
                          {j.id}
                        </Link>
                      </DataTd>
                      <DataTd>{j.date ?? "—"}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
