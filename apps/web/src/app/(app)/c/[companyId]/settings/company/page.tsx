"use client";

import * as React from "react";

import { useCompany, useUpdateCompany } from "@/lib/settings/companyHooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

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

  const [name, setName] = React.useState("");
  const [gstin, setGstin] = React.useState("");
  const [pan, setPan] = React.useState("");
  const [state, setState] = React.useState("");
  const [stateCode, setStateCode] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [allowNegStock, setAllowNegStock] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

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
    setAllowNegStock(Boolean(c.allowNegativeStock));
  }, [company.data]);

  return (
    <div className="space-y-6">
      <PageHeader title="Company" subtitle="Company profile and preferences." />

      {company.isLoading ? <LoadingBlock label="Loading company…" /> : null}
      {company.isError ? <InlineError message={getErrorMessage(company.error, "Failed to load company")} /> : null}
      {company.data && !company.data.data.data ? <EmptyState title="Company not found" /> : null}

      {company.data?.data.data ? (
        <div className="rounded-xl border bg-white p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Name" value={name} onChange={setName} required />
            <TextField label="GSTIN" value={gstin} onChange={setGstin} placeholder="15-char GSTIN" />
            <TextField label="PAN" value={pan} onChange={setPan} placeholder="10-char PAN" />
            <TextField label="State" value={state} onChange={setState} />
            <TextField label="State code" value={stateCode} onChange={setStateCode} />
            <TextField label="Timezone" value={timezone} onChange={setTimezone} />
            <TextField label="Logo URL (optional)" value={logoUrl} onChange={setLogoUrl} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowNegStock} onChange={(e) => setAllowNegStock(e.target.checked)} />
            Allow negative stock
          </label>

          {error ? <InlineError message={error} /> : null}
          {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

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

          <div className="text-xs text-neutral-500">
            Note: Logo upload isn’t implemented yet; this uses a URL field.
          </div>
        </div>
      ) : null}
    </div>
  );
}
