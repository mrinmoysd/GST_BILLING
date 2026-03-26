"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreatePrintTemplate,
  useCreatePrintTemplateVersion,
  usePreviewPrintTemplate,
  usePrintTemplates,
  usePublishPrintTemplate,
  useSetDefaultPrintTemplate,
} from "@/lib/migration/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PrintTemplatesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const templates = usePrintTemplates(companyId);
  const createTemplate = useCreatePrintTemplate(companyId);
  const createVersion = useCreatePrintTemplateVersion(companyId);
  const publish = usePublishPrintTemplate(companyId);
  const setDefault = useSetDefaultPrintTemplate(companyId);
  const preview = usePreviewPrintTemplate(companyId);

  const [templateType, setTemplateType] = React.useState("invoice");
  const [templateName, setTemplateName] = React.useState("");
  const [layoutJson, setLayoutJson] = React.useState(
    JSON.stringify(
      {
        header: { show_logo: true, title: "Invoice" },
        sections: [
          { key: "party", label: "Party details" },
          { key: "items", label: "Items" },
          { key: "totals", label: "Totals" },
        ],
      },
      null,
      2,
    ),
  );

  const templateRows = Array.isArray(templates.data?.data) ? templates.data.data : [];
  const previewPayload = preview.data?.data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Print templates"
        subtitle="Create D13 print layouts, version them safely, preview the data payload, and set the default template per document type."
      />

      {templates.isLoading ? <LoadingBlock label="Loading print templates…" /> : null}
      {templates.isError ? <InlineError message={getMessage(templates.error, "Failed to load print templates")} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.5</Badge>
            <CardTitle>Create template</CardTitle>
            <CardDescription>Start with a layout JSON draft, then create new versions as you refine the printed output.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createTemplate.mutateAsync({
                  template_type: templateType,
                  name: templateName,
                  layout: JSON.parse(layoutJson),
                });
                setTemplateName("");
              }}
            >
              <SelectField label="Template type" value={templateType} onChange={setTemplateType}>
                <option value="invoice">Invoice</option>
                <option value="quotation">Quotation</option>
                <option value="sales_order">Sales order</option>
                <option value="challan">Challan</option>
                <option value="receipt">Receipt</option>
                <option value="purchase">Purchase</option>
              </SelectField>
              <TextField label="Template name" value={templateName} onChange={setTemplateName} required />
              <label className="grid gap-2">
                <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Layout JSON</span>
                <textarea
                  className="min-h-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={layoutJson}
                  onChange={(event) => setLayoutJson(event.target.value)}
                />
              </label>
              <PrimaryButton type="submit" disabled={createTemplate.isPending}>
                {createTemplate.isPending ? "Saving…" : "Create template"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.5 preview</Badge>
            <CardTitle>Preview payload</CardTitle>
            <CardDescription>The preview surface returns the current layout JSON plus the sample document payload that will feed the renderer.</CardDescription>
          </CardHeader>
          <CardContent>
            {previewPayload ? (
              <pre className="overflow-x-auto rounded-2xl bg-[var(--surface-muted)] p-4 text-xs text-[var(--muted-strong)]">
                {JSON.stringify(previewPayload, null, 2)}
              </pre>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
                Use Preview on a template below to inspect the published version and its sample data payload.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.5 library</Badge>
            <CardTitle>Template library</CardTitle>
            <CardDescription>Publish and set defaults only when the version is ready. Drafting stays separate from the active company default.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {templateRows.map((template) => {
              const latestVersion = Array.isArray(template.versions) ? template.versions[0] : null;
              return (
                <div key={template.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{template.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {(template.templateType ?? template.template_type) || "Unknown type"} · {template.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.isDefault ?? template.is_default ? <Badge>Default</Badge> : null}
                      <PrimaryButton
                        type="button"
                        onClick={() =>
                          createVersion.mutate({
                            templateId: template.id,
                            layout: JSON.parse(layoutJson),
                          })
                        }
                      >
                        New version
                      </PrimaryButton>
                      <PrimaryButton type="button" onClick={() => publish.mutate(template.id)}>
                        Publish
                      </PrimaryButton>
                      <PrimaryButton type="button" onClick={() => setDefault.mutate(template.id)}>
                        Set default
                      </PrimaryButton>
                      <PrimaryButton type="button" onClick={() => preview.mutate({ templateId: template.id, document_type: "invoice" })}>
                        Preview
                      </PrimaryButton>
                    </div>
                  </div>
                  {latestVersion ? (
                    <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--surface)] p-3 text-xs text-[var(--muted-strong)]">
                      {JSON.stringify(latestVersion.layoutJson ?? latestVersion.layout_json ?? {}, null, 2)}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
