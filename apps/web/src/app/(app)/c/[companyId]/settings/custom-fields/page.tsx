"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateCustomField,
  useCustomFieldValues,
  useCustomFields,
  useSetCustomFieldValue,
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

export default function CustomFieldsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const fields = useCustomFields(companyId);
  const createField = useCreateCustomField(companyId);
  const setValue = useSetCustomFieldValue(companyId);

  const [entityType, setEntityType] = React.useState("customer");
  const [code, setCode] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [fieldType, setFieldType] = React.useState("text");
  const [isPrintable, setIsPrintable] = React.useState(true);
  const [isExportable, setIsExportable] = React.useState(true);
  const [valueEntityType, setValueEntityType] = React.useState("customer");
  const [entityId, setEntityId] = React.useState("");
  const [definitionId, setDefinitionId] = React.useState("");
  const [valueJson, setValueJson] = React.useState('"Retail Zone A"');

  const fieldRows = Array.isArray(fields.data?.data) ? fields.data.data : [];
  const values = useCustomFieldValues(companyId, valueEntityType, entityId);
  const valueRows = Array.isArray(values.data?.data) ? values.data.data : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Custom fields"
        subtitle="Define controlled D13 fields for supported entities and attach typed values without changing the core schema every time."
      />

      {fields.isLoading ? <LoadingBlock label="Loading custom fields…" /> : null}
      {fields.isError ? <InlineError message={getMessage(fields.error, "Failed to load custom fields")} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6</Badge>
            <CardTitle>Create field definition</CardTitle>
            <CardDescription>Keep business-specific fields typed, printable, and exportable instead of adding uncontrolled free-form data everywhere.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createField.mutateAsync({
                  entity_type: entityType,
                  code,
                  label,
                  field_type: fieldType,
                  is_printable: isPrintable,
                  is_exportable: isExportable,
                });
                setCode("");
                setLabel("");
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField label="Entity type" value={entityType} onChange={setEntityType}>
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="product">Product</option>
                  <option value="invoice">Invoice</option>
                  <option value="sales_order">Sales order</option>
                  <option value="purchase">Purchase</option>
                </SelectField>
                <SelectField label="Field type" value={fieldType} onChange={setFieldType}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </SelectField>
                <TextField label="Code" value={code} onChange={setCode} required />
                <TextField label="Label" value={label} onChange={setLabel} required />
              </div>
              <div className="flex gap-6 text-sm text-[var(--muted-strong)]">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={isPrintable} onChange={(event) => setIsPrintable(event.target.checked)} />
                  Printable
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={isExportable} onChange={(event) => setIsExportable(event.target.checked)} />
                  Exportable
                </label>
              </div>
              <PrimaryButton type="submit" disabled={createField.isPending}>
                {createField.isPending ? "Saving…" : "Create custom field"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 values</Badge>
            <CardTitle>Assign field value</CardTitle>
            <CardDescription>Use a real entity id from the workspace and save the value as JSON so the print and export layers can consume it safely.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await setValue.mutateAsync({
                  definition_id: definitionId,
                  entity_type: valueEntityType,
                  entity_id: entityId,
                  value: JSON.parse(valueJson),
                });
              }}
            >
              <SelectField label="Entity type" value={valueEntityType} onChange={setValueEntityType}>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="product">Product</option>
                <option value="invoice">Invoice</option>
                <option value="sales_order">Sales order</option>
                <option value="purchase">Purchase</option>
              </SelectField>
              <SelectField label="Field definition" value={definitionId} onChange={setDefinitionId}>
                <option value="">Select…</option>
                {fieldRows
                  .filter((field) => (field.entityType ?? field.entity_type) === valueEntityType)
                  .map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
              </SelectField>
              <TextField label="Entity id" value={entityId} onChange={setEntityId} required />
              <label className="grid gap-2">
                <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Value JSON</span>
                <textarea
                  className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={valueJson}
                  onChange={(event) => setValueJson(event.target.value)}
                />
              </label>
              <PrimaryButton type="submit" disabled={setValue.isPending}>
                {setValue.isPending ? "Saving…" : "Save value"}
              </PrimaryButton>
            </form>
            {values.isLoading ? <LoadingBlock label="Loading field values…" /> : null}
            {values.isError ? <InlineError message={getMessage(values.error, "Failed to load field values")} /> : null}
            <div className="mt-5 grid gap-3">
              {valueRows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="font-semibold text-[var(--foreground)]">{row.definition?.label}</div>
                  <pre className="mt-2 overflow-x-auto text-xs text-[var(--muted-strong)]">
                    {JSON.stringify(row.valueJson ?? row.value_json, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.6 catalog</Badge>
            <CardTitle>Field catalog</CardTitle>
            <CardDescription>The catalog stays bounded and typed so reports and document templates can consume it without schema drift.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {fieldRows.map((field) => (
              <div key={field.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">{field.label}</div>
                    <div className="text-sm text-[var(--muted)]">
                      {(field.entityType ?? field.entity_type) || "Unknown entity"} · {field.code} · {(field.fieldType ?? field.field_type) || "text"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {field.isPrintable ?? field.is_printable ? <Badge>Printable</Badge> : null}
                    {field.isExportable ?? field.is_exportable ? <Badge variant="outline">Exportable</Badge> : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
