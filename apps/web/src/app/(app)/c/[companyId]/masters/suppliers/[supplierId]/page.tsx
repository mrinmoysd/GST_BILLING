"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useDeleteSupplier, useSupplier, useUpdateSupplier } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { DetailInfoList, DetailRail, DetailTabPanel, DetailTabs } from "@/lib/ui/detail";
import { WorkspaceDetailHero, WorkspacePanel } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string; supplierId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SupplierDetailPage({ params }: Props) {
  const resolved = React.use(params);
  const router = useRouter();
  const query = useSupplier({ companyId: resolved.companyId, supplierId: resolved.supplierId });
  const update = useUpdateSupplier({ companyId: resolved.companyId, supplierId: resolved.supplierId });
  const del = useDeleteSupplier({ companyId: resolved.companyId, supplierId: resolved.supplierId });

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!query.data) return;
    setName(query.data.data.name ?? "");
    setEmail(query.data.data.email ?? "");
    setPhone(query.data.data.phone ?? "");
  }, [query.data]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Supplier"
        subtitle="Maintain supplier contact details and jump into the payable ledger from a cleaner detail page."
        actions={
          <div className="flex gap-3">
            <Link className="text-sm underline" href={`/c/${resolved.companyId}/masters/suppliers`}>
              Back
            </Link>
            <Link
              className="text-sm underline"
              href={`/c/${resolved.companyId}/masters/suppliers/${resolved.supplierId}/ledger`}
            >
              Ledger
            </Link>
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading supplier…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load supplier")} />
      ) : null}
      {query.data ? (
        <>
          <WorkspaceDetailHero
            eyebrow="Masters detail"
            title={query.data.data.name}
            subtitle="Keep payable contact identity and edit controls separated into focused tabs instead of stacking everything into one long page."
            badges={[
              <Badge key="profile" variant="secondary">Supplier profile</Badge>,
              <Badge key="ref" variant="outline">{resolved.supplierId.slice(0, 8)}</Badge>,
            ]}
            metrics={[
              { label: "Email", value: query.data.data.email ?? "Not set" },
              { label: "Phone", value: query.data.data.phone ?? "Not set" },
              { label: "Created", value: query.data.data.createdAt?.slice?.(0, 10) ?? "—" },
              { label: "Updated", value: query.data.data.updatedAt?.slice?.(0, 10) ?? "—" },
            ]}
          />

          <DetailTabs
            defaultValue="overview"
            items={[
              { id: "overview", label: "Overview" },
              { id: "edit", label: "Edit" },
            ]}
          >
            <DetailTabPanel
              value="overview"
              rail={
                <DetailRail
                  eyebrow="Quick actions"
                  title="Next step"
                  subtitle="Jump into the payable and purchasing workflows without losing the supplier context."
                >
                  <div className="flex flex-col gap-2">
                    <Link href={`/c/${resolved.companyId}/masters/suppliers/${resolved.supplierId}/ledger`}>
                      <SecondaryButton type="button" className="w-full justify-start">
                        Open ledger
                      </SecondaryButton>
                    </Link>
                    <Link href={`/c/${resolved.companyId}/purchases/new`}>
                      <SecondaryButton type="button" className="w-full justify-start">
                        New purchase
                      </SecondaryButton>
                    </Link>
                    <Link href={`/c/${resolved.companyId}/masters/suppliers`}>
                      <SecondaryButton type="button" className="w-full justify-start">
                        Back to suppliers
                      </SecondaryButton>
                    </Link>
                  </div>
                </DetailRail>
              }
            >
              <WorkspacePanel
                title="Supplier profile"
                subtitle="This detail view stays deliberately concise. Operational payable and purchase history belongs in its own workspace, not in the edit form."
              >
                <DetailInfoList
                  items={[
                    { label: "Name", value: query.data.data.name },
                    { label: "Email", value: query.data.data.email ?? "Not set" },
                    { label: "Phone", value: query.data.data.phone ?? "Not set" },
                    { label: "Reference id", value: resolved.supplierId },
                  ]}
                />
              </WorkspacePanel>
            </DetailTabPanel>

            <DetailTabPanel
              value="edit"
              rail={
                <DetailRail
                  eyebrow="Guardrail"
                  title="Delete carefully"
                  subtitle="Deleting a supplier removes the master record, so keep the destructive action isolated from the main edit body."
                >
                  <div className="text-sm leading-6 text-[var(--muted)]">
                    Confirm the supplier is not still needed for purchase-entry or payable review before removing it.
                  </div>
                  <SecondaryButton
                    type="button"
                    disabled={del.isPending}
                    className="w-full justify-start"
                    onClick={async () => {
                      setFormError(null);
                      const ok = window.confirm("Delete this supplier? This cannot be undone.");
                      if (!ok) return;
                      try {
                        await del.mutateAsync();
                        router.replace(`/c/${resolved.companyId}/masters/suppliers`);
                      } catch (e: unknown) {
                        setFormError(getErrorMessage(e, "Failed to delete supplier"));
                      }
                    }}
                  >
                    {del.isPending ? "Deleting…" : "Delete supplier"}
                  </SecondaryButton>
                </DetailRail>
              }
            >
              <WorkspacePanel title="Edit supplier" subtitle="Update the core contact identity before new purchases or payment runs.">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormError(null);
                  try {
                    await update.mutateAsync({
                      name,
                      email: email || null,
                      phone: phone || null,
                    });
                  } catch (e: unknown) {
                    setFormError(getErrorMessage(e, "Failed to update supplier"));
                  }
                }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Name" value={name} onChange={setName} required />
                  <TextField label="Email" value={email} onChange={setEmail} type="email" />
                  <TextField label="Phone" value={phone} onChange={setPhone} />
                </div>

                {formError ? <InlineError message={formError} /> : null}

                <div className="flex flex-wrap gap-3">
                  <PrimaryButton type="submit" disabled={update.isPending}>
                    {update.isPending ? "Saving…" : "Save changes"}
                  </PrimaryButton>
                  <Link href={`/c/${resolved.companyId}/masters/suppliers/${resolved.supplierId}/ledger`}>
                    <SecondaryButton type="button">Open ledger</SecondaryButton>
                  </Link>
                </div>
              </form>
              </WorkspacePanel>
            </DetailTabPanel>
          </DetailTabs>
        </>
      ) : null}
      {!query.isLoading && !query.isError && !query.data ? (
        <EmptyState title="Not found" />
      ) : null}
    </div>
  );
}
