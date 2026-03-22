"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { NormalizedApiError } from "@/lib/api/types";
import { useCreateAdminCompany } from "@/lib/admin/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

export default function AdminCompanyCreatePage() {
  const router = useRouter();
  const createCompany = useCreateAdminCompany();

  const [companyName, setCompanyName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("password123");
  const [gstin, setGstin] = React.useState("");
  const [pan, setPan] = React.useState("");
  const [businessType, setBusinessType] = React.useState("trader");
  const [state, setState] = React.useState("");
  const [stateCode, setStateCode] = React.useState("");
  const [invoicePrefix, setInvoicePrefix] = React.useState("INV-");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await createCompany.mutateAsync({
        company_name: companyName,
        owner_name: ownerName,
        email,
        password,
        gstin: gstin || undefined,
        pan: pan || undefined,
        business_type: businessType || undefined,
        state: state || undefined,
        state_code: stateCode || undefined,
        invoice_prefix: invoicePrefix || undefined,
      });
      router.replace(`/admin/companies/${String((data as { id: string }).id)}`);
    } catch (e: unknown) {
      const err = e as NormalizedApiError;
      setError(err.message ?? "Failed to create company");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin"
        title="Create company"
        subtitle="Create a tenant workspace, owner user, default invoice series, and baseline accounting setup from admin."
      />

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Tenant bootstrap</CardTitle>
          <CardDescription>This mirrors the onboarding domain, but is executed by an internal operator.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Company name" value={companyName} onChange={setCompanyName} required />
              <TextField label="Owner name" value={ownerName} onChange={setOwnerName} required />
              <TextField label="Owner email" value={email} onChange={setEmail} type="email" required />
              <TextField label="Temporary password" value={password} onChange={setPassword} type="password" required />
              <TextField label="GSTIN" value={gstin} onChange={setGstin} />
              <TextField label="PAN" value={pan} onChange={setPan} />
              <TextField label="Business type" value={businessType} onChange={setBusinessType} />
              <TextField label="State" value={state} onChange={setState} />
              <TextField label="State code" value={stateCode} onChange={setStateCode} />
              <TextField label="Invoice prefix" value={invoicePrefix} onChange={setInvoicePrefix} />
            </div>

            {error ? <InlineError message={error} /> : null}

            <div className="flex flex-wrap gap-3">
              <PrimaryButton type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? "Creating..." : "Create company"}
              </PrimaryButton>
              <SecondaryButton asChild type="button">
                <Link href="/admin/companies">Back to companies</Link>
              </SecondaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
