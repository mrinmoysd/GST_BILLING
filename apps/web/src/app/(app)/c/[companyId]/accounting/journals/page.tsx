"use client";

import Link from "next/link";
import * as React from "react";

import { useCreateJournal, useJournals, useLedgers } from "@/lib/billing/hooks";
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
    <div className="space-y-6">
      <PageHeader title="Journals" subtitle="Post journal entries and view recent activity." />

      <div className="rounded-xl border bg-white p-4 space-y-4">
        <div className="text-sm font-medium">Create journal entry</div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />
          <TextField label="Narration (optional)" value={narration} onChange={setNarration} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Lines</div>
          {lines.map((l, idx) => (
            <div key={idx} className="grid gap-3 md:grid-cols-[120px_1fr_160px_auto] md:items-end">
              <div>
                <label className="block text-sm font-medium">Side</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
                <label className="block text-sm font-medium">Ledger</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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

        <div className="text-sm text-neutral-600">
          Totals — Debit: <span className="font-medium">{totals.debit}</span> | Credit: <span className="font-medium">{totals.credit}</span>
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
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Filters</div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading journals…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load journals")} /> : null}
      {query.data && journals.length === 0 ? <EmptyState title="No journals" hint="Post a journal entry to see it here." /> : null}

      {query.data && journals.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link className="text-blue-700 hover:underline" href={`/c/${companyId}/accounting/journals/${j.id}`}>
                      {j.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{j.date ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
