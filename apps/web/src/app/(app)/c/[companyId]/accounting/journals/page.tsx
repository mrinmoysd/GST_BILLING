"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useAccountingPeriodLock, useCreateJournal, useJournals, useLedgers, useUpdateAccountingPeriodLock } from "@/lib/billing/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatDateLabel } from "@/lib/format/date";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

type LineDraft = { side: "debit" | "credit"; ledgerId: string; amount: string };
type JournalRow = {
  id: string;
  date?: string | null;
  is_system_generated?: boolean | null;
  source_type?: string | null;
  source_id?: string | null;
};

export default function JournalsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useJournals({ companyId: companyId, from: from || undefined, to: to || undefined, page: 1, limit: 20 });
  const ledgers = useLedgers(companyId);
  const create = useCreateJournal(companyId);
  const periodLock = useAccountingPeriodLock(companyId);
  const updatePeriodLock = useUpdateAccountingPeriodLock(companyId);

  const [date, setDate] = React.useState("");
  const [narration, setNarration] = React.useState("");
  const [lockUntil, setLockUntil] = React.useState("");
  const [lockReason, setLockReason] = React.useState("");
  const [lines, setLines] = React.useState<LineDraft[]>([
    { side: "debit", ledgerId: "", amount: "" },
    { side: "credit", ledgerId: "", amount: "" },
  ]);

  const [error, setError] = React.useState<string | null>(null);

  const ledgerRows = ledgers.data?.data ?? [];
  const journals = (query.data?.data.data ?? []) as JournalRow[];
  const lockData = periodLock.data?.data.data;

  React.useEffect(() => {
    setLockUntil(lockData?.lock_until ?? "");
    setLockReason(lockData?.reason ?? "");
  }, [lockData?.lock_until, lockData?.reason]);

  const totals = lines.reduce(
    (acc, l) => {
      const amt = Number(l.amount || 0);
      if (l.side === "debit") acc.debit += amt;
      else acc.credit += amt;
      return acc;
    },
    { debit: 0, credit: 0 },
  );

  const journalColumns = React.useMemo<ColumnDef<JournalRow>[]>(
    () => [
      {
        id: "id",
        header: "ID",
        accessorFn: (journal) => journal.id,
        meta: { label: "ID" },
        cell: ({ row }) => (
          <Link className="font-medium text-[var(--secondary-strong)] transition hover:text-[var(--foreground)]" href={`/c/${companyId}/accounting/journals/${row.original.id}`}>
            {row.original.id}
          </Link>
        ),
      },
      {
        id: "date",
        header: "Date",
        accessorFn: (journal) => journal.date ?? "",
        meta: { label: "Date" },
        cell: ({ row }) => formatDateLabel(row.original.date),
      },
      {
        id: "mode",
        header: "Mode",
        accessorFn: (journal) => journal.is_system_generated ? "Auto" : "Manual",
        meta: { label: "Mode" },
        cell: ({ row }) => (row.original.is_system_generated ? "Auto" : "Manual"),
      },
      {
        id: "source",
        header: "Source",
        accessorFn: (journal) => journal.source_type ? `${journal.source_type}${journal.source_id ? `:${journal.source_id}` : ""}` : "—",
        meta: { label: "Source" },
        cell: ({ row }) => row.original.source_type ? `${row.original.source_type}${row.original.source_id ? `:${row.original.source_id}` : ""}` : "—",
      },
    ],
    [companyId],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Journals"
        subtitle="Post balanced entries, manage book lock discipline, and review the journal stream without turning the page into a card stack."
        badges={[
          <WorkspaceStatBadge key="ledgers" label="Ledgers" value={ledgerRows.length} />,
          <WorkspaceStatBadge key="period" label="Period" value={lockData?.lock_until ? `Locked through ${lockData.lock_until}` : "Open"} variant={lockData?.lock_until ? "secondary" : "outline"} />,
        ]}
        aside={
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Debit" value={totals.debit.toFixed(2)} tone="quiet" />
            <StatCard label="Credit" value={totals.credit.toFixed(2)} tone="quiet" />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <WorkspacePanel
        title="Period lock"
        subtitle="Close completed books by preventing new journal and auto-posted activity up to a specific date."
        tone="muted"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DateField label="Lock until" value={lockUntil} onChange={setLockUntil} />
            <TextField label="Reason (optional)" value={lockReason} onChange={setLockReason} />
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              type="button"
              disabled={updatePeriodLock.isPending}
              onClick={async () => {
                setError(null);
                try {
                  await updatePeriodLock.mutateAsync({
                    lock_until: lockUntil.trim() || null,
                    reason: lockReason.trim() || null,
                  });
                  toastSuccess("Period lock updated.");
                } catch (e: unknown) {
                  const message = getErrorMessage(e, "Failed to update period lock.");
                  setError(message);
                  toastError(e, {
                    fallback: "Failed to update period lock.",
                    title: message,
                    context: "journals-period-lock-update",
                    metadata: { companyId, lockUntil },
                  });
                }
              }}
            >
              {updatePeriodLock.isPending ? "Saving…" : "Save period lock"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={updatePeriodLock.isPending}
              onClick={async () => {
                setError(null);
                try {
                  await updatePeriodLock.mutateAsync({ lock_until: null, reason: null });
                  toastSuccess("Period lock cleared.");
                } catch (e: unknown) {
                  const message = getErrorMessage(e, "Failed to clear period lock.");
                  setError(message);
                  toastError(e, {
                    fallback: "Failed to clear period lock.",
                    title: message,
                    context: "journals-period-lock-clear",
                    metadata: { companyId },
                  });
                }
              }}
            >
              Clear lock
            </SecondaryButton>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Create journal entry"
        subtitle="Build a balanced debit-credit entry and post it directly into the accounting subsystem."
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
          <DateField label="Date" value={date} onChange={setDate} />
          <TextField label="Narration (optional)" value={narration} onChange={setNarration} />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-[var(--muted-strong)]">Lines</div>
          {lines.map((l, idx) => (
            <div key={idx} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-[120px_1fr_160px_auto] md:items-end">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Side</label>
                <SelectField
                  label="Side"
                  value={l.side}
                  onChange={(value) =>
                    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, side: value === "credit" ? "credit" : "debit" } : x)))
                  }
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </SelectField>
              </div>

              <SelectField
                label="Ledger"
                value={l.ledgerId}
                onChange={(value) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, ledgerId: value } : x)))}
              >
                  <option value="">Select…</option>
                  {ledgerRows.map((lr) => (
                    <option key={lr.id} value={lr.id}>
                      {lr.name}
                    </option>
                  ))}
              </SelectField>

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

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted)] [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
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
                toastSuccess("Journal posted.");
              } catch (e: unknown) {
                const message = getErrorMessage(e, "Failed to create journal.");
                setError(message);
                toastError(e, {
                  fallback: "Failed to create journal.",
                  title: message,
                  context: "journals-create",
                  metadata: { companyId, date: date.trim() },
                });
              }
            }}
          >
            {create.isPending ? "Posting…" : "Post journal"}
          </PrimaryButton>
        </div>
      </WorkspacePanel>
      </div>

      <WorkspaceFilterBar
        summary={
          <>
            <Badge variant="outline">{journals.length} visible</Badge>
            <Badge variant="secondary">{query.data?.data.meta?.total ?? 0} total</Badge>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>
      </WorkspaceFilterBar>

      {query.isLoading ? <LoadingBlock label="Loading journals…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load journals")} /> : null}
      {query.data && journals.length === 0 ? <EmptyState title="No journals" hint="Post a journal entry to see it here." /> : null}

      {query.data && journals.length > 0 ? (
        <WorkspaceSection eyebrow="Accounting stream" title="Recent journals" subtitle="Most recent journal entries returned by the current query.">
          <DataGrid
            data={journals}
            columns={journalColumns}
            getRowId={(row) => row.id}
            initialSorting={[{ id: "date", desc: true }]}
            toolbarTitle="Journal stream"
            toolbarDescription="Review the current accounting stream with sortable columns and less visual noise."
          />
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
