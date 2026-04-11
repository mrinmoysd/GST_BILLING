"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/errors";
import { useCreateVisit, useGenerateVisitPlans, useMyCustomers, useMySummary } from "@/lib/field-sales/hooks";
import { isRfcUuid } from "@/lib/ids";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

type VisitRow = NonNullable<NonNullable<ReturnType<typeof useMySummary>["data"]>["data"]>["visits"][number];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function FieldSalesTodayPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { session } = useAuth();
  const router = useRouter();
  const [date, setDate] = React.useState(todayIso());
  const [adHocCustomerId, setAdHocCustomerId] = React.useState("");
  const [adHocNotes, setAdHocNotes] = React.useState("");
  const userRole = String(session.user?.role ?? "").toLowerCase();
  const salespersonUserId =
    userRole === "salesperson" && isRfcUuid(session.user?.id)
      ? session.user!.id
      : "";
  const canRunRepWorkspace = Boolean(salespersonUserId);

  const summary = useMySummary({ companyId, date, enabled: canRunRepWorkspace });
  const customers = useMyCustomers(companyId, canRunRepWorkspace);
  const generatePlans = useGenerateVisitPlans(companyId);
  const createVisit = useCreateVisit(companyId);

  const data = summary.data?.data;
  const customerRows = customers.data?.data?.data ?? [];

  const columns = React.useMemo<ColumnDef<VisitRow>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        accessorFn: (visit) => visit.customer_name,
        meta: { label: "Customer" },
        cell: ({ row }) => row.original.customer_name,
      },
      {
        id: "route",
        header: "Route",
        accessorFn: (visit) => visit.route_name ?? "",
        meta: { label: "Route" },
        cell: ({ row }) => row.original.route_name ?? "—",
      },
      {
        id: "beat",
        header: "Beat",
        accessorFn: (visit) => visit.beat_name ?? "",
        meta: { label: "Beat" },
        cell: ({ row }) => row.original.beat_name ?? "—",
      },
      {
        id: "priority",
        header: "Priority",
        accessorFn: (visit) => visit.priority ?? "",
        meta: { label: "Priority" },
        cell: ({ row }) => row.original.priority ?? "—",
      },
      {
        id: "outstanding",
        header: "Outstanding",
        accessorFn: (visit) => Number(visit.outstanding_amount ?? 0),
        meta: { label: "Outstanding", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.outstanding_amount.toFixed(2),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (visit) => visit.status,
        meta: { label: "Status" },
        cell: ({ row }) => row.original.status,
      },
      {
        id: "action",
        header: "Action",
        accessorFn: (visit) => visit.visit_id ?? visit.visit_plan_id,
        meta: { label: "Action" },
        cell: ({ row }) =>
          row.original.visit_id ? (
            <Link
              className="text-sm font-medium text-[var(--secondary-strong)] transition hover:text-[var(--foreground)]"
              href={`/c/${companyId}/sales/field/visits/${row.original.visit_id}`}
              onClick={(event) => event.stopPropagation()}
            >
              Open visit
            </Link>
          ) : (
            <button
              type="button"
              className="text-sm font-medium text-[var(--secondary-strong)] transition hover:text-[var(--foreground)]"
              onClick={async (event) => {
                event.stopPropagation();
                try {
                  const res = await createVisit.mutateAsync({ visit_plan_id: row.original.visit_plan_id });
                  const nextVisitId =
                    (res.data as { data?: { id?: string } }).data?.id ??
                    ((res as unknown as { data?: { id?: string } }).data?.id);
                  if (nextVisitId) {
                    router.push(`/c/${companyId}/sales/field/visits/${nextVisitId}`);
                  }
                } catch (err) {
                  toastError(err, {
                    fallback: "Failed to start visit.",
                    context: "field-today-start-visit",
                    metadata: { companyId, visitPlanId: row.original.visit_plan_id },
                  });
                }
              }}
            >
              Start visit
            </button>
          ),
      },
    ],
    [companyId, createVisit, router],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Field sales"
        title="Today"
        subtitle="Run the day from one place: generate the worklist, start visits, and close the route with DCR instead of juggling calls and paper notes."
        actions={
          <>
            <PrimaryButton
              type="button"
              disabled={generatePlans.isPending || !canRunRepWorkspace}
              onClick={async () => {
                if (!canRunRepWorkspace) {
                  toastError(
                    {
                      message:
                        "Sign in as a salesperson account with a valid user id to generate a personal worklist.",
                    },
                    {
                      fallback: "This workspace needs a valid salesperson login.",
                      context: "field-today-invalid-salesperson-session",
                      metadata: {
                        companyId,
                        date,
                        sessionUserId: session.user?.id,
                        sessionRole: session.user?.role,
                      },
                    },
                  );
                  return;
                }
                try {
                  await generatePlans.mutateAsync({
                    date,
                    salesperson_user_ids: [salespersonUserId],
                    mode: "replace_missing_only",
                  });
                  toastSuccess("Today's worklist refreshed.");
                } catch (err) {
                  toastError(err, {
                    fallback: "Failed to generate worklist.",
                    context: "field-today-generate-plan",
                    metadata: { companyId, date },
                  });
                }
              }}
            >
              {generatePlans.isPending ? "Refreshing…" : "Generate today's plan"}
            </PrimaryButton>
            <SecondaryButton asChild>
              <Link href={`/c/${companyId}/sales/field/dcr?date=${date}`}>Open DCR</Link>
            </SecondaryButton>
          </>
        }
      />

      <WorkspacePanel title="Day controls" subtitle="Keep the date flexible for backfill, catch-up, or manager review.">
        <div className="grid gap-4 md:grid-cols-3">
          <DateField label="Working date" value={date} onChange={setDate} />
        </div>
        {!canRunRepWorkspace ? (
          <div className="mt-4 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--muted-strong)]">
            This screen is currently scoped to salesperson sessions. The active login is not a valid salesperson identity for personal worklist generation.
          </div>
        ) : null}
      </WorkspacePanel>

      {summary.isLoading ? <LoadingBlock label="Loading today’s field view…" /> : null}
      {summary.isError ? <InlineError message={getErrorMessage(summary.error, "Failed to load field summary")} /> : null}

      {data ? (
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Planned" value={String(data.counts.planned)} />
          <StatCard label="Completed" value={String(data.counts.completed)} />
          <StatCard label="Missed" value={String(data.counts.missed)} />
          <StatCard label="Productive" value={String(data.counts.productive)} />
          <StatCard label="Open collection tasks" value={String(data.open_collection_tasks)} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <WorkspacePanel title="Today's worklist" subtitle="Planned outlets, priority, current status, and next action in one scan-friendly table.">
          {!summary.isLoading && data?.visits?.length === 0 ? (
            <EmptyState title="No planned visits yet" hint="Generate today’s plan or create an ad-hoc visit below." />
          ) : null}

          {data?.visits?.length ? (
            <DataGrid
              data={data.visits}
              columns={columns}
              getRowId={(row) => row.visit_id ?? row.visit_plan_id}
              initialSorting={[{ id: "outstanding", desc: true }]}
              toolbarTitle="Visit worklist"
              toolbarDescription="Sort the day’s route queue without leaving the rep workspace."
            />
          ) : null}
        </WorkspacePanel>

        <WorkspacePanel title="Add ad-hoc visit" subtitle="Use this when the rep needs to cover an outlet that was not in the generated plan.">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const res = await createVisit.mutateAsync({
                  customer_id: adHocCustomerId,
                  visit_date: date,
                  notes: adHocNotes || undefined,
                });
                const nextVisitId =
                  (res.data as { data?: { id?: string } }).data?.id ??
                  ((res as unknown as { data?: { id?: string } }).data?.id);
                setAdHocCustomerId("");
                setAdHocNotes("");
                toastSuccess("Ad-hoc visit created.");
                if (nextVisitId) router.push(`/c/${companyId}/sales/field/visits/${nextVisitId}`);
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to create visit.",
                  context: "field-today-create-visit",
                  metadata: { companyId, customerId: adHocCustomerId },
                });
              }
            }}
          >
            <SelectField label="Customer" value={adHocCustomerId} onChange={setAdHocCustomerId}>
              <option value="">Select customer</option>
              {customerRows.map((row) => (
                <option key={row.customer.id} value={row.customer.id}>
                  {row.customer.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Notes" value={adHocNotes} onChange={setAdHocNotes} placeholder="Reason, urgency, recovery context…" />
            <PrimaryButton type="submit" disabled={createVisit.isPending || !adHocCustomerId || !canRunRepWorkspace}>
              {createVisit.isPending ? "Creating…" : "Create ad-hoc visit"}
            </PrimaryButton>
          </form>
        </WorkspacePanel>
      </div>
    </div>
  );
}
