"use client";

import * as React from "react";

import { useInvoices } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/errors";
import { CollectionTask, useCollectionTasks, useCreateCollectionTask, useUpdateCollectionTask } from "@/lib/finance/hooks";
import { useCustomers } from "@/lib/masters/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField, PrimaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero } from "@/lib/ui/workspace";

function CollectionTaskRow(props: {
  companyId: string;
  task: CollectionTask;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const update = useUpdateCollectionTask(props.companyId, String(props.task.id));
  return (
    <DataTr className={props.selected ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-secondary)]"} onClick={props.onSelect}>
      <DataTd>{String(props.task.customer?.name ?? "—")}</DataTd>
      <DataTd>{String(props.task.invoice?.invoiceNumber ?? props.task.invoice?.invoice_number ?? "—")}</DataTd>
      <DataTd><QueueRowStateBadge label={String(props.task.priority ?? "—")} variant="outline" /></DataTd>
      <DataTd><QueueRowStateBadge label={String(props.task.status ?? "—")} /></DataTd>
      <DataTd>{String(props.task.dueDate ?? props.task.due_date ?? "—")}</DataTd>
      <DataTd>
        <div className="flex gap-2">
          <PrimaryButton
            type="button"
            size="sm"
            disabled={update.isPending}
            onClick={async (event) => {
              event.stopPropagation();
              try {
                await update.mutateAsync({ status: "in_progress" });
                toastSuccess("Task moved to in progress.");
              } catch (err: unknown) {
                toastError(err, {
                  fallback: "Failed to update task.",
                  context: "collections-task-start",
                  metadata: { companyId: props.companyId, taskId: props.task.id },
                });
              }
            }}
          >
            Start
          </PrimaryButton>
          <PrimaryButton
            type="button"
            size="sm"
            disabled={update.isPending}
            onClick={async (event) => {
              event.stopPropagation();
              try {
                await update.mutateAsync({ status: "done" });
                toastSuccess("Task completed.");
              } catch (err: unknown) {
                toastError(err, {
                  fallback: "Failed to update task.",
                  context: "collections-task-close",
                  metadata: { companyId: props.companyId, taskId: props.task.id },
                });
              }
            }}
          >
            Close
          </PrimaryButton>
        </div>
      </DataTd>
    </DataTr>
  );
}

type Props = { params: Promise<{ companyId: string }> };

export default function CollectionsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [customerId, setCustomerId] = React.useState("");
  const [invoiceId, setInvoiceId] = React.useState("");
  const [assignedToUserId, setAssignedToUserId] = React.useState("");
  const [priority, setPriority] = React.useState("normal");
  const [channel, setChannel] = React.useState("call");
  const [dueDate, setDueDate] = React.useState("");
  const [promiseToPayDate, setPromiseToPayDate] = React.useState("");
  const [promiseToPayAmount, setPromiseToPayAmount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [segment, setSegment] = React.useState("open");
  const [savedView, setSavedView] = React.useState("open");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [filterCustomerId, setFilterCustomerId] = React.useState("");
  const [filterAssigneeId, setFilterAssigneeId] = React.useState("");
  const [filterPriority, setFilterPriority] = React.useState("");

  const tasksQuery = useCollectionTasks({ companyId });
  const createTask = useCreateCollectionTask(companyId);
  const { session } = useAuth();
  const customersQuery = useCustomers({ companyId, page: 1, limit: 100 });
  const invoicesQuery = useInvoices({ companyId, page: 1, limit: 100, status: "issued" });
  const salespeople = useCompanySalespeople(companyId);

  const customerRows = (((customersQuery.data as unknown as { data?: { data?: Array<{ id: string; name: string }> } })?.data?.data) ?? []);
  const invoiceRows = (((invoicesQuery.data as unknown as { data?: Array<Record<string, unknown>> })?.data) ?? []);
  const salespersonRows = Array.isArray(salespeople.data?.data) ? salespeople.data.data : [];
  const taskRows = React.useMemo(
    () => ((((tasksQuery.data as unknown as { data?: { data?: CollectionTask[] } })?.data?.data) ?? []) as CollectionTask[]),
    [tasksQuery.data],
  );

  const counts = React.useMemo(() => {
    const open = taskRows.filter((task) => String(task.status ?? "").toLowerCase() !== "done").length;
    const critical = taskRows.filter((task) => String(task.priority ?? "").toLowerCase() === "critical").length;
    const mine = taskRows.filter((task) => task.assignee?.id === session.user?.id || task.salesperson?.id === session.user?.id).length;
    const done = taskRows.filter((task) => String(task.status ?? "").toLowerCase() === "done").length;
    return { all: taskRows.length, open, critical, mine, done };
  }, [session.user?.id, taskRows]);

  const filteredTasks = React.useMemo(() => {
    return taskRows.filter((task) => {
      const status = String(task.status ?? "").toLowerCase();
      const priorityLabel = String(task.priority ?? "").toLowerCase();
      const mine = task.assignee?.id === session.user?.id || task.salesperson?.id === session.user?.id;
      const customerMatch = !filterCustomerId || task.customer?.id === filterCustomerId;
      const assigneeMatch = !filterAssigneeId || task.assignee?.id === filterAssigneeId || task.salesperson?.id === filterAssigneeId;
      const priorityMatch = !filterPriority || priorityLabel === filterPriority;

      if (!customerMatch || !assigneeMatch || !priorityMatch) return false;

      if (segment === "open") return status !== "done";
      if (segment === "critical") return priorityLabel === "critical";
      if (segment === "mine") return mine;
      if (segment === "done") return status === "done";
      return true;
    });
  }, [filterAssigneeId, filterCustomerId, filterPriority, segment, session.user?.id, taskRows]);

  React.useEffect(() => {
    if (!filteredTasks.length) {
      setSelectedTaskId(null);
      return;
    }
    if (!selectedTaskId || !filteredTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0]?.id ?? null);
    }
  }, [filteredTasks, selectedTaskId]);

  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Collections"
        title="Collection taskboard"
        subtitle="Assign overdue follow-up, capture promise-to-pay context, and close the spreadsheet gap in receivables operations."
      />

      <QueueSegmentBar
        items={[
          { id: "open", label: "Open", count: counts.open },
          { id: "critical", label: "Critical", count: counts.critical },
          { id: "mine", label: "Mine", count: counts.mine },
          { id: "done", label: "Closed", count: counts.done },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "open", label: "Work queue" },
              { id: "critical", label: "Escalations" },
              { id: "mine", label: "My follow-up" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Customer"
              value={filterCustomerId}
              onChange={setFilterCustomerId}
              options={[
                { value: "", label: "All customers" },
                ...customerRows.map((customer) => ({ value: customer.id, label: customer.name })),
              ]}
            />
            <SelectField
              label="Assignee"
              value={filterAssigneeId}
              onChange={setFilterAssigneeId}
              options={[
                { value: "", label: "All assignees" },
                ...salespersonRows.map((person) => ({
                  value: person.id,
                  label: person.name || person.email || person.id,
                })),
              ]}
            />
            <SelectField
              label="Priority"
              value={filterPriority}
              onChange={setFilterPriority}
              options={[
                { value: "", label: "All priorities" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
            />
          </div>
        }
        summary={
          <>
            <QueueRowStateBadge label={`${filteredTasks.length} tasks`} />
            <QueueRowStateBadge label={`${counts.critical} critical`} variant="outline" />
          </>
        }
      />

      {tasksQuery.isLoading ? <LoadingBlock label="Loading collection tasks…" /> : null}
      {tasksQuery.isError ? <InlineError message={getErrorMessage(tasksQuery.error, "Failed to load collection tasks")} /> : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && filteredTasks.length === 0 ? (
        <EmptyState title="No collection tasks yet" hint="Create the first follow-up task to start using D9 collections." />
      ) : null}

      {filteredTasks.length > 0 ? (
        <QueueShell
          inspector={
            <>
              <QueueInspector
                eyebrow="Task inspector"
                title={selectedTask?.customer?.name ?? "Select task"}
                subtitle="Keep the due context, promise-to-pay detail, and action controls beside the queue."
                footer={selectedTask ? <div className="text-xs leading-5 text-[var(--muted)]">Status changes stay in the queue row so operators can move fast without losing context.</div> : null}
              >
                {selectedTask ? (
                  <>
                    <QueueQuickActions>
                      <QueueRowStateBadge label={selectedTask.status} />
                      <QueueRowStateBadge label={selectedTask.priority} variant="outline" />
                    </QueueQuickActions>
                    <QueueMetaList
                      items={[
                        { label: "Invoice", value: selectedTask.invoice?.invoiceNumber ?? selectedTask.invoice?.invoice_number ?? "—" },
                        { label: "Due date", value: selectedTask.dueDate ?? selectedTask.due_date ?? "—" },
                        { label: "Promise date", value: selectedTask.promiseToPayDate ?? selectedTask.promise_to_pay_date ?? "—" },
                        { label: "Promise amount", value: selectedTask.promiseToPayAmount ?? selectedTask.promise_to_pay_amount ?? "—" },
                        { label: "Channel", value: selectedTask.channel ?? "—" },
                        { label: "Assignee", value: selectedTask.assignee?.name ?? selectedTask.assignee?.email ?? "—" },
                      ]}
                    />
                    {selectedTask.notes ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm leading-6 text-[var(--muted-strong)] shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">{selectedTask.notes}</div> : null}
                  </>
                ) : (
                  <div className="text-sm text-[var(--muted)]">Pick a task to inspect the collection context and decide the next follow-up.</div>
                )}
              </QueueInspector>

              <QueueInspector
                eyebrow="Create"
                title="New follow-up task"
                subtitle="Add a fresh collection action without leaving the working queue."
              >
                <form
                  className="grid gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await createTask.mutateAsync({
                        customer_id: customerId,
                        invoice_id: invoiceId || undefined,
                        assigned_to_user_id: assignedToUserId || undefined,
                        priority,
                        channel,
                        due_date: dueDate || undefined,
                        promise_to_pay_date: promiseToPayDate || undefined,
                        promise_to_pay_amount: promiseToPayAmount || undefined,
                        notes: notes || undefined,
                      });
                      setInvoiceId("");
                      setPromiseToPayAmount("");
                      setPromiseToPayDate("");
                      setDueDate("");
                      setNotes("");
                      toastSuccess("Collection task created.");
                    } catch (err: unknown) {
                      toastError(err, {
                        fallback: "Failed to create task.",
                        context: "collections-task-create",
                        metadata: { companyId, customerId, invoiceId },
                      });
                    }
                  }}
                >
                  <SelectField
                    label="Customer"
                    value={customerId}
                    onChange={setCustomerId}
                    options={[
                      { value: "", label: "Select customer" },
                      ...customerRows.map((customer) => ({ value: customer.id, label: customer.name })),
                    ]}
                  />
                  <SelectField
                    label="Assignee"
                    value={assignedToUserId}
                    onChange={setAssignedToUserId}
                    options={[
                      { value: "", label: "Unassigned" },
                      ...salespersonRows.map((person) => ({
                        value: person.id,
                        label: person.name || person.email || person.id,
                      })),
                    ]}
                  />
                  <SelectField
                    label="Priority"
                    value={priority}
                    onChange={setPriority}
                    options={[
                      { value: "normal", label: "Normal" },
                      { value: "high", label: "High" },
                      { value: "critical", label: "Critical" },
                    ]}
                  />
                  <SelectField
                    label="Invoice"
                    value={invoiceId}
                    onChange={setInvoiceId}
                    options={[
                      { value: "", label: "Optional invoice" },
                      ...invoiceRows.map((invoice) => ({
                        value: String(invoice.id),
                        label: String(invoice.invoiceNumber ?? invoice.invoice_no ?? invoice.id),
                      })),
                    ]}
                  />
                  <SelectField
                    label="Channel"
                    value={channel}
                    onChange={setChannel}
                    options={[
                      { value: "call", label: "Call" },
                      { value: "visit", label: "Visit" },
                      { value: "whatsapp", label: "WhatsApp" },
                      { value: "bounce_followup", label: "Bounce follow-up" },
                    ]}
                  />
                  <DateField label="Due date" value={dueDate} onChange={setDueDate} />
                  <DateField label="Promise to pay date" value={promiseToPayDate} onChange={setPromiseToPayDate} />
                  <TextField label="Promise amount" value={promiseToPayAmount} onChange={setPromiseToPayAmount} type="number" />
                  <TextField label="Notes" value={notes} onChange={setNotes} />
                  <PrimaryButton type="submit" disabled={createTask.isPending || !customerId}>
                    {createTask.isPending ? "Creating…" : "Create task"}
                  </PrimaryButton>
                </form>
              </QueueInspector>
            </>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Customer</DataTh>
                  <DataTh>Invoice</DataTh>
                  <DataTh>Priority</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Due date</DataTh>
                  <DataTh>Actions</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredTasks.map((task) => (
                  <CollectionTaskRow
                    key={String(task.id)}
                    companyId={companyId}
                    task={task}
                    selected={selectedTask?.id === task.id}
                    onSelect={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </QueueShell>
      ) : null}
    </div>
  );
}
