"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/session";
import { useDcr, useSubmitDcr } from "@/lib/field-sales/hooks";
import { DateField, PrimaryButton } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function FieldSalesDcrPage({ params }: Props) {
  const { companyId } = React.use(params);
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [date, setDate] = React.useState(searchParams.get("date") || todayIso());
  const [closingNotes, setClosingNotes] = React.useState("");
  const [issues, setIssues] = React.useState("");
  const salespersonUserId = session.user?.id ?? "";

  const dcr = useDcr({ companyId, date, salesperson_user_id: salespersonUserId, enabled: Boolean(salespersonUserId) });
  const submit = useSubmitDcr(companyId);

  const snapshot = dcr.data?.data?.snapshot;
  const report = dcr.data?.data?.report;

  React.useEffect(() => {
    setClosingNotes(String(report?.closingNotes ?? report?.closing_notes ?? ""));
    const existingIssues = Array.isArray(report?.issues) ? report?.issues.join(", ") : "";
    setIssues(existingIssues);
  }, [report?.closingNotes, report?.closing_notes, report?.issues]);

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Field sales"
        title="Daily call report"
        subtitle="Submit a clean daily closeout built from visits, orders, and recovery actions instead of stitching it together manually."
      />

      <WorkspacePanel title="Report date" subtitle="Open any date to review or submit the rep’s closeout.">
        <div className="grid gap-4 md:grid-cols-3">
          <DateField label="Report date" value={date} onChange={setDate} />
        </div>
      </WorkspacePanel>

      {dcr.isLoading ? <LoadingBlock label="Loading DCR…" /> : null}
      {dcr.isError ? <InlineError message={getErrorMessage(dcr.error, "Failed to load DCR")} /> : null}

      {snapshot ? (
        <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
          <StatCard label="Planned" value={String(snapshot.planned_visits_count)} />
          <StatCard label="Completed" value={String(snapshot.completed_visits_count)} />
          <StatCard label="Missed" value={String(snapshot.missed_visits_count)} />
          <StatCard label="Productive" value={String(snapshot.productive_visits_count)} />
          <StatCard label="Quotations" value={String(snapshot.quotations_count)} />
          <StatCard label="Orders" value={String(snapshot.sales_orders_count)} />
          <StatCard label="Order value" value={snapshot.sales_order_value.toFixed(2)} />
          <StatCard label="Collections" value={String(snapshot.collection_updates_count)} />
        </div>
      ) : null}

      <WorkspacePanel title="Submit DCR" subtitle="Keep the narrative short and operational. The counters are auto-derived from the visit and order trail.">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await submit.mutateAsync({
                report_date: date,
                closing_notes: closingNotes || undefined,
                issues: issues
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
              toast.success("DCR submitted");
            } catch (err) {
              toast.error(getErrorMessage(err, "Failed to submit DCR"));
            }
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Closing notes</label>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-soft)]"
              value={closingNotes}
              onChange={(event) => setClosingNotes(event.target.value)}
              placeholder="What got covered, what slipped, and what needs back-office attention?"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Issues</label>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-soft)]"
              value={issues}
              onChange={(event) => setIssues(event.target.value)}
              placeholder="Comma-separated issues: stock short, outlet closed, credit extension ask"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <PrimaryButton type="submit" disabled={submit.isPending || !salespersonUserId}>
              {submit.isPending ? "Submitting…" : "Submit DCR"}
            </PrimaryButton>
            {report?.status ? <div className="text-sm text-[var(--muted)]">Current status: {report.status}</div> : null}
          </div>
        </form>
      </WorkspacePanel>
    </div>
  );
}
