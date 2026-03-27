"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";

import { useCreateSupplier } from "@/lib/masters/hooks";
import {
  ComposerBody,
  ComposerMetricCard,
  ComposerMiniList,
  ComposerSection,
  ComposerStepBar,
  ComposerStickyActions,
  ComposerSummaryRail,
} from "@/lib/ui/composer";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

export default function NewSupplierPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateSupplier({ companyId: companyId });

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const activeStep = !name ? "identity" : !email && !phone ? "contact" : "review";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="New supplier"
        subtitle="Create a supplier profile with a calmer structure, so purchasing teams can capture only the details they need and move on."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/masters/suppliers`}>
            Back
          </Link>
        }
      />

      <ComposerStepBar
        activeId={activeStep}
        steps={[
          {
            id: "identity",
            label: "Identity",
            description: "Capture the supplier name first so the payable record has a clean anchor.",
            meta: name ? "Name ready" : "Waiting for name",
          },
          {
            id: "contact",
            label: "Contact posture",
            description: "Add only the communication channels needed for purchasing and settlement follow-up.",
            meta: email || phone ? "Contact added" : "Optional details",
          },
          {
            id: "review",
            label: "Review and create",
            description: "Confirm the profile and move directly into the supplier workspace.",
            meta: name ? "Ready to create" : "Complete the basics",
          },
        ]}
      />

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const res = await create.mutateAsync({
              name,
              email: email || undefined,
              phone: phone || undefined,
            });
            router.replace(`/c/${companyId}/masters/suppliers/${res.data.id}`);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string"
                ? ((e as { message?: unknown }).message as string)
                : "Failed to create supplier";
            setError(message);
          }
        }}
      >
        <ComposerBody
          rail={
            <ComposerSummaryRail
              eyebrow="Supplier summary"
              title={name || "New supplier"}
              description="Keep the create flow lightweight. Rich purchase and payable insight belongs in the detail workspace after the record exists."
            >
              <ComposerMetricCard
                label="Contact channels"
                value={Number(Boolean(email)) + Number(Boolean(phone))}
                hint="Email and phone are optional, but at least one channel helps purchasing and payment follow-up."
              />
              <ComposerMiniList
                items={[
                  { label: "Name", value: name || "Pending" },
                  { label: "Email", value: email || "Not set" },
                  { label: "Phone", value: phone || "Not set" },
                ]}
              />
            </ComposerSummaryRail>
          }
        >
          <ComposerSection
            eyebrow="Identity"
            title="Supplier basics"
            description="Set the account name that purchasing, payables, and ledger workflows will all use."
          >
            <TextField label="Name" value={name} onChange={setName} required />
          </ComposerSection>

          <ComposerSection
            eyebrow="Contact posture"
            title="Reachability"
            description="Keep this light. Add only the channels your team genuinely uses for purchase coordination and settlement."
            tone="muted"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Email" value={email} onChange={setEmail} type="email" />
              <TextField label="Phone" value={phone} onChange={setPhone} />
            </div>
          </ComposerSection>

          {error ? <InlineError message={error} /> : null}

          <ComposerStickyActions
            aside="Create the supplier first, then use the detail workspace for ledger access and future payable context."
            primary={
              <PrimaryButton type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create supplier"}
              </PrimaryButton>
            }
            secondary={
              <Link href={`/c/${companyId}/masters/suppliers`}>
                <SecondaryButton type="button" className="w-full">
                  Cancel
                </SecondaryButton>
              </Link>
            }
          />
        </ComposerBody>
      </form>
    </div>
  );
}
