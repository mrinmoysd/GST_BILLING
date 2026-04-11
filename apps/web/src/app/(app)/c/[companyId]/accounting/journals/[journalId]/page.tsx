"use client";

import Link from "next/link";
import * as React from "react";

import { useJournal } from "@/lib/billing/hooks";
import { formatDateLabel } from "@/lib/format/date";
import { DetailInfoList, DetailRail, DetailTabPanel, DetailTabs } from "@/lib/ui/detail";
import { SecondaryButton } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceDetailHero, WorkspacePanel } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string; journalId: string }> };


export default function JournalDetailPage({ params }: Props) {
  const { companyId, journalId } = React.use(params);
  const query = useJournal({ companyId, journalId });

  const data = query.data?.data as unknown as {
    id?: string;
    date?: string;
    narration?: string | null;
    source_type?: string | null;
    source_id?: string | null;
    is_system_generated?: boolean;
    lines?: Array<{
      id?: string;
      amount?: number;
      debit_ledger_name?: string | null;
      credit_ledger_name?: string | null;
      debit_ledger_id?: string | null;
      credit_ledger_id?: string | null;
    }>;
  };

  const lines = data?.lines ?? [];

  return (
    <div className="space-y-7">
      <WorkspaceDetailHero
        eyebrow="Accounting detail"
        title={data?.id ?? journalId}
        subtitle="Review the entry context, source posture, and debit-credit body in segmented tabs instead of a flat drill-down sheet."
        metrics={[
          { label: "Date", value: formatDateLabel(data?.date) },
          { label: "Mode", value: data?.is_system_generated ? "System generated" : "Manual" },
          { label: "Source", value: data?.source_type ? `${data.source_type}${data.source_id ? `:${data.source_id}` : ""}` : "—" },
          { label: "Lines", value: lines.length },
        ]}
      />

      {query.isLoading ? <LoadingBlock label="Loading journal…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load journal")} /> : null}

      {query.data ? (
        <DetailTabs
          defaultValue="summary"
          items={[
            { id: "summary", label: "Summary" },
            { id: "lines", label: "Lines", badge: lines.length },
          ]}
        >
          <DetailTabPanel
            value="summary"
            rail={
              <DetailRail
                eyebrow="Quick actions"
                title="Journal navigation"
                subtitle="Accounting detail should stay serious and quiet, with the back path always visible."
              >
                <Link href={`/c/${companyId}/accounting/journals`}>
                  <SecondaryButton type="button">Back to journals</SecondaryButton>
                </Link>
              </DetailRail>
            }
          >
            <WorkspacePanel title="Journal context" subtitle="Review identity, source, and narration before reading the debit-credit body.">
              <DetailInfoList
                items={[
                  { label: "Journal ID", value: data?.id ?? journalId },
                  { label: "Date", value: formatDateLabel(data?.date) },
                  { label: "Mode", value: data?.is_system_generated ? "System generated" : "Manual" },
                  { label: "Source", value: data?.source_type ? `${data.source_type}${data.source_id ? `:${data.source_id}` : ""}` : "—" },
                  { label: "Narration", value: data?.narration || "—" },
                ]}
              />
            </WorkspacePanel>
          </DetailTabPanel>

          <DetailTabPanel value="lines">
            <WorkspacePanel title="Debit and credit lines" subtitle="The posting body stays dense, readable, and accounting-safe.">
              <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-muted)] text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Debit</th>
                      <th className="px-3 py-2 text-left font-medium">Credit</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, idx) => (
                      <tr key={l.id ?? idx} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2">{l.debit_ledger_name ?? l.debit_ledger_id ?? "—"}</td>
                        <td className="px-3 py-2">{l.credit_ledger_name ?? l.credit_ledger_id ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{typeof l.amount === "number" ? l.amount.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </WorkspacePanel>
          </DetailTabPanel>
        </DetailTabs>
      ) : null}
    </div>
  );
}
