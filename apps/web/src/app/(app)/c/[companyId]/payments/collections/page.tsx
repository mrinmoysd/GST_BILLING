"use client";

import * as React from "react";
import { toast } from "sonner";

import { useInvoices } from "@/lib/billing/hooks";
import { useCollectionTasks, useCreateCollectionTask, useUpdateCollectionTask } from "@/lib/finance/hooks";
import { useCustomers } from "@/lib/masters/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField, PrimaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function CollectionTaskRow(props: {
  companyId: string;
  task: Record<string, unknown>;
}) {
  const update = useUpdateCollectionTask(props.companyId, String(props.task.id));
  return (
    <DataTr>
      <DataTd>{String((props.task.customer as { name?: string } | undefined)?.name ?? "—")}</DataTd>
      <DataTd>{String((props.task.invoice as { invoiceNumber?: string; invoice_number?: string } | undefined)?.invoiceNumber ?? (props.task.invoice as { invoice_number?: string } | undefined)?.invoice_number ?? "—")}</DataTd>
      <DataTd>{String(props.task.priority ?? "—")}</DataTd>
      <DataTd>{String(props.task.status ?? "—")}</DataTd>
      <DataTd>{String(props.task.dueDate ?? props.task.due_date ?? "—")}</DataTd>
      <DataTd>
        <div className="flex gap-2">
          <PrimaryButton
            type="button"
            size="sm"
            disabled={update.isPending}
            onClick={async () => {
              try {
                await update.mutateAsync({ status: "in_progress" });
                toast.success("Task moved to in progress");
              } catch (err: unknown) {
                toast.error(getErrorMessage(err, "Failed to update task"));
              }
            }}
          >
            Start
          </PrimaryButton>
          <PrimaryButton
            type="button"
            size="sm"
            disabled={update.isPending}
            onClick={async () => {
              try {
                await update.mutateAsync({ status: "done" });
                toast.success("Task completed");
              } catch (err: unknown) {
                toast.error(getErrorMessage(err, "Failed to update task"));
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

  const tasksQuery = useCollectionTasks({ companyId });
  const createTask = useCreateCollectionTask(companyId);
  const customersQuery = useCustomers({ companyId, page: 1, limit: 100 });
  const invoicesQuery = useInvoices({ companyId, page: 1, limit: 100, status: "issued" });
  const salespeople = useCompanySalespeople(companyId);

  const customerRows = (((customersQuery.data as unknown as { data?: { data?: Array<{ id: string; name: string }> } })?.data?.data) ?? []);
  const invoiceRows = (((invoicesQuery.data as unknown as { data?: Array<Record<string, unknown>> })?.data) ?? []);
  const salespersonRows = Array.isArray(salespeople.data?.data) ? salespeople.data.data : [];
  const taskRows = (((tasksQuery.data as unknown as { data?: { data?: Array<Record<string, unknown>> } })?.data?.data) ?? []);

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Collections"
        title="Collection taskboard"
        subtitle="Assign overdue follow-up, capture promise-to-pay context, and close the spreadsheet gap in receivables operations."
      />

      <WorkspacePanel title="New follow-up task" subtitle="Create an action item for overdue or high-risk customer dues.">
        <form
          className="grid gap-4 md:grid-cols-2"
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
              setPromiseToPayAmount("");
              setPromiseToPayDate("");
              setNotes("");
              toast.success("Collection task created");
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, "Failed to create task"));
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
          <div className="md:col-span-2">
            <PrimaryButton type="submit" disabled={createTask.isPending || !customerId}>
              {createTask.isPending ? "Creating…" : "Create task"}
            </PrimaryButton>
          </div>
        </form>
      </WorkspacePanel>

      {tasksQuery.isLoading ? <LoadingBlock label="Loading collection tasks…" /> : null}
      {tasksQuery.isError ? <InlineError message={getErrorMessage(tasksQuery.error, "Failed to load collection tasks")} /> : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && taskRows.length === 0 ? (
        <EmptyState title="No collection tasks yet" hint="Create the first follow-up task to start using D9 collections." />
      ) : null}

      {taskRows.length > 0 ? (
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
              {taskRows.map((task) => (
                <CollectionTaskRow key={String(task.id)} companyId={companyId} task={task as Record<string, unknown>} />
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
