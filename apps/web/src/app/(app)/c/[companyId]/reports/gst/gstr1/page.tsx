"use client";

import * as React from "react";

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
    <div className="space-y-6">
      <PageHeader title="GSTR1 Export" subtitle="Create export job and download CSV." />

      <div className="rounded-xl border bg-white p-4 space-y-4 max-w-2xl">
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
              // backend returns { data: { jobId } } or similar; keep it flexible
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
      </div>

      {jobId ? (
        <div className="rounded-xl border bg-white p-4 space-y-2">
          <div className="text-sm">
            Job: <code>{jobId}</code>
          </div>
          {jobQuery.isLoading ? <LoadingBlock label="Checking status…" /> : null}
          {jobQuery.isError ? <InlineError message={getErrorMessage(jobQuery.error, "Failed to fetch job")} /> : null}
          {job ? (
            <div className="text-sm text-neutral-700">
              Status: <span className="font-medium">{job.status ?? "—"}</span>
              {job.status === "succeeded" ? (
                <div className="mt-2">
                  <a className="underline" href={exportDownloadUrl(companyId, jobId)} target="_blank" rel="noreferrer">
                    Download {job.resultFileName ? `(${job.resultFileName})` : "CSV"}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
