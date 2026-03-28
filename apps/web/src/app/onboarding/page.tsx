"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage, logError } from "@/lib/errors";
import { useBootstrapOnboarding } from "@/lib/onboarding/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

export default function OnboardingPage() {
  const router = useRouter();
  const bootstrap = useBootstrapOnboarding();

  const [companyName, setCompanyName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [gstin, setGstin] = React.useState("");
  const [pan, setPan] = React.useState("");
  const [businessType, setBusinessType] = React.useState("trader");
  const [state, setState] = React.useState("");
  const [stateCode, setStateCode] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [invoicePrefix, setInvoicePrefix] = React.useState("INV-");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(null);
  const [allowNegativeStock, setAllowNegativeStock] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [logoFile]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,95,140,0.08),transparent_28%),var(--app-bg)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Phase C"
          title="Create your company"
          subtitle="Bootstrap the owner account, company profile, and invoice defaults in one onboarding flow."
          actions={<Link className="text-sm underline" href="/login">Already have an account?</Link>}
        />

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Owner account</Badge>
                <Badge variant="outline">Company bootstrap</Badge>
              </div>
              <CardTitle>What this creates</CardTitle>
              <CardDescription>The onboarding flow creates the company, the owner user, a default invoice series, and signs you in immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted-strong)]">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">A tenant-scoped company record with billing defaults.</div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">An owner user account with an authenticated session.</div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">A `DEFAULT` invoice series using your chosen prefix.</div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">A staged GST profile. If GSTIN is provided, verification is marked pending for later implementation.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Onboarding form</CardTitle>
              <CardDescription>Provide the minimum company and owner details to reach a usable dashboard without manual seeding.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);

                  if (!companyName.trim()) return setError("Company name is required.");
                  if (!ownerName.trim()) return setError("Owner name is required.");
                  if (!email.trim()) return setError("Email is required.");
                  if (!password.trim() || password.trim().length < 6) return setError("Password must be at least 6 characters.");

                  try {
                    setIsSubmitting(true);
                    const data = await bootstrap.mutateAsync({
                      company_name: companyName.trim(),
                      owner_name: ownerName.trim(),
                      email: email.trim(),
                      password: password,
                      gstin: gstin.trim() || undefined,
                      pan: pan.trim() || undefined,
                      business_type: businessType,
                      state: state.trim() || undefined,
                      state_code: stateCode.trim() || undefined,
                      timezone: timezone.trim() || undefined,
                      invoice_prefix: invoicePrefix.trim() || undefined,
                      logo_url: logoUrl.trim() || undefined,
                      allow_negative_stock: allowNegativeStock,
                    });
                    if (logoFile) {
                      const form = new FormData();
                      form.set("file", logoFile);
                      await apiClient.postForm(`/companies/${data.user.company_id}/logo`, form);
                    }
                    const nextPath = `/c/${data.user.company_id}/dashboard`;
                    React.startTransition(() => {
                      router.replace(nextPath);
                    });
                    window.location.assign(nextPath);
                  } catch (err: unknown) {
                    logError(err, "onboarding-submit", {
                      companyName: companyName.trim(),
                      email: email.trim(),
                    });
                    setError(getErrorMessage(err, "Failed to create company."));
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Company name" value={companyName} onChange={setCompanyName} required />
                  <TextField label="Owner name" value={ownerName} onChange={setOwnerName} required />
                  <TextField label="Email" value={email} onChange={setEmail} required />
                  <TextField label="Password" value={password} onChange={setPassword} type="password" required />
                  <TextField label="GSTIN" value={gstin} onChange={setGstin} placeholder="Optional" />
                  <TextField label="PAN" value={pan} onChange={setPan} placeholder="Optional" />
                  <SelectField label="Business type" value={businessType} onChange={setBusinessType}>
                    <option value="trader">Trader</option>
                    <option value="service">Service</option>
                    <option value="manufacturer">Manufacturer</option>
                  </SelectField>
                  <TextField label="Timezone" value={timezone} onChange={setTimezone} />
                  <TextField label="State" value={state} onChange={setState} placeholder="Optional" />
                  <TextField label="State code" value={stateCode} onChange={setStateCode} placeholder="Optional" />
                  <TextField label="Invoice prefix" value={invoicePrefix} onChange={setInvoicePrefix} />
                  <TextField label="Logo URL fallback" value={logoUrl} onChange={setLogoUrl} placeholder="Optional" />
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Company logo</label>
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                    {logoPreviewUrl ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                        <Image
                          alt="Selected company logo"
                          className="object-contain p-2"
                          fill
                          src={logoPreviewUrl}
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--muted)]">
                        No file
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        accept="image/*"
                        className="block w-full text-sm text-[var(--muted-strong)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                        type="file"
                      />
                      <div className="mt-2 text-xs text-[var(--muted)]">If provided, the file is uploaded immediately after the company is created and signed in.</div>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input type="checkbox" checked={allowNegativeStock} onChange={(e) => setAllowNegativeStock(e.target.checked)} />
                  Allow negative stock
                </label>

                {error ? <InlineError message={error} /> : null}

                <div className="flex flex-wrap gap-3">
                  <PrimaryButton type="submit" disabled={bootstrap.isPending || isSubmitting}>
                    {bootstrap.isPending || isSubmitting ? "Creating workspace…" : "Create company"}
                  </PrimaryButton>
                  <Link href="/login">
                    <SecondaryButton type="button">Back to login</SecondaryButton>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
