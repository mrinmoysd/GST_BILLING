"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { formatDateTimeLabel } from "@/lib/format/date";
import {
  useCompanyRoles,
  useCreateCompanyRole,
  useDeleteCompanyRole,
  usePatchCompanyRole,
} from "@/lib/settings/usersHooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueRowStateBadge,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
} from "@/lib/ui/queue";
import { WorkspaceConfigHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function RolesSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const rolesQuery = useCompanyRoles(companyId);
  const createRole = useCreateCompanyRole(companyId);
  const patchRole = usePatchCompanyRole(companyId);
  const deleteRole = useDeleteCompanyRole(companyId);

  const [name, setName] = React.useState("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [editorName, setEditorName] = React.useState("");
  const [editorPermissions, setEditorPermissions] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const rolesData = rolesQuery.data?.data;
  const customRoles = React.useMemo(() => rolesData?.roles ?? [], [rolesData?.roles]);
  const permissions = React.useMemo(() => rolesData?.permissions ?? [], [rolesData?.permissions]);
  const auditEntries = React.useMemo(() => rolesData?.audit ?? [], [rolesData?.audit]);
  const filteredRoles = React.useMemo(() => {
    return customRoles.filter((role) => {
      if (segment === "assigned") return role.user_count > 0;
      if (segment === "unused") return role.user_count === 0;
      if (savedView === "broad") return role.permissions.length >= 10;
      if (savedView === "compact") return role.permissions.length < 10;
      return true;
    });
  }, [customRoles, savedView, segment]);
  const selectedRole = filteredRoles.find((role) => role.id === selectedRoleId) ?? customRoles.find((role) => role.id === selectedRoleId) ?? null;

  React.useEffect(() => {
    if (!selectedRole) return;
    setEditorName(selectedRole.name);
    setEditorPermissions(selectedRole.permissions);
  }, [selectedRole]);

  React.useEffect(() => {
    if (!filteredRoles.length) {
      setSelectedRoleId(null);
      return;
    }
    if (!selectedRoleId || !filteredRoles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(filteredRoles[0]?.id ?? null);
    }
  }, [filteredRoles, selectedRoleId]);

  function togglePermission(code: string, current: string[], setter: (next: string[]) => void) {
    setter(current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  const groups = [...new Set(permissions.map((permission) => permission.group))];

  const roleColumns = React.useMemo<ColumnDef<(typeof customRoles)[number]>[]>(
    () => [
      {
        id: "name",
        header: "Role",
        accessorFn: (role) => role.name,
        meta: { label: "Role" },
        cell: ({ row }) => <div className="font-medium text-[var(--foreground)]">{row.original.name}</div>,
      },
      {
        id: "permissions",
        header: "Permissions",
        accessorFn: (role) => role.permissions.length,
        meta: { label: "Permissions", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.permissions.length,
      },
      {
        id: "users",
        header: "Assigned users",
        accessorFn: (role) => role.user_count,
        meta: { label: "Assigned users", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.user_count,
      },
      {
        id: "coverage",
        header: "Coverage",
        accessorFn: (role) => (role.user_count > 0 ? "In use" : "Unused"),
        meta: { label: "Coverage" },
        cell: ({ row }) => <QueueRowStateBadge label={row.original.user_count > 0 ? "In use" : "Unused"} variant="outline" />,
      },
    ],
    [],
  );

  const auditColumns = React.useMemo<ColumnDef<(typeof auditEntries)[number]>[]>(
    () => [
      {
        id: "summary",
        header: "Activity",
        accessorFn: (entry) => entry.summary,
        meta: { label: "Activity" },
        cell: ({ row }) => <div className="font-medium text-[var(--foreground)]">{row.original.summary}</div>,
      },
      {
        id: "actor",
        header: "Actor",
        accessorFn: (entry) => entry.actor_email ?? entry.actor_user_id ?? "",
        meta: { label: "Actor" },
        cell: ({ row }) => row.original.actor_email ?? row.original.actor_user_id ?? "System",
      },
      {
        id: "createdAt",
        header: "When",
        accessorFn: (entry) => entry.created_at,
        meta: { label: "When" },
        cell: ({ row }) => formatDateTimeLabel(row.original.created_at),
      },
    ],
    [],
  );

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

      <QueueSegmentBar
        items={[
          { id: "all", label: "All roles", count: customRoles.length },
          { id: "assigned", label: "Assigned", count: customRoles.filter((role) => role.user_count > 0).length },
          { id: "unused", label: "Unused", count: customRoles.filter((role) => role.user_count === 0).length },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "All" },
              { id: "broad", label: "Broad access" },
              { id: "compact", label: "Compact access" },
            ]}
            value={savedView}
            onValueChange={setSavedView}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <WorkspacePanel title="Create role" subtitle="Custom roles stack on top of a user’s built-in primary role.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{customRoles.length} custom role{customRoles.length === 1 ? "" : "s"}</Badge>
              <Badge variant="outline">{permissions.length} permissions</Badge>
            </div>
            <TextField label="Role name" value={name} onChange={setName} placeholder="e.g. warehouse-manager" />

            <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
              {groups.map((group) => (
                <div key={group} className="space-y-2">
                  <div className="text-[13px] font-semibold capitalize text-[var(--muted-strong)]">{group}</div>
                  <div className="grid gap-2">
                    {permissions.filter((permission) => permission.group === group).map((permission) => (
                      <label key={permission.code} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 text-sm shadow-[var(--shadow-soft)]">
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
            {ok ? <div className="text-sm text-[var(--success)]">{ok}</div> : null}

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

        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Role editor"
              title={selectedRole?.name ?? "Select a role"}
              subtitle={selectedRole ? "Adjust the permission bundle or retire the role if it is no longer needed." : "Choose a role from the catalog to edit it."}
              footer={
                selectedRole ? (
                  <QueueQuickActions>
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
                  </QueueQuickActions>
                ) : null
              }
            >
              {!selectedRole ? (
                <EmptyState title="No custom roles" hint="Create the first role from the panel on the left." />
              ) : (
                <>
                  <QueueMetaList
                    items={[
                      { label: "Role", value: selectedRole.name },
                      { label: "Assigned users", value: selectedRole.user_count },
                      { label: "Permissions", value: selectedRole.permissions.length },
                    ]}
                  />
                  <TextField label="Role name" value={editorName} onChange={setEditorName} />
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div key={group} className="space-y-2">
                        <div className="text-[13px] font-semibold capitalize text-[var(--muted-strong)]">{group}</div>
                        {permissions.filter((permission) => permission.group === group).map((permission) => (
                          <label key={permission.code} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 text-sm shadow-[var(--shadow-soft)]">
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
                </>
              )}
            </QueueInspector>
          }
        >
          <WorkspacePanel title="Role catalog" subtitle="Review permission bundle size, usage, and role posture from one queue." tone="muted">
            {customRoles.length === 0 ? (
              <EmptyState title="No custom roles" hint="Create the first one from the panel on the left." />
            ) : (
              <DataGrid
                data={filteredRoles}
                columns={roleColumns}
                getRowId={(row) => row.id}
                onRowClick={(row) => setSelectedRoleId(row.id)}
                rowClassName={(row) => (row.original.id === selectedRoleId ? "bg-[var(--row-selected)]" : undefined)}
                initialSorting={[{ id: "users", desc: true }]}
                emptyTitle="No matching roles"
                emptyHint="Try another role segment or saved view."
                toolbarTitle="Roles"
                toolbarDescription="Select a role to inspect or change its permission bundle."
                toolbarActions={<div className="text-xs text-[var(--muted)]">{filteredRoles.length} roles shown</div>}
              />
            )}
          </WorkspacePanel>
        </QueueShell>
      </div>

      <WorkspacePanel title="Recent admin activity" subtitle="Lightweight auditability for role and user administration changes.">
        {auditEntries.length === 0 ? (
          <EmptyState title="No admin changes yet" hint="Role and user changes will appear here." />
        ) : (
          <DataGrid
            data={auditEntries}
            columns={auditColumns}
            getRowId={(row) => row.id}
            initialSorting={[{ id: "createdAt", desc: true }]}
            toolbarTitle="Activity log"
            toolbarDescription="Recent role and user administration changes for this company."
          />
        )}
      </WorkspacePanel>
    </div>
  );
}
