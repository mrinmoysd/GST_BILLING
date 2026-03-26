"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type MigrationProject = {
  id: string;
  name: string;
  sourceSystem?: string | null;
  source_system?: string | null;
  goLiveDate?: string | null;
  go_live_date?: string | null;
  status: string;
  notes?: string | null;
  _count?: { jobs: number };
  jobs?: Array<{ id: string; entityType?: string; entity_type?: string; status: string }>;
};

export type ImportTemplate = {
  entity_type: string;
  title: string;
  columns: string[];
  sample: Record<string, unknown>;
};

export type ImportProfile = {
  id: string;
  name: string;
  entityType?: string;
  entity_type?: string;
  sourceFormat?: string;
  source_format?: string;
  columnMappings?: Record<string, string>;
  column_mappings?: Record<string, string>;
};

export type ImportJob = {
  id: string;
  entityType?: string;
  entity_type?: string;
  status: string;
  mode: string;
  fileName?: string | null;
  file_name?: string | null;
  summary?: Record<string, unknown> | null;
  top_errors?: Array<{ code: string; count: number }>;
  migrationProject?: { id: string; name: string } | null;
  migration_project_id?: string | null;
  sourceFormat?: string;
  source_format?: string;
  createdAt?: string;
  created_at?: string;
};

export type ImportJobRow = {
  id: string;
  rowNumber?: number;
  row_number?: number;
  status: string;
  rawPayloadJson?: Record<string, unknown>;
  raw_payload_json?: Record<string, unknown>;
  normalizedPayloadJson?: Record<string, unknown> | null;
  normalized_payload_json?: Record<string, unknown> | null;
  warningCodesJson?: unknown;
  warning_codes_json?: unknown;
  errorCodesJson?: unknown;
  error_codes_json?: unknown;
};

export type PrintTemplate = {
  id: string;
  templateType?: string;
  template_type?: string;
  name: string;
  status: string;
  isDefault?: boolean;
  is_default?: boolean;
  publishedVersionId?: string | null;
  published_version_id?: string | null;
  versions?: Array<{
    id: string;
    versionNo?: number;
    version_no?: number;
    layoutJson?: Record<string, unknown>;
    layout_json?: Record<string, unknown>;
    createdAt?: string;
    created_at?: string;
  }>;
};

export type CustomFieldDefinition = {
  id: string;
  entityType?: string;
  entity_type?: string;
  code: string;
  label: string;
  fieldType?: string;
  field_type?: string;
  isRequired?: boolean;
  is_required?: boolean;
  isPrintable?: boolean;
  is_printable?: boolean;
  isExportable?: boolean;
  is_exportable?: boolean;
  isActive?: boolean;
  is_active?: boolean;
};

export type CustomFieldValue = {
  id: string;
  entityType?: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  valueJson?: unknown;
  value_json?: unknown;
  definition?: CustomFieldDefinition;
};

export type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  status: string;
  subscribedEvents?: string[];
  subscribed_events?: string[];
  lastSuccessAt?: string | null;
  last_success_at?: string | null;
  lastFailureAt?: string | null;
  last_failure_at?: string | null;
};

export type WebhookDelivery = {
  id: string;
  eventType?: string;
  event_type?: string;
  eventKey?: string;
  event_key?: string;
  responseStatus?: number | null;
  response_status?: number | null;
  responseBodyExcerpt?: string | null;
  response_body_excerpt?: string | null;
  status: string;
  createdAt?: string;
  created_at?: string;
};

export type IntegrationApiKey = {
  id: string;
  name: string;
  keyPrefix?: string;
  key_prefix?: string;
  status: string;
  secret?: string;
};

export function useMigrationProjects(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "migration-projects"],
    queryFn: async () =>
      apiClient.get<MigrationProject[]>(companyPath(companyId, "/migration-projects")),
  });
}

export function useCreateMigrationProject(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "migration-projects", "create"],
    mutationFn: async (body: {
      name: string;
      source_system?: string;
      go_live_date?: string;
      notes?: string;
    }) => apiClient.post<MigrationProject>(companyPath(companyId, "/migration-projects"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "migration-projects"] });
    },
  });
}

export function useImportTemplates(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "import-templates"],
    queryFn: async () =>
      apiClient.get<ImportTemplate[]>(companyPath(companyId, "/imports/templates")),
  });
}

export function useTemplateDownload(companyId: string) {
  return useMutation({
    mutationKey: ["companies", companyId, "import-templates", "download"],
    mutationFn: async (entityType: string) =>
      apiClient.get<{ filename: string; content: string; columns: string[] }>(
        companyPath(companyId, `/imports/templates/${entityType}/download`),
      ),
  });
}

export function useImportProfiles(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "import-profiles"],
    queryFn: async () =>
      apiClient.get<ImportProfile[]>(companyPath(companyId, "/import-profiles")),
  });
}

export function useCreateImportProfile(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "import-profiles", "create"],
    mutationFn: async (body: {
      name: string;
      entity_type: string;
      source_format: string;
      column_mappings: Record<string, string>;
    }) => apiClient.post<ImportProfile>(companyPath(companyId, "/import-profiles"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-profiles"] });
    },
  });
}

export function useImportJobs(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "import-jobs"],
    queryFn: async () =>
      apiClient.get<ImportJob[]>(companyPath(companyId, "/import-jobs")),
  });
}

export function useUploadImportJob(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "import-jobs", "upload"],
    mutationFn: async (body: {
      entity_type: string;
      source_format?: string;
      mode?: string;
      migration_project_id?: string;
      import_profile_id?: string;
      file_name?: string;
      file_content_base64?: string;
      file_content_text?: string;
    }) => apiClient.post<ImportJob>(companyPath(companyId, "/import-jobs/upload"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-jobs"] });
    },
  });
}

export function useDryRunImportJob(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "import-jobs", "dry-run"],
    mutationFn: async (jobId: string) =>
      apiClient.post<ImportJob>(companyPath(companyId, `/import-jobs/${jobId}/dry-run`), {}),
    onSuccess: async (_, jobId) => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-jobs"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-job", jobId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-job-rows", jobId] });
    },
  });
}

export function useCommitImportJob(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "import-jobs", "commit"],
    mutationFn: async (jobId: string) =>
      apiClient.post<ImportJob>(companyPath(companyId, `/import-jobs/${jobId}/commit`), {}),
    onSuccess: async (_, jobId) => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-jobs"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-job", jobId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "import-job-rows", jobId] });
    },
  });
}

export function useImportJobRows(companyId: string, jobId: string | null) {
  return useQuery({
    enabled: Boolean(jobId),
    queryKey: ["companies", companyId, "import-job-rows", jobId],
    queryFn: async () =>
      apiClient.get<ImportJobRow[]>(
        companyPath(companyId, `/import-jobs/${jobId}/rows?page=1&limit=50`),
      ),
  });
}

export function usePrintTemplates(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "print-templates"],
    queryFn: async () =>
      apiClient.get<PrintTemplate[]>(companyPath(companyId, "/print-templates")),
  });
}

export function useCreatePrintTemplate(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "print-templates", "create"],
    mutationFn: async (body: {
      template_type: string;
      name: string;
      layout?: Record<string, unknown>;
    }) => apiClient.post<PrintTemplate>(companyPath(companyId, "/print-templates"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "print-templates"] });
    },
  });
}

export function useCreatePrintTemplateVersion(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "print-templates", "versions", "create"],
    mutationFn: async (args: {
      templateId: string;
      layout: Record<string, unknown>;
      sample_options?: Record<string, unknown>;
    }) =>
      apiClient.post(
        companyPath(companyId, `/print-templates/${args.templateId}/versions`),
        { layout: args.layout, sample_options: args.sample_options },
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "print-templates"] });
    },
  });
}

export function usePublishPrintTemplate(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "print-templates", "publish"],
    mutationFn: async (templateId: string) =>
      apiClient.post(companyPath(companyId, `/print-templates/${templateId}/publish`), {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "print-templates"] });
    },
  });
}

export function useSetDefaultPrintTemplate(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "print-templates", "set-default"],
    mutationFn: async (templateId: string) =>
      apiClient.post(companyPath(companyId, `/print-templates/${templateId}/set-default`), {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "print-templates"] });
    },
  });
}

export function usePreviewPrintTemplate(companyId: string) {
  return useMutation({
    mutationKey: ["companies", companyId, "print-templates", "preview"],
    mutationFn: async (args: {
      templateId: string;
      document_type?: string;
      document_id?: string;
    }) =>
      apiClient.post<{
        template: PrintTemplate;
        version: { id: string; layoutJson?: Record<string, unknown>; layout_json?: Record<string, unknown> };
        preview: Record<string, unknown>;
      }>(companyPath(companyId, `/print-templates/${args.templateId}/preview`), {
        document_type: args.document_type,
        document_id: args.document_id,
      }),
  });
}

export function useCustomFields(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "custom-fields"],
    queryFn: async () =>
      apiClient.get<CustomFieldDefinition[]>(companyPath(companyId, "/custom-fields")),
  });
}

export function useCreateCustomField(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "custom-fields", "create"],
    mutationFn: async (body: {
      entity_type: string;
      code: string;
      label: string;
      field_type: string;
      is_printable?: boolean;
      is_exportable?: boolean;
      is_required?: boolean;
    }) => apiClient.post<CustomFieldDefinition>(companyPath(companyId, "/custom-fields"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "custom-fields"] });
    },
  });
}

export function useCustomFieldValues(companyId: string, entityType: string, entityId: string) {
  return useQuery({
    enabled: Boolean(entityType && entityId),
    queryKey: ["companies", companyId, "custom-field-values", entityType, entityId],
    queryFn: async () =>
      apiClient.get<CustomFieldValue[]>(
        companyPath(companyId, `/custom-fields/values?entity_type=${entityType}&entity_id=${entityId}`),
      ),
  });
}

export function useSetCustomFieldValue(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "custom-field-values", "set"],
    mutationFn: async (body: {
      definition_id: string;
      entity_type: string;
      entity_id: string;
      value: unknown;
    }) => apiClient.post(companyPath(companyId, "/custom-fields/values"), body),
    onSuccess: async (_, body) => {
      await qc.invalidateQueries({
        queryKey: ["companies", companyId, "custom-field-values", body.entity_type, body.entity_id],
      });
    },
  });
}

export function useWebhookEndpoints(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "webhook-endpoints"],
    queryFn: async () =>
      apiClient.get<WebhookEndpoint[]>(companyPath(companyId, "/integrations/webhooks")),
  });
}

export function useCreateWebhookEndpoint(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "webhook-endpoints", "create"],
    mutationFn: async (body: {
      name: string;
      url: string;
      secret: string;
      subscribed_events?: string[];
    }) => apiClient.post<WebhookEndpoint>(companyPath(companyId, "/integrations/webhooks"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "webhook-endpoints"] });
    },
  });
}

export function useTestWebhookEndpoint(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "webhook-endpoints", "test"],
    mutationFn: async (args: { endpointId: string; event_type?: string }) =>
      apiClient.post(
        companyPath(companyId, `/integrations/webhooks/${args.endpointId}/test`),
        { event_type: args.event_type },
      ),
    onSuccess: async (_, args) => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "webhook-endpoints"] });
      await qc.invalidateQueries({
        queryKey: ["companies", companyId, "webhook-deliveries", args.endpointId],
      });
    },
  });
}

export function useWebhookDeliveries(companyId: string, endpointId: string | null) {
  return useQuery({
    enabled: Boolean(endpointId),
    queryKey: ["companies", companyId, "webhook-deliveries", endpointId],
    queryFn: async () =>
      apiClient.get<WebhookDelivery[]>(
        companyPath(companyId, `/integrations/webhooks/${endpointId}/deliveries`),
      ),
  });
}

export function useIntegrationApiKeys(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "integration-api-keys"],
    queryFn: async () =>
      apiClient.get<IntegrationApiKey[]>(companyPath(companyId, "/integrations/api-keys")),
  });
}

export function useCreateIntegrationApiKey(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "integration-api-keys", "create"],
    mutationFn: async (body: { name: string }) =>
      apiClient.post<IntegrationApiKey>(companyPath(companyId, "/integrations/api-keys"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "integration-api-keys"] });
    },
  });
}

export function useRevokeIntegrationApiKey(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "integration-api-keys", "revoke"],
    mutationFn: async (keyId: string) =>
      apiClient.post(companyPath(companyId, `/integrations/api-keys/${keyId}/revoke`), {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "integration-api-keys"] });
    },
  });
}
