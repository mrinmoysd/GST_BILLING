"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exportDownloadUrl, useCreateGstr1Export, useExportJob } from "@/lib/reports/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function Gstr1ExportPage({ params }: Props) {
  const { companyId } = React.use(params);
  const create = useCreateGstr1Export({ companyId: companyId });
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [jobId, setJobId] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const jobQuery = useExportJob({ companyId: companyId, jobId, enabled: Boolean(jobId) });
  const job = jobQuery.data?.data as unknown as { status?: string; resultFileName?: string } | undefined;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="GST"
        title="GSTR1 export"
        subtitle="Create the current GST export job and monitor download readiness from a more explicit compliance flow."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create export job</CardTitle>
            <CardDescription>Provide a period and enqueue the current CSV-based export process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
              <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
            </div>
            {error ? <InlineError message={error} /> : null}
            <PrimaryButton
              type="button"
              disabled={create.isPending}
              onClick={async () => {
                setError(null);
                try {
                  const res = await create.mutateAsync({ from: from || undefined, to: to || undefined });
                  const maybe = res?.data as unknown as { jobId?: string; id?: string } | undefined;
                  const id = maybe?.jobId ?? maybe?.id;
                  if (!id) {
                    setError("Export job created but job id missing in response.");
                    return;
                  }
                  setJobId(id);
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to create export job"));
                }
              }}
            >
              {create.isPending ? "Creating…" : "Create export"}
            </PrimaryButton>
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <CardTitle>Current workflow note</CardTitle>
            <CardDescription>The export flow is job-based today. Full GST-return modelling is still planned separately.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">Async export job</Badge>
            <Badge variant="outline">CSV download</Badge>
          </CardContent>
        </Card>
      </div>

      {jobId ? (
        <Card>
          <CardHeader>
            <CardTitle>Export job status</CardTitle>
            <CardDescription>Track the current job and download the result once generation completes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              Job: <code>{jobId}</code>
            </div>
            {jobQuery.isLoading ? <LoadingBlock label="Checking status…" /> : null}
            {jobQuery.isError ? <InlineError message={getErrorMessage(jobQuery.error, "Failed to fetch job")} /> : null}
            {job ? (
              <div className="text-sm text-[var(--foreground)]">
                Status: <span className="font-semibold">{job.status ?? "—"}</span>
                {job.status === "succeeded" ? (
                  <div className="mt-3">
                    <a className="font-medium text-[var(--accent)] underline" href={exportDownloadUrl(companyId, jobId)} target="_blank" rel="noreferrer">
                      Download {job.resultFileName ? `(${job.resultFileName})` : "CSV"}
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
