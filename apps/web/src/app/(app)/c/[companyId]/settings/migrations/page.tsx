"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCommitImportJob,
  useCreateImportProfile,
  useCreateMigrationProject,
  useDryRunImportJob,
  useImportJobRows,
  useImportJobs,
  useImportProfiles,
  useImportTemplates,
  useMigrationProjects,
  useTemplateDownload,
  useUploadImportJob,
} from "@/lib/migration/hooks";
import { InlineError, LoadingBlock, PageContextStrip, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function MigrationSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const projects = useMigrationProjects(companyId);
  const templates = useImportTemplates(companyId);
  const profiles = useImportProfiles(companyId);
  const jobs = useImportJobs(companyId);
  const createProject = useCreateMigrationProject(companyId);
  const createProfile = useCreateImportProfile(companyId);
  const uploadImport = useUploadImportJob(companyId);
  const dryRun = useDryRunImportJob(companyId);
  const commit = useCommitImportJob(companyId);
  const downloadTemplate = useTemplateDownload(companyId);

  const [projectName, setProjectName] = React.useState("");
  const [sourceSystem, setSourceSystem] = React.useState("Marg ERP9");
  const [goLiveDate, setGoLiveDate] = React.useState("");
  const [profileName, setProfileName] = React.useState("");
  const [profileEntityType, setProfileEntityType] = React.useState("customers");
  const [profileMappings, setProfileMappings] = React.useState('{"external_code":"customer code","name":"party name"}');
  const [entityType, setEntityType] = React.useState("customers");
  const [mode, setMode] = React.useState("create_only");
  const [projectId, setProjectId] = React.useState("");
  const [profileId, setProfileId] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [fileContentText, setFileContentText] = React.useState("");
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const [latestSecret, setLatestSecret] = React.useState<string | null>(null);
  const rows = useImportJobRows(companyId, selectedJobId);

  const projectRows = Array.isArray(projects.data?.data) ? projects.data.data : [];
  const templateRows = Array.isArray(templates.data?.data) ? templates.data.data : [];
  const profileRows = Array.isArray(profiles.data?.data) ? profiles.data.data : [];
  const jobRows = Array.isArray(jobs.data?.data) ? jobs.data.data : [];
  const importRows = Array.isArray(rows.data?.data) ? rows.data.data : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Migrations"
        subtitle="Run D13 migration projects with templates, saved mappings, dry-run checks, and commit-stage import control."
        context={
          <PageContextStrip>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Structured onboarding</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Projects, templates, and profiles keep migration work grouped by go-live wave.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Safe imports</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Dry-run and commit stay separated so operators can catch mapping problems before data lands.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Job traceability</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Import rows and warnings remain visible in the same workspace for cutover review.</div>
              </div>
            </div>
          </PageContextStrip>
        }
      />

      {(projects.isLoading || templates.isLoading || profiles.isLoading || jobs.isLoading) ? (
        <LoadingBlock label="Loading migration workspace…" />
      ) : null}
      {projects.isError ? <InlineError message={getMessage(projects.error, "Failed to load migration projects")} /> : null}
      {templates.isError ? <InlineError message={getMessage(templates.error, "Failed to load templates")} /> : null}
      {profiles.isError ? <InlineError message={getMessage(profiles.error, "Failed to load import profiles")} /> : null}
      {jobs.isError ? <InlineError message={getMessage(jobs.error, "Failed to load import jobs")} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.1</Badge>
            <CardTitle>Create migration project</CardTitle>
            <CardDescription>Group import work by go-live wave so the team can track masters, opening stock, balances, and exceptions together.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createProject.mutateAsync({
                  name: projectName,
                  source_system: sourceSystem || undefined,
                  go_live_date: goLiveDate || undefined,
                });
                setProjectName("");
                setGoLiveDate("");
              }}
            >
              <TextField label="Project name" value={projectName} onChange={setProjectName} required />
              <TextField label="Source system" value={sourceSystem} onChange={setSourceSystem} />
              <TextField label="Go-live date" value={goLiveDate} onChange={setGoLiveDate} type="date" />
              <PrimaryButton type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Saving…" : "Create project"}
              </PrimaryButton>
            </form>
            <div className="mt-5 grid gap-3">
              {projectRows.map((project) => (
                <div key={project.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{project.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {(project.sourceSystem ?? project.source_system ?? "Unknown source")} · {project.status}
                      </div>
                    </div>
                    <Badge variant="outline">{project._count?.jobs ?? 0} jobs</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.1</Badge>
            <CardTitle>Saved import profile</CardTitle>
            <CardDescription>Keep reusable header mappings for recurring source sheets so dry-run doesn’t start from scratch every time.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createProfile.mutateAsync({
                  name: profileName,
                  entity_type: profileEntityType,
                  source_format: "csv",
                  column_mappings: JSON.parse(profileMappings),
                });
                setProfileName("");
              }}
            >
              <TextField label="Profile name" value={profileName} onChange={setProfileName} required />
              <SelectField label="Entity type" value={profileEntityType} onChange={setProfileEntityType}>
                {templateRows.map((template) => (
                  <option key={template.entity_type} value={template.entity_type}>
                    {template.title}
                  </option>
                ))}
              </SelectField>
              <label className="grid gap-2">
                <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Column mappings JSON</span>
                <textarea
                  className="min-h-28 rounded-xl border border-[var(--border)] bg-[var(--surface-field)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm outline-none"
                  value={profileMappings}
                  onChange={(event) => setProfileMappings(event.target.value)}
                />
              </label>
              <PrimaryButton type="submit" disabled={createProfile.isPending}>
                {createProfile.isPending ? "Saving…" : "Save profile"}
              </PrimaryButton>
            </form>
            <div className="mt-5 grid gap-3">
              {profileRows.map((profile) => (
                <div key={profile.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                  <div className="font-semibold text-[var(--foreground)]">{profile.name}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {(profile.entityType ?? profile.entity_type) || "Unknown entity"} · {(profile.sourceFormat ?? profile.source_format) || "csv"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13.2-D13.4</Badge>
            <CardTitle>Upload import job</CardTitle>
            <CardDescription>Paste CSV or load a file, then dry-run and commit it through the new D13 import engine.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await uploadImport.mutateAsync({
                  entity_type: entityType,
                  mode,
                  migration_project_id: projectId || undefined,
                  import_profile_id: profileId || undefined,
                  file_name: fileName || `${entityType}.csv`,
                  file_content_text: fileContentText,
                });
                setLatestSecret(null);
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField label="Entity type" value={entityType} onChange={setEntityType}>
                  {templateRows.map((template) => (
                    <option key={template.entity_type} value={template.entity_type}>
                      {template.title}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Mode" value={mode} onChange={setMode}>
                  <option value="create_only">Create only</option>
                  <option value="upsert_by_key">Upsert by key</option>
                  <option value="validate_only">Validate only</option>
                </SelectField>
                <SelectField label="Migration project" value={projectId} onChange={setProjectId}>
                  <option value="">None</option>
                  {projectRows.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Import profile" value={profileId} onChange={setProfileId}>
                  <option value="">Auto header mapping</option>
                  {profileRows
                    .filter((profile) => (profile.entityType ?? profile.entity_type) === entityType)
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                </SelectField>
              </div>
              <TextField label="File name" value={fileName} onChange={setFileName} placeholder={`${entityType}.csv`} />
              <label className="grid gap-2">
                <span className="text-[13px] font-semibold text-[var(--muted-strong)]">CSV content</span>
                <textarea
                  className="min-h-56 rounded-xl border border-[var(--border)] bg-[var(--surface-field)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm outline-none"
                  value={fileContentText}
                  onChange={(event) => setFileContentText(event.target.value)}
                  placeholder="Paste the import file here or load it from disk below."
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] font-semibold text-[var(--muted-strong)]">Load from file</span>
                <input
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-field)] px-3 py-2 text-sm"
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setFileName(file.name);
                    const buffer = await file.arrayBuffer();
                    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                      await uploadImport.mutateAsync({
                        entity_type: entityType,
                        mode,
                        migration_project_id: projectId || undefined,
                        import_profile_id: profileId || undefined,
                        file_name: file.name,
                        source_format: file.name.endsWith(".xlsx") ? "xlsx" : "xls",
                        file_content_base64: base64,
                      });
                      return;
                    }
                    setFileContentText(new TextDecoder().decode(buffer));
                  }}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={uploadImport.isPending}>
                  {uploadImport.isPending ? "Uploading…" : "Create import job"}
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  onClick={async () => {
                    const result = await downloadTemplate.mutateAsync(entityType);
                    setFileName(result.data.filename);
                    setFileContentText(result.data.content);
                  }}
                  disabled={downloadTemplate.isPending}
                >
                  {downloadTemplate.isPending ? "Loading…" : "Load sample template"}
                </PrimaryButton>
              </div>
            </form>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <div className="text-sm font-semibold text-[var(--foreground)]">Template coverage</div>
                <div className="mt-3 grid gap-2">
                  {templateRows.map((template) => (
                    <button
                      key={template.entity_type}
                      type="button"
                      onClick={() => setEntityType(template.entity_type)}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition hover:border-[var(--accent-soft)]"
                    >
                      <div className="font-medium text-[var(--foreground)]">{template.title}</div>
                      <div className="text-xs text-[var(--muted)]">{template.columns.join(", ")}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D13 execution</Badge>
            <CardTitle>Import jobs</CardTitle>
            <CardDescription>Dry-run first, inspect errors, then commit the rows that are clean enough to land.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="grid gap-3">
              {jobRows.map((job) => (
                <div key={job.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{job.fileName ?? job.file_name ?? job.id}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {(job.entityType ?? job.entity_type) || "Unknown entity"} · {job.status} · {job.mode}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PrimaryButton type="button" onClick={() => setSelectedJobId(job.id)}>
                        Inspect rows
                      </PrimaryButton>
                      <PrimaryButton type="button" onClick={() => dryRun.mutate(job.id)} disabled={dryRun.isPending}>
                        Dry-run
                      </PrimaryButton>
                      <PrimaryButton type="button" onClick={() => commit.mutate(job.id)} disabled={commit.isPending}>
                        Commit
                      </PrimaryButton>
                    </div>
                  </div>
                  {job.summary ? (
                    <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--surface)] p-3 text-xs text-[var(--muted-strong)]">
                      {JSON.stringify(job.summary, null, 2)}
                    </pre>
                  ) : null}
                  {Array.isArray(job.top_errors) && job.top_errors.length ? (
                    <div className="mt-3 text-sm text-[var(--secondary-foreground)]">
                      Top errors: {job.top_errors.map((error) => `${error.code} (${error.count})`).join(", ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">Row inspector</div>
                  <div className="text-xs text-[var(--muted)]">
                    {selectedJobId ? `Showing first 50 rows for ${selectedJobId}` : "Select a job to inspect its dry-run output."}
                  </div>
                </div>
              </div>
              {rows.isLoading ? <LoadingBlock label="Loading rows…" /> : null}
              {rows.isError ? <InlineError message={getMessage(rows.error, "Failed to load import rows")} /> : null}
              <div className="mt-4 grid gap-3">
                {importRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--foreground)]">
                        Row {row.rowNumber ?? row.row_number}
                      </div>
                      <Badge variant={row.status === "error" ? "destructive" : "outline"}>{row.status}</Badge>
                    </div>
                    <pre className="mt-3 overflow-x-auto text-xs text-[var(--muted-strong)]">
                      {JSON.stringify(row.normalizedPayloadJson ?? row.normalized_payload_json ?? row.rawPayloadJson ?? row.raw_payload_json, null, 2)}
                    </pre>
                    {row.errorCodesJson ?? row.error_codes_json ? (
                      <div className="mt-2 text-xs text-red-600">
                        Errors: {JSON.stringify(row.errorCodesJson ?? row.error_codes_json)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {latestSecret ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">{latestSecret}</div> : null}
    </div>
  );
}
