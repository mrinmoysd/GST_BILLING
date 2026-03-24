"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  useCompanyRoles,
  useCreateCompanyRole,
  useDeleteCompanyRole,
  usePatchCompanyRole,
} from "@/lib/settings/usersHooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { WorkspaceConfigHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function RolesSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const rolesQuery = useCompanyRoles(companyId);
  const createRole = useCreateCompanyRole(companyId);
  const patchRole = usePatchCompanyRole(companyId);
  const deleteRole = useDeleteCompanyRole(companyId);

  const [name, setName] = React.useState("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const [editorName, setEditorName] = React.useState("");
  const [editorPermissions, setEditorPermissions] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const rolesData = rolesQuery.data?.data;
  const customRoles = rolesData?.roles ?? [];
  const permissions = rolesData?.permissions ?? [];
  const auditEntries = rolesData?.audit ?? [];
  const selectedRole = customRoles.find((role) => role.id === selectedRoleId) ?? null;

  React.useEffect(() => {
    if (!selectedRole) return;
    setEditorName(selectedRole.name);
    setEditorPermissions(selectedRole.permissions);
  }, [selectedRole]);

  function togglePermission(code: string, current: string[], setter: (next: string[]) => void) {
    setter(current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  const groups = [...new Set(permissions.map((permission) => permission.group))];

  return (
    <div className="space-y-7">
      <WorkspaceConfigHero
        eyebrow="Access policy"
        title="Roles"
        subtitle="Define custom roles with explicit permission bundles and review recent admin-side access changes."
        badges={[
          <WorkspaceStatBadge key="roles" label="Custom roles" value={customRoles.length} />,
          <WorkspaceStatBadge key="permissions" label="Permissions" value={permissions.length} variant="outline" />,
        ]}
      />

      {rolesQuery.isLoading ? <LoadingBlock label="Loading roles…" /> : null}
      {rolesQuery.isError ? <InlineError message={getErrorMessage(rolesQuery.error, "Failed to load roles")} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <WorkspacePanel title="Create role" subtitle="Custom roles stack on top of a user’s built-in primary role.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{customRoles.length} custom role{customRoles.length === 1 ? "" : "s"}</Badge>
              <Badge variant="outline">{permissions.length} permissions</Badge>
            </div>
            <TextField label="Role name" value={name} onChange={setName} placeholder="e.g. warehouse-manager" />

            <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              {groups.map((group) => (
                <div key={group} className="space-y-2">
                  <div className="text-[13px] font-semibold capitalize text-[var(--muted-strong)]">{group}</div>
                  <div className="grid gap-2">
                    {permissions.filter((permission) => permission.group === group).map((permission) => (
                      <label key={permission.code} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
                        <input
                          checked={selectedPermissions.includes(permission.code)}
                          onChange={() => togglePermission(permission.code, selectedPermissions, setSelectedPermissions)}
                          type="checkbox"
                        />
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{permission.code}</div>
                          <div className="mt-1 text-xs text-[var(--muted)]">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error ? <InlineError message={error} /> : null}
            {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

            <PrimaryButton
              type="button"
              disabled={createRole.isPending}
              onClick={async () => {
                setError(null);
                setOk(null);
                if (!name.trim()) return setError("Role name is required");
                try {
                  await createRole.mutateAsync({
                    name: name.trim(),
                    permission_codes: selectedPermissions,
                  });
                  setOk("Role created.");
                  setName("");
                  setSelectedPermissions([]);
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to create role"));
                }
              }}
            >
              {createRole.isPending ? "Creating…" : "Create role"}
            </PrimaryButton>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Existing roles" subtitle="Choose a role to edit its permission bundle or remove it." tone="muted">
          <div className="space-y-4">
            {customRoles.length === 0 ? (
              <EmptyState title="No custom roles" hint="Create the first one from the panel on the left." />
            ) : (
              <>
                <div className="grid gap-3">
                  {customRoles.map((role) => (
                    <button
                      key={role.id}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedRoleId === role.id
                          ? "border-[var(--accent)] bg-[var(--surface)]"
                          : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent-soft)]"
                      }`}
                      onClick={() => setSelectedRoleId(role.id)}
                      type="button"
                    >
                      <div className="font-medium text-[var(--foreground)]">{role.name}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{role.user_count} assigned user{role.user_count === 1 ? "" : "s"}</div>
                    </button>
                  ))}
                </div>

                {selectedRole ? (
                  <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <TextField label="Role name" value={editorName} onChange={setEditorName} />
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <div key={group} className="space-y-2">
                          <div className="text-[13px] font-semibold capitalize text-[var(--muted-strong)]">{group}</div>
                          {permissions.filter((permission) => permission.group === group).map((permission) => (
                            <label key={permission.code} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
                              <input
                                checked={editorPermissions.includes(permission.code)}
                                onChange={() => togglePermission(permission.code, editorPermissions, setEditorPermissions)}
                                type="checkbox"
                              />
                              <div>
                                <div className="font-medium text-[var(--foreground)]">{permission.code}</div>
                                <div className="mt-1 text-xs text-[var(--muted)]">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <PrimaryButton
                        type="button"
                        disabled={patchRole.isPending}
                        onClick={async () => {
                          try {
                            await patchRole.mutateAsync({
                              roleId: selectedRole.id,
                              patch: {
                                name: editorName.trim(),
                                permission_codes: editorPermissions,
                              },
                            });
                            setOk("Role updated.");
                          } catch (e: unknown) {
                            setError(getErrorMessage(e, "Failed to update role"));
                          }
                        }}
                      >
                        {patchRole.isPending ? "Saving…" : "Save role"}
                      </PrimaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={deleteRole.isPending}
                        onClick={async () => {
                          try {
                            await deleteRole.mutateAsync(selectedRole.id);
                            setSelectedRoleId(null);
                            setOk("Role deleted.");
                          } catch (e: unknown) {
                            setError(getErrorMessage(e, "Failed to delete role"));
                          }
                        }}
                      >
                        {deleteRole.isPending ? "Deleting…" : "Delete role"}
                      </SecondaryButton>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Recent admin activity" subtitle="Lightweight auditability for role and user administration changes.">
        <div className="space-y-3">
          {auditEntries.length === 0 ? (
            <EmptyState title="No admin changes yet" hint="Role and user changes will appear here." />
          ) : (
            auditEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-sm font-medium text-[var(--foreground)]">{entry.summary}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {entry.actor_email ?? entry.actor_user_id} • {new Date(entry.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </WorkspacePanel>
    </div>
  );
}
