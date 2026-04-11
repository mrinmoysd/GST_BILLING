"use client";

import * as React from "react";

import { useCreateLedger, useLedgers } from "@/lib/billing/hooks";
import { formatDateLabel } from "@/lib/format/date";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };

type LedgerRow = {
  id: string;
  name?: string | null;
  type?: string | null;
  account_code?: string | null;
  createdAt?: string | null;
};


export default function LedgersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const query = useLedgers(companyId);
  const create = useCreateLedger(companyId);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [q, setQ] = React.useState("");
  const [selectedLedgerId, setSelectedLedgerId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const rows = React.useMemo(() => (query.data?.data ?? []) as LedgerRow[], [query.data]);
  const filteredRows = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.name, row.account_code, row.type].some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [q, rows]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedLedgerId("");
      return;
    }
    if (!selectedLedgerId || !filteredRows.some((row) => row.id === selectedLedgerId)) {
      setSelectedLedgerId(filteredRows[0]?.id ?? "");
    }
  }, [filteredRows, selectedLedgerId]);

  const selectedLedger = filteredRows.find((row) => row.id === selectedLedgerId) ?? filteredRows[0] ?? null;
  const typeCounts = React.useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.type ?? "Unclassified");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  const columns = React.useMemo<ColumnDef<LedgerRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessorFn: (ledger) => ledger.name ?? "",
        meta: { label: "Name" },
        cell: ({ row }) => <div className="font-medium text-[var(--foreground)]">{row.original.name ?? "—"}</div>,
      },
      {
        id: "type",
        header: "Type",
        accessorFn: (ledger) => ledger.type ?? "",
        meta: { label: "Type" },
        cell: ({ row }) => row.original.type ?? "—",
      },
      {
        id: "code",
        header: "Code",
        accessorFn: (ledger) => ledger.account_code ?? "",
        meta: { label: "Code" },
        cell: ({ row }) => row.original.account_code ?? "—",
      },
      {
        id: "createdAt",
        header: "Created",
        accessorFn: (ledger) => ledger.createdAt ?? "",
        meta: { label: "Created" },
        cell: ({ row }) => formatDateLabel(row.original.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Accounting"
        title="Ledgers"
        subtitle="Keep ledger creation and chart review in one serious workspace, with the selected account context visible while the main table stays dense and readable."
        badges={[
          <WorkspaceStatBadge key="total" label="Ledgers" value={rows.length} />,
          <WorkspaceStatBadge key="types" label="Classes" value={Object.keys(typeCounts).length} variant="outline" />,
        ]}
      />

      <WorkspacePanel title="Create ledger" subtitle="Add the account first, then continue chart review from the same finance workspace.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Type (optional)" value={type} onChange={setType} placeholder="ASSET / LIABILITY / INCOME / EXPENSE" />
        </div>
        {error ? <InlineError message={error} /> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <PrimaryButton
            type="button"
            disabled={create.isPending}
            onClick={async () => {
              setError(null);
              if (!name.trim()) return setError("Enter a ledger name.");
              try {
                await create.mutateAsync({ name: name.trim(), type: type.trim() || undefined });
                setName("");
                setType("");
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Failed to create ledger"));
              }
            }}
          >
            {create.isPending ? "Creating…" : "Create ledger"}
          </PrimaryButton>
          <SecondaryButton
            type="button"
            onClick={() => {
              setName("");
              setType("");
              setError(null);
            }}
          >
            Clear
          </SecondaryButton>
        </div>
      </WorkspacePanel>

      <QueueToolbar filters={<TextField label="Search ledgers" value={q} onChange={setQ} placeholder="Name / code / type" />} />

      {query.isLoading ? <LoadingBlock label="Loading ledgers…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load ledgers")} /> : null}
      {query.data && filteredRows.length === 0 ? <EmptyState title="No ledgers" hint="Create a ledger to start posting journals." /> : null}

      {query.data && filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected ledger"
              title={selectedLedger?.name ?? "Select ledger"}
              subtitle="Keep account classification and reference context visible while working the chart table."
              footer={
                selectedLedger ? (
                  <QueueQuickActions>
                    <SecondaryButton type="button">Ledger selected</SecondaryButton>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedLedger ? (
                <QueueMetaList
                  items={[
                    { label: "Type", value: selectedLedger.type ?? "Unclassified" },
                    { label: "Code", value: selectedLedger.account_code ?? "—" },
                    { label: "Created", value: selectedLedger.createdAt?.slice?.(0, 10) ?? "—" },
                  ]}
                />
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a ledger to inspect its classification.</div>
              )}
            </QueueInspector>
          }
        >
          <DataGrid
            data={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={(row) => setSelectedLedgerId(row.id)}
            rowClassName={(row) =>
              selectedLedger?.id === row.original.id
                ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                : "hover:bg-[var(--surface-secondary)]"
            }
            initialSorting={[{ id: "name", desc: false }]}
            toolbarTitle="Chart of accounts"
            toolbarDescription="Sort and trim visible columns while keeping the selected account context beside the ledger register."
          />
        </QueueShell>
      ) : null}
    </div>
  );
}
