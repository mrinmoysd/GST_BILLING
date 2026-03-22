"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gstExportDownloadUrl, useCreateGstExport, useGstExportJob, useGstReport } from "@/lib/reports/hooks";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { PrimaryButton, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };
type ViewKey = "gstr1" | "gstr3b" | "hsn-summary" | "itc";

type GstWarningPayload = { warnings?: string[] };

type Gstr1Item = {
  product_id?: string;
  product_name?: string;
  hsn_code?: string;
  quantity?: string;
  taxable_value?: string;
  rate?: string;
  cgst_amount?: string;
  sgst_amount?: string;
  igst_amount?: string;
  cess_amount?: string;
  line_total?: string;
};

type Gstr1Row = {
  invoice_number?: string;
  invoice_date?: string;
  customer_name?: string;
  customer_gstin?: string;
  pos_state_code?: string;
  taxable_value?: string;
  cgst_amount?: string;
  sgst_amount?: string;
  igst_amount?: string;
  cess_amount?: string;
  invoice_value?: string;
  status?: string;
  items?: Gstr1Item[];
};

type CreditNoteRow = {
  note_number?: string;
  note_date?: string;
  invoice_number?: string;
  customer_gstin?: string;
  kind?: string;
  total?: string;
};

type HsnSummaryRow = {
  hsn_code?: string;
  rate?: string;
  quantity?: number;
  taxable_value?: number | string;
  cgst_amount?: number | string;
  sgst_amount?: number | string;
  igst_amount?: number | string;
  cess_amount?: number | string;
};

type Gstr1Payload = GstWarningPayload & {
  summary?: {
    invoice_count?: number;
    b2b_count?: number;
    b2c_count?: number;
    credit_note_count?: number;
  };
  b2b?: Gstr1Row[];
  b2c?: Gstr1Row[];
  cdnr?: CreditNoteRow[];
  hsn_summary?: HsnSummaryRow[];
  reconciliation?: {
    outward_taxable_value?: number;
    credit_note_value?: number;
  };
};

type Gstr3bTotals = {
  taxable_value?: number | string;
  cgst_amount?: number | string;
  sgst_amount?: number | string;
  igst_amount?: number | string;
  cess_amount?: number | string;
};

type Gstr3bPayload = GstWarningPayload & {
  outward_taxable_supplies?: Gstr3bTotals;
  credit_note_adjustments?: Gstr3bTotals & { total?: number | string };
  net_outward_supplies?: Gstr3bTotals;
  exempt_nil_non_gst?: { taxable_value?: number | string };
};

type HsnSummaryPayload = GstWarningPayload & { rows?: HsnSummaryRow[] };

type ItcRow = {
  purchase_id?: string;
  supplier_name?: string;
  supplier_gstin?: string;
  purchase_date?: string;
  taxable_value?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_amount?: number;
};

type ItcPayload = GstWarningPayload & {
  eligible_itc?: Gstr3bTotals;
  rows?: ItcRow[];
};

type GstPayload = Gstr1Payload | Gstr3bPayload | HsnSummaryPayload | ItcPayload;

function asNumber(value: number | string | undefined) {
  return Number(value ?? 0);
}

function formatMoney(value: number | string | undefined) {
  return asNumber(value).toFixed(2);
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function MetricCard(props: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{props.label}</div>
      <div className="mt-2 text-lg font-semibold text-[var(--foreground)]">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-[var(--muted)]">{props.hint}</div> : null}
    </div>
  );
}

function ComplianceTableCard(props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  );
}

export default function GstCompliancePage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [view, setView] = React.useState<ViewKey>("gstr1");
  const [exportFormat, setExportFormat] = React.useState<"json" | "csv" | "excel">("json");
  const [jobId, setJobId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const reportQuery = useGstReport({
    companyId,
    report: view,
    from: from || undefined,
    to: to || undefined,
  });
  const createExport = useCreateGstExport({ companyId });
  const jobQuery = useGstExportJob({ companyId, jobId, enabled: Boolean(jobId) });

  const payload = reportQuery.data?.data as GstPayload | undefined;
  const job = jobQuery.data?.data as { status?: string; resultFileName?: string; type?: string; createdAt?: string } | undefined;
  const gstr1Payload = payload as Gstr1Payload | undefined;
  const gstr3bPayload = payload as Gstr3bPayload | undefined;
  const hsnPayload = payload as HsnSummaryPayload | undefined;
  const itcPayload = payload as ItcPayload | undefined;

  const summaryCards =
    view === "gstr1"
      ? [
          { label: "Invoices", value: gstr1Payload?.summary?.invoice_count ?? 0 },
          { label: "B2B", value: gstr1Payload?.summary?.b2b_count ?? 0 },
          { label: "B2C", value: gstr1Payload?.summary?.b2c_count ?? 0 },
          { label: "Credit notes", value: gstr1Payload?.summary?.credit_note_count ?? 0 },
        ]
      : view === "gstr3b"
        ? [
            { label: "Net taxable", value: formatMoney(gstr3bPayload?.net_outward_supplies?.taxable_value) },
            { label: "CGST", value: formatMoney(gstr3bPayload?.net_outward_supplies?.cgst_amount) },
            { label: "SGST", value: formatMoney(gstr3bPayload?.net_outward_supplies?.sgst_amount) },
            { label: "IGST", value: formatMoney(gstr3bPayload?.net_outward_supplies?.igst_amount) },
          ]
        : view === "hsn-summary"
          ? [
              { label: "HSN rows", value: hsnPayload?.rows?.length ?? 0 },
              { label: "Taxable value", value: formatMoney((hsnPayload?.rows ?? []).reduce((sum, row) => sum + asNumber(row.taxable_value), 0)) },
              { label: "CGST", value: formatMoney((hsnPayload?.rows ?? []).reduce((sum, row) => sum + asNumber(row.cgst_amount), 0)) },
              { label: "IGST", value: formatMoney((hsnPayload?.rows ?? []).reduce((sum, row) => sum + asNumber(row.igst_amount), 0)) },
            ]
          : [
              { label: "Eligible taxable", value: formatMoney(itcPayload?.eligible_itc?.taxable_value) },
              { label: "CGST ITC", value: formatMoney(itcPayload?.eligible_itc?.cgst_amount) },
              { label: "SGST ITC", value: formatMoney(itcPayload?.eligible_itc?.sgst_amount) },
              { label: "IGST ITC", value: formatMoney(itcPayload?.eligible_itc?.igst_amount) },
            ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="GST"
        title="GST compliance center"
        subtitle="Review GSTR-1, GSTR-3B, HSN summary, and ITC data from a single compliance workspace with filing-ready sections."
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Choose a GST view, period, and export format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
              <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Report</label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                value={view}
                onChange={(e) => setView(e.target.value as ViewKey)}
              >
                <option value="gstr1">GSTR-1</option>
                <option value="gstr3b">GSTR-3B</option>
                <option value="hsn-summary">HSN summary</option>
                <option value="itc">ITC</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Export format</label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as "json" | "csv" | "excel")}
              >
                <option value="json">Portal JSON</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            {error ? <InlineError message={error} /> : null}

            <PrimaryButton
              type="button"
              disabled={createExport.isPending}
              onClick={async () => {
                setError(null);
                try {
                  const res = await createExport.mutateAsync({
                    report: view === "hsn-summary" ? "hsn" : view,
                    format: exportFormat,
                    from: from || undefined,
                    to: to || undefined,
                  });
                  const data = res?.data as { id?: string; jobId?: string } | undefined;
                  const nextJobId = data?.jobId ?? data?.id;
                  if (!nextJobId) {
                    setError("Export job was created but job id is missing.");
                    return;
                  }
                  setJobId(nextJobId);
                } catch (err: unknown) {
                  setError(getErrorMessage(err, "Failed to create export job"));
                }
              }}
            >
              {createExport.isPending ? "Creating…" : "Create export"}
            </PrimaryButton>
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Deterministic GST engine</Badge>
              <Badge variant="outline">JSON / CSV / Excel</Badge>
            </div>
            <CardTitle>Current view summary</CardTitle>
            <CardDescription>Compliance totals update from the GST API using the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <MetricCard key={card.label} label={card.label} value={card.value} />
            ))}
          </CardContent>
        </Card>
      </div>

      {reportQuery.isLoading ? <LoadingBlock label="Loading GST report…" /> : null}
      {reportQuery.isError ? <InlineError message={getErrorMessage(reportQuery.error, "Failed to load GST report")} /> : null}

      {payload ? (
        <div className="space-y-6">
          {view === "gstr1" ? (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Reconciliation</CardTitle>
                    <CardDescription>Cross-check outward taxable turnover against credit-note reductions.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <MetricCard
                      label="Outward taxable value"
                      value={formatMoney(gstr1Payload?.reconciliation?.outward_taxable_value)}
                    />
                    <MetricCard
                      label="Credit note value"
                      value={formatMoney(gstr1Payload?.reconciliation?.credit_note_value)}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Export status</CardTitle>
                    <CardDescription>Track the latest GST export job and download the generated file.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {jobId ? (
                      <>
                        <div className="text-sm text-[var(--muted)]">
                          Latest job: <code>{jobId}</code>
                        </div>
                        {jobQuery.isLoading ? <LoadingBlock label="Checking export status…" /> : null}
                        {jobQuery.isError ? <InlineError message={getErrorMessage(jobQuery.error, "Failed to fetch export job")} /> : null}
                        {job ? (
                          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                            <div className="text-sm text-[var(--foreground)]">
                              Status: <span className="font-semibold">{job.status ?? "—"}</span>
                            </div>
                            {job.status === "succeeded" ? (
                              <div className="mt-3">
                                <a className="font-medium text-[var(--accent)] underline" href={gstExportDownloadUrl(companyId, jobId)} target="_blank" rel="noreferrer">
                                  Download {job.resultFileName ? `(${job.resultFileName})` : "export"}
                                </a>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                        Create an export to start tracking file generation status.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <ComplianceTableCard title="B2B invoices" description="Registered-customer outward supplies grouped for GSTR-1 filing review.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Invoice</DataTh>
                        <DataTh>Customer</DataTh>
                        <DataTh>GSTIN</DataTh>
                        <DataTh>POS</DataTh>
                        <DataTh className="text-right">Taxable</DataTh>
                        <DataTh className="text-right">CGST</DataTh>
                        <DataTh className="text-right">SGST</DataTh>
                        <DataTh className="text-right">IGST</DataTh>
                        <DataTh className="text-right">Value</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(gstr1Payload?.b2b ?? []).length === 0 ? (
                        <DataEmptyRow colSpan={9} title="No B2B invoices in this period." />
                      ) : (
                        (gstr1Payload?.b2b ?? []).map((row) => (
                          <DataTr key={`${row.invoice_number}-${row.invoice_date}`}>
                            <DataTd>
                              <div className="font-semibold">{row.invoice_number || "—"}</div>
                              <div className="text-xs text-[var(--muted)]">{row.invoice_date || "—"}</div>
                            </DataTd>
                            <DataTd>{row.customer_name || "—"}</DataTd>
                            <DataTd>{row.customer_gstin || "—"}</DataTd>
                            <DataTd>{row.pos_state_code || "—"}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.taxable_value)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.cgst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.sgst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.igst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.invoice_value)}</DataTd>
                          </DataTr>
                        ))
                      )}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </ComplianceTableCard>

              <ComplianceTableCard title="B2C invoices" description="Unregistered-customer outward supplies with state-of-supply breakup.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Invoice</DataTh>
                        <DataTh>Customer</DataTh>
                        <DataTh>POS</DataTh>
                        <DataTh className="text-right">Taxable</DataTh>
                        <DataTh className="text-right">CGST</DataTh>
                        <DataTh className="text-right">SGST</DataTh>
                        <DataTh className="text-right">IGST</DataTh>
                        <DataTh className="text-right">Value</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(gstr1Payload?.b2c ?? []).length === 0 ? (
                        <DataEmptyRow colSpan={8} title="No B2C invoices in this period." />
                      ) : (
                        (gstr1Payload?.b2c ?? []).map((row) => (
                          <DataTr key={`${row.invoice_number}-${row.invoice_date}`}>
                            <DataTd>
                              <div className="font-semibold">{row.invoice_number || "—"}</div>
                              <div className="text-xs text-[var(--muted)]">{row.invoice_date || "—"}</div>
                            </DataTd>
                            <DataTd>{row.customer_name || "Walk-in customer"}</DataTd>
                            <DataTd>{row.pos_state_code || "—"}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.taxable_value)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.cgst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.sgst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.igst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.invoice_value)}</DataTd>
                          </DataTr>
                        ))
                      )}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </ComplianceTableCard>

              <div className="grid gap-6 xl:grid-cols-2">
                <ComplianceTableCard title="Credit notes" description="Registered credit/debit note adjustments included in the filing set.">
                  <DataTableShell>
                    <DataTable>
                      <DataThead>
                        <tr>
                          <DataTh>Note</DataTh>
                          <DataTh>Invoice</DataTh>
                          <DataTh>GSTIN</DataTh>
                          <DataTh>Kind</DataTh>
                          <DataTh className="text-right">Total</DataTh>
                        </tr>
                      </DataThead>
                      <tbody>
                        {(gstr1Payload?.cdnr ?? []).length === 0 ? (
                          <DataEmptyRow colSpan={5} title="No credit notes in this period." />
                        ) : (
                          (gstr1Payload?.cdnr ?? []).map((row) => (
                            <DataTr key={`${row.note_number}-${row.note_date}`}>
                              <DataTd>
                                <div className="font-semibold">{row.note_number || "—"}</div>
                                <div className="text-xs text-[var(--muted)]">{row.note_date || "—"}</div>
                              </DataTd>
                              <DataTd>{row.invoice_number || "—"}</DataTd>
                              <DataTd>{row.customer_gstin || "—"}</DataTd>
                              <DataTd>{row.kind || "—"}</DataTd>
                              <DataTd className="text-right">{formatMoney(row.total)}</DataTd>
                            </DataTr>
                          ))
                        )}
                      </tbody>
                    </DataTable>
                  </DataTableShell>
                </ComplianceTableCard>

                <ComplianceTableCard title="HSN summary" description="Tax rate and HSN-wise outward supply rollup used during filing reconciliation.">
                  <DataTableShell>
                    <DataTable>
                      <DataThead>
                        <tr>
                          <DataTh>HSN</DataTh>
                          <DataTh>Rate</DataTh>
                          <DataTh className="text-right">Qty</DataTh>
                          <DataTh className="text-right">Taxable</DataTh>
                          <DataTh className="text-right">CGST</DataTh>
                          <DataTh className="text-right">SGST</DataTh>
                          <DataTh className="text-right">IGST</DataTh>
                        </tr>
                      </DataThead>
                      <tbody>
                        {(gstr1Payload?.hsn_summary ?? []).length === 0 ? (
                          <DataEmptyRow colSpan={7} title="No HSN summary rows in this period." />
                        ) : (
                          (gstr1Payload?.hsn_summary ?? []).map((row, index) => (
                            <DataTr key={`${row.hsn_code}-${row.rate}-${index}`}>
                              <DataTd>{row.hsn_code || "UNSPECIFIED"}</DataTd>
                              <DataTd>{row.rate || "0"}</DataTd>
                              <DataTd className="text-right">{Number(row.quantity ?? 0).toFixed(2)}</DataTd>
                              <DataTd className="text-right">{formatMoney(row.taxable_value)}</DataTd>
                              <DataTd className="text-right">{formatMoney(row.cgst_amount)}</DataTd>
                              <DataTd className="text-right">{formatMoney(row.sgst_amount)}</DataTd>
                              <DataTd className="text-right">{formatMoney(row.igst_amount)}</DataTd>
                            </DataTr>
                          ))
                        )}
                      </tbody>
                    </DataTable>
                  </DataTableShell>
                </ComplianceTableCard>
              </div>
            </>
          ) : null}

          {view === "gstr3b" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Outward taxable supplies</CardTitle>
                  <CardDescription>Section-wise totals for outward liability before adjustments.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Taxable" value={formatMoney(gstr3bPayload?.outward_taxable_supplies?.taxable_value)} />
                  <MetricCard label="CGST" value={formatMoney(gstr3bPayload?.outward_taxable_supplies?.cgst_amount)} />
                  <MetricCard label="SGST" value={formatMoney(gstr3bPayload?.outward_taxable_supplies?.sgst_amount)} />
                  <MetricCard label="IGST" value={formatMoney(gstr3bPayload?.outward_taxable_supplies?.igst_amount)} />
                  <MetricCard label="CESS" value={formatMoney(gstr3bPayload?.outward_taxable_supplies?.cess_amount)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Credit note adjustments</CardTitle>
                  <CardDescription>Liability reductions that will be offset before filing GSTR-3B.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Adjustment total" value={formatMoney(gstr3bPayload?.credit_note_adjustments?.total)} />
                  <MetricCard label="Taxable" value={formatMoney(gstr3bPayload?.credit_note_adjustments?.taxable_value)} />
                  <MetricCard label="CGST" value={formatMoney(gstr3bPayload?.credit_note_adjustments?.cgst_amount)} />
                  <MetricCard label="SGST" value={formatMoney(gstr3bPayload?.credit_note_adjustments?.sgst_amount)} />
                  <MetricCard label="IGST" value={formatMoney(gstr3bPayload?.credit_note_adjustments?.igst_amount)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Net outward supplies</CardTitle>
                  <CardDescription>Post-adjustment liability that should flow to the return working.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Taxable" value={formatMoney(gstr3bPayload?.net_outward_supplies?.taxable_value)} />
                  <MetricCard label="CGST" value={formatMoney(gstr3bPayload?.net_outward_supplies?.cgst_amount)} />
                  <MetricCard label="SGST" value={formatMoney(gstr3bPayload?.net_outward_supplies?.sgst_amount)} />
                  <MetricCard label="IGST" value={formatMoney(gstr3bPayload?.net_outward_supplies?.igst_amount)} />
                  <MetricCard label="CESS" value={formatMoney(gstr3bPayload?.net_outward_supplies?.cess_amount)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exempt / Nil / Non-GST</CardTitle>
                  <CardDescription>Zero-rate outward turnover requiring disclosure in the return.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MetricCard label="Taxable value" value={formatMoney(gstr3bPayload?.exempt_nil_non_gst?.taxable_value)} />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {view === "hsn-summary" ? (
            <ComplianceTableCard title="HSN summary" description="Export-ready HSN-wise tax rollup for the selected filing period.">
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>HSN</DataTh>
                      <DataTh>Rate</DataTh>
                      <DataTh className="text-right">Qty</DataTh>
                      <DataTh className="text-right">Taxable</DataTh>
                      <DataTh className="text-right">CGST</DataTh>
                      <DataTh className="text-right">SGST</DataTh>
                      <DataTh className="text-right">IGST</DataTh>
                      <DataTh className="text-right">CESS</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {(hsnPayload?.rows ?? []).length === 0 ? (
                      <DataEmptyRow colSpan={8} title="No HSN rows in this period." />
                    ) : (
                      (hsnPayload?.rows ?? []).map((row, index) => (
                        <DataTr key={`${row.hsn_code}-${row.rate}-${index}`}>
                          <DataTd>{row.hsn_code || "UNSPECIFIED"}</DataTd>
                          <DataTd>{row.rate || "0"}</DataTd>
                          <DataTd className="text-right">{Number(row.quantity ?? 0).toFixed(2)}</DataTd>
                          <DataTd className="text-right">{formatMoney(row.taxable_value)}</DataTd>
                          <DataTd className="text-right">{formatMoney(row.cgst_amount)}</DataTd>
                          <DataTd className="text-right">{formatMoney(row.sgst_amount)}</DataTd>
                          <DataTd className="text-right">{formatMoney(row.igst_amount)}</DataTd>
                          <DataTd className="text-right">{formatMoney(row.cess_amount)}</DataTd>
                        </DataTr>
                      ))
                    )}
                  </tbody>
                </DataTable>
              </DataTableShell>
            </ComplianceTableCard>
          ) : null}

          {view === "itc" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Eligible ITC summary</CardTitle>
                  <CardDescription>Supplier-backed purchase tax available for credit after purchase-return adjustments.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <MetricCard label="Taxable" value={formatMoney(itcPayload?.eligible_itc?.taxable_value)} />
                  <MetricCard label="CGST" value={formatMoney(itcPayload?.eligible_itc?.cgst_amount)} />
                  <MetricCard label="SGST" value={formatMoney(itcPayload?.eligible_itc?.sgst_amount)} />
                  <MetricCard label="IGST" value={formatMoney(itcPayload?.eligible_itc?.igst_amount)} />
                  <MetricCard label="CESS" value={formatMoney(itcPayload?.eligible_itc?.cess_amount)} />
                </CardContent>
              </Card>

              <ComplianceTableCard title="ITC eligibility rows" description="Purchase-level ITC entries with supplier GST identity and tax breakup.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Purchase date</DataTh>
                        <DataTh>Supplier</DataTh>
                        <DataTh>GSTIN</DataTh>
                        <DataTh className="text-right">Taxable</DataTh>
                        <DataTh className="text-right">CGST</DataTh>
                        <DataTh className="text-right">SGST</DataTh>
                        <DataTh className="text-right">IGST</DataTh>
                        <DataTh className="text-right">CESS</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(itcPayload?.rows ?? []).length === 0 ? (
                        <DataEmptyRow colSpan={8} title="No ITC-eligible purchases in this period." />
                      ) : (
                        (itcPayload?.rows ?? []).map((row) => (
                          <DataTr key={row.purchase_id}>
                            <DataTd>{row.purchase_date || "—"}</DataTd>
                            <DataTd>{row.supplier_name || "—"}</DataTd>
                            <DataTd>{row.supplier_gstin || "—"}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.taxable_value)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.cgst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.sgst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.igst_amount)}</DataTd>
                            <DataTd className="text-right">{formatMoney(row.cess_amount)}</DataTd>
                          </DataTr>
                        ))
                      )}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </ComplianceTableCard>
            </>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Warnings</CardTitle>
              <CardDescription>Rows that need review before filing or export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(payload.warnings ?? []).length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                  No GST warnings were produced for the selected period.
                </div>
              ) : (
                (payload.warnings ?? []).map((warning: string, index: number) => (
                  <div key={`${warning}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
                    {warning}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
