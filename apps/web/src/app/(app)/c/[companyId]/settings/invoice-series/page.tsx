"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  useCreateInvoiceSeries,
  useDeleteInvoiceSeries,
  useInvoiceSeries,
  useUpdateInvoiceSeries,
} from "@/lib/settings/invoiceSeriesHooks";
import { getErrorMessage } from "@/lib/errors";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueRowStateBadge,
  QueueSegmentBar,
  QueueShell,
} from "@/lib/ui/queue";
import { WorkspaceConfigHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

type InvoiceSeriesRow = {
  id: string;
  code: string;
  prefix?: string | null;
  nextNumber: number;
  isActive: boolean;
};

export default function InvoiceSeriesSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const list = useInvoiceSeries(companyId);
  const create = useCreateInvoiceSeries(companyId);
  const update = useUpdateInvoiceSeries(companyId);
  const del = useDeleteInvoiceSeries(companyId);

  const [code, setCode] = React.useState("");
  const [prefix, setPrefix] = React.useState("INV-");
  const [nextNumber, setNextNumber] = React.useState("1");
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<string | null>(null);
  const [editorPrefix, setEditorPrefix] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [error, setError] = React.useState<string | null>(null);

  const rows = React.useMemo<InvoiceSeriesRow[]>(() => {
    const payload = list.data?.data as unknown;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
      return (payload as { data: InvoiceSeriesRow[] }).data;
    }
    return [];
  }, [list.data?.data]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((series) => {
      if (segment === "active") return series.isActive;
      if (segment === "inactive") return !series.isActive;
      return true;
    });
  }, [rows, segment]);
  const selectedSeries = filteredRows.find((series) => series.id === selectedSeriesId) ?? rows.find((series) => series.id === selectedSeriesId) ?? null;

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedSeriesId(null);
      return;
    }
    if (!selectedSeriesId || !filteredRows.some((series) => series.id === selectedSeriesId)) {
      setSelectedSeriesId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedSeriesId]);

  React.useEffect(() => {
    if (!selectedSeries) return;
    setEditorPrefix(selectedSeries.prefix ?? "");
  }, [selectedSeries]);

  const columns = React.useMemo<ColumnDef<InvoiceSeriesRow>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        accessorFn: (row) => row.code,
        meta: { label: "Code" },
        cell: ({ row }) => <div className="font-mono text-xs font-semibold text-[var(--foreground)]">{row.original.code}</div>,
      },
      {
        id: "prefix",
        header: "Prefix",
        accessorFn: (row) => row.prefix ?? "",
        meta: { label: "Prefix" },
        cell: ({ row }) => row.original.prefix ?? "—",
      },
      {
        id: "nextNumber",
        header: "Next number",
        accessorFn: (row) => row.nextNumber,
        meta: { label: "Next number", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.nextNumber,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
        meta: { label: "Status" },
        cell: ({ row }) => <QueueRowStateBadge label={row.original.isActive ? "Active" : "Inactive"} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-7">
      <WorkspaceConfigHero
        eyebrow="Document controls"
        title="Invoice series"
        subtitle="Manage numbering codes, prefixes, and activation state from a more structured configuration screen."
        badges={[
          <WorkspaceStatBadge key="series" label="Series" value={rows.length} />,
          <WorkspaceStatBadge key="active" label="Active" value={rows.filter((series) => series.isActive).length} variant="outline" />,
        ]}
      />

      <WorkspacePanel title="Create series" subtitle="Add another invoice numbering stream for a branch, channel, or workflow.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} series configured</Badge>
            <Badge variant="outline">Numbering control</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Code" value={code} onChange={setCode} placeholder="DEFAULT" />
            <TextField label="Prefix" value={prefix} onChange={setPrefix} placeholder="INV-" />
            <TextField label="Next number" value={nextNumber} onChange={setNextNumber} type="number" />
          </div>
          {error ? <InlineError message={error} /> : null}
          <PrimaryButton
            type="button"
            disabled={create.isPending}
            onClick={async () => {
              setError(null);
              if (!code.trim()) return setError("Code is required");
              const nn = Number(nextNumber);
              if (!Number.isFinite(nn) || nn < 1) return setError("Next number must be >= 1");
              try {
                await create.mutateAsync({ code: code.trim(), prefix: prefix.trim() || undefined, next_number: nn, is_active: true });
                setCode("");
                setNextNumber("1");
                toastSuccess("Invoice series created.");
              } catch (e: unknown) {
                const message = getErrorMessage(e, "Failed to create invoice series.");
                setError(message);
                toastError(e, {
                  fallback: "Failed to create invoice series.",
                  title: message,
                  context: "invoice-series-create",
                  metadata: { companyId },
                });
              }
            }}
          >
            {create.isPending ? "Creating…" : "Create"}
          </PrimaryButton>
        </div>
      </WorkspacePanel>

      <QueueSegmentBar
        items={[
          { id: "all", label: "All series", count: rows.length },
          { id: "active", label: "Active", count: rows.filter((series) => series.isActive).length },
          { id: "inactive", label: "Inactive", count: rows.filter((series) => !series.isActive).length },
        ]}
        value={segment}
        onValueChange={setSegment}
      />

      {list.isLoading ? <LoadingBlock label="Loading series…" /> : null}
      {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load series")} /> : null}
      {list.data && rows.length === 0 ? <EmptyState title="No series" hint="Create one above. (DEFAULT typically exists from seed.)" /> : null}

      {list.data && rows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Series editor"
              title={selectedSeries?.code ?? "Select a series"}
              subtitle={selectedSeries ? "Update the prefix here or remove a series that is no longer needed." : "Select a configured series from the list to inspect it."}
              footer={
                selectedSeries ? (
                  <QueueQuickActions>
                    <PrimaryButton
                      type="button"
                      disabled={update.isPending}
                      onClick={async () => {
                        try {
                          await update.mutateAsync({ seriesId: selectedSeries.id, patch: { prefix: editorPrefix.trim() || undefined } });
                          toastSuccess("Invoice series updated.");
                        } catch (e: unknown) {
                          toastError(e, {
                            fallback: "Failed to update invoice series.",
                            context: "invoice-series-update",
                            metadata: { companyId, seriesId: selectedSeries.id },
                          });
                        }
                      }}
                    >
                      {update.isPending ? "Saving…" : "Save prefix"}
                    </PrimaryButton>
                    <SecondaryButton
                      type="button"
                      disabled={del.isPending}
                      onClick={async () => {
                        if (!window.confirm("Delete this series?")) return;
                        try {
                          await del.mutateAsync(selectedSeries.id);
                          toastSuccess("Invoice series deleted.");
                        } catch (e: unknown) {
                          toastError(e, {
                            fallback: "Failed to delete invoice series.",
                            context: "invoice-series-delete",
                            metadata: { companyId, seriesId: selectedSeries.id },
                          });
                        }
                      }}
                    >
                      {del.isPending ? "Deleting…" : "Delete"}
                    </SecondaryButton>
                  </QueueQuickActions>
                ) : null
              }
            >
              {!selectedSeries ? (
                <EmptyState title="Select a series" hint="Choose a numbering series from the list to edit it." />
              ) : (
                <>
                  <QueueMetaList
                    items={[
                      { label: "Code", value: selectedSeries.code },
                      { label: "Next number", value: selectedSeries.nextNumber },
                      { label: "Status", value: selectedSeries.isActive ? "Active" : "Inactive" },
                    ]}
                  />
                  <TextField label="Prefix" value={editorPrefix} onChange={setEditorPrefix} placeholder="Optional prefix" />
                </>
              )}
            </QueueInspector>
          }
        >
          <WorkspacePanel title="Configured series" subtitle="Review numbering posture and select a series to edit its prefix.">
            <DataGrid
              data={filteredRows}
              columns={columns}
              getRowId={(row) => row.id}
              onRowClick={(row) => setSelectedSeriesId(row.id)}
              rowClassName={(row) => (row.original.id === selectedSeriesId ? "bg-[var(--row-selected)]" : undefined)}
              initialSorting={[{ id: "code", desc: false }]}
              toolbarTitle="Series catalog"
              toolbarDescription="Choose a series to inspect, update, or retire."
              emptyTitle="No series in this view"
              emptyHint="Try another series segment."
            />
          </WorkspacePanel>
        </QueueShell>
      ) : null}
    </div>
  );
}
