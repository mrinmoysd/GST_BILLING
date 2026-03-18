"use client";

import * as React from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { useCompany, useUpdateCompany, useUploadCompanyLogo, useVerifyCompanyGstin } from "@/lib/settings/companyHooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function CompanySettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const company = useCompany(companyId);
  const update = useUpdateCompany(companyId);
  const verifyGstin = useVerifyCompanyGstin(companyId);
  const uploadLogo = useUploadCompanyLogo(companyId);

  const [name, setName] = React.useState("");
  const [gstin, setGstin] = React.useState("");
  const [pan, setPan] = React.useState("");
  const [state, setState] = React.useState("");
  const [stateCode, setStateCode] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [allowNegStock, setAllowNegStock] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [gstVerifyMessage, setGstVerifyMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = company.data?.data.data;
    if (!c) return;
    setName(c.name ?? "");
    setGstin(c.gstin ?? "");
    setPan(c.pan ?? "");
    setState(c.state ?? "");
    setStateCode(c.stateCode ?? "");
    setTimezone(c.timezone ?? "Asia/Kolkata");
    setLogoUrl(c.logoUrl ?? "");
    setLogoFile(null);
    setAllowNegStock(Boolean(c.allowNegativeStock));
  }, [company.data]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Company"
        subtitle="Manage the company identity, tax profile, and stock-policy defaults from a more structured settings surface."
      />

      {company.isLoading ? <LoadingBlock label="Loading company…" /> : null}
      {company.isError ? <InlineError message={getErrorMessage(company.error, "Failed to load company")} /> : null}
      {company.data && !company.data.data.data ? <EmptyState title="Company not found" /> : null}

      {company.data?.data.data ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{gstin ? "GST profile present" : "GST profile incomplete"}</Badge>
                <Badge variant="outline">{timezone || "Asia/Kolkata"}</Badge>
              </div>
              <CardTitle>Current profile</CardTitle>
              <CardDescription>Use the form to the right to update the current company record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Company name</div>
                <div className="mt-2 font-semibold text-[var(--foreground)]">{name || "—"}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Logo</div>
                <div className="mt-3 flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                      <Image
                        alt={`${name || "Company"} logo`}
                        className="object-contain p-2"
                        fill
                        src={logoUrl.startsWith("/") ? apiClient.resolveUrl(logoUrl) : logoUrl}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--muted)]">
                      No logo
                    </div>
                  )}
                  <div className="text-sm text-[var(--muted-strong)]">
                    Upload a company logo or keep an external URL if needed.
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">GSTIN</div>
                  <div className="mt-2 font-medium text-[var(--foreground)]">{gstin || "Not set"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">PAN</div>
                  <div className="mt-2 font-medium text-[var(--foreground)]">{pan || "Not set"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">State</div>
                  <div className="mt-2 font-medium text-[var(--foreground)]">{state || "Not set"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Negative stock</div>
                  <div className="mt-2 font-medium text-[var(--foreground)]">{allowNegStock ? "Allowed" : "Blocked"}</div>
                </div>
              </div>
              {gstVerifyMessage ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-strong)]">
                  {gstVerifyMessage}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit company settings</CardTitle>
              <CardDescription>Update the current tenant-scoped company record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Name" value={name} onChange={setName} required />
            <TextField label="GSTIN" value={gstin} onChange={setGstin} placeholder="15-char GSTIN" />
            <TextField label="PAN" value={pan} onChange={setPan} placeholder="10-char PAN" />
            <TextField label="State" value={state} onChange={setState} />
            <TextField label="State code" value={stateCode} onChange={setStateCode} />
            <TextField label="Timezone" value={timezone} onChange={setTimezone} />
            <TextField label="Logo URL fallback (optional)" value={logoUrl} onChange={setLogoUrl} />
              </div>

              <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Upload logo</label>
                <input
                  accept="image/*"
                  className="block w-full text-sm text-[var(--muted-strong)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  type="file"
                />
                <div className="text-xs text-[var(--muted)]">Stored locally for now using the current files pipeline.</div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input type="checkbox" checked={allowNegStock} onChange={(e) => setAllowNegStock(e.target.checked)} />
                Allow negative stock
              </label>

              {error ? <InlineError message={error} /> : null}
              {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  type="button"
                  disabled={update.isPending}
                  onClick={async () => {
                    setError(null);
                    setOk(null);
                    if (!name.trim()) return setError("Company name is required.");

                    try {
                      await update.mutateAsync({
                        name: name.trim(),
                        gstin: gstin.trim() || undefined,
                        pan: pan.trim() || undefined,
                        state: state.trim() || undefined,
                        state_code: stateCode.trim() || undefined,
                        timezone: timezone.trim() || undefined,
                        logo_url: logoUrl.trim() || undefined,
                        allow_negative_stock: allowNegStock,
                      });
                      setOk("Saved.");
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to save"));
                    }
                  }}
                >
                  {update.isPending ? "Saving…" : "Save"}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  disabled={uploadLogo.isPending || !logoFile}
                  onClick={async () => {
                    setError(null);
                    setOk(null);
                    if (!logoFile) return;

                    try {
                      const res = await uploadLogo.mutateAsync(logoFile);
                      setLogoUrl(res.data.data.logoUrl ?? "");
                      setLogoFile(null);
                      setOk("Logo uploaded.");
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to upload logo"));
                    }
                  }}
                >
                  {uploadLogo.isPending ? "Uploading…" : "Upload logo"}
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  disabled={verifyGstin.isPending || !gstin.trim()}
                  onClick={async () => {
                    setError(null);
                    setGstVerifyMessage(null);
                    try {
                      const res = await verifyGstin.mutateAsync();
                      setGstVerifyMessage(res.data.data.note);
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to start GSTIN verification"));
                    }
                  }}
                >
                  {verifyGstin.isPending ? "Starting…" : "Verify GSTIN"}
                </SecondaryButton>
              </div>

              <div className="text-xs text-[var(--muted)]">GSTIN verification is staged and ready for external integration later.</div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
