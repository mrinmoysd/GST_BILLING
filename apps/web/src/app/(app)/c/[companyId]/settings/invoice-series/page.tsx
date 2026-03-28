"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateInvoiceSeries,
  useDeleteInvoiceSeries,
  useInvoiceSeries,
  useUpdateInvoiceSeries,
} from "@/lib/settings/invoiceSeriesHooks";
import { getErrorMessage } from "@/lib/errors";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

export default function InvoiceSeriesSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const list = useInvoiceSeries(companyId);
  const create = useCreateInvoiceSeries(companyId);
  const update = useUpdateInvoiceSeries(companyId);
  const del = useDeleteInvoiceSeries(companyId);

  const [code, setCode] = React.useState("");
  const [prefix, setPrefix] = React.useState("INV-");
  const [nextNumber, setNextNumber] = React.useState("1");
  const [error, setError] = React.useState<string | null>(null);

  const rows = list.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Invoice series"
        subtitle="Manage numbering codes, prefixes, and activation state from a more structured configuration screen."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} series configured</Badge>
            <Badge variant="outline">Numbering control</Badge>
          </div>
          <CardTitle>Create series</CardTitle>
          <CardDescription>Add another invoice numbering stream for a business workflow or branch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="text-sm font-medium">Series</div>
        {list.isLoading ? <LoadingBlock label="Loading series…" /> : null}
        {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load series")} /> : null}
        {list.data && rows.length === 0 ? <EmptyState title="No series" hint="Create one above. (DEFAULT typically exists from seed.)" /> : null}

        {list.data && rows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Configured series</CardTitle>
              <CardDescription>Review and adjust prefixes or remove unused series.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Code</DataTh>
                      <DataTh>Prefix</DataTh>
                      <DataTh>Next</DataTh>
                      <DataTh>Active</DataTh>
                      <DataTh>Actions</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {rows.map((s) => (
                      <DataTr key={s.id}>
                        <DataTd className="font-mono text-xs">{s.code}</DataTd>
                        <DataTd>{s.prefix ?? "—"}</DataTd>
                        <DataTd>{s.nextNumber}</DataTd>
                        <DataTd>{s.isActive ? "Yes" : "No"}</DataTd>
                        <DataTd className="space-x-2">
                      <SecondaryButton
                        type="button"
                        disabled={update.isPending}
                        onClick={async () => {
                          const newPrefix = window.prompt("Prefix", s.prefix ?? "");
                          if (newPrefix === null) return;
                          try {
                            await update.mutateAsync({ seriesId: s.id, patch: { prefix: newPrefix } });
                            toastSuccess("Invoice series updated.");
                          } catch (e: unknown) {
                            toastError(e, {
                              fallback: "Failed to update invoice series.",
                              context: "invoice-series-update",
                              metadata: { companyId, seriesId: s.id },
                            });
                          }
                        }}
                      >
                        Edit prefix
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={del.isPending}
                        onClick={async () => {
                          if (!window.confirm("Delete this series?")) return;
                          try {
                            await del.mutateAsync(s.id);
                            toastSuccess("Invoice series deleted.");
                          } catch (e: unknown) {
                            toastError(e, {
                              fallback: "Failed to delete invoice series.",
                              context: "invoice-series-delete",
                              metadata: { companyId, seriesId: s.id },
                            });
                          }
                        }}
                      >
                        Delete
                      </SecondaryButton>
                        </DataTd>
                      </DataTr>
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
