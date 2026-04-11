"use client";

import * as React from "react";

import { BillingWarningStack } from "@/components/billing/warning-stack";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeLabel } from "@/lib/format/date";
import {
  useCompanyRoles,
  useCompanyUsers,
  useInviteCompanyUser,
  usePatchCompanyUser,
} from "@/lib/settings/usersHooks";
import { useSeatBillingWarnings } from "@/lib/settings/subscriptionHooks";
import { getErrorMessage } from "@/lib/errors";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import type { CompanyUser, RolesResponse } from "@/lib/settings/usersHooks";
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

type Props = { params: Promise<{ companyId: string }> };

export default function UsersSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const users = useCompanyUsers(companyId);
  const roles = useCompanyRoles(companyId);
  const seatWarnings = useSeatBillingWarnings(companyId);
  const invite = useInviteCompanyUser(companyId);
  const patch = usePatchCompanyUser(companyId);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [primaryRole, setPrimaryRole] = React.useState("staff");
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [editorName, setEditorName] = React.useState("");
  const [editorPrimaryRole, setEditorPrimaryRole] = React.useState("staff");
  const [editorRoleIds, setEditorRoleIds] = React.useState<string[]>([]);
  const [editorIsActive, setEditorIsActive] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const usersPayload = users.data as { ok?: boolean; data?: CompanyUser[] } | undefined;
  const rolesPayload = roles.data as { ok?: boolean; data?: RolesResponse } | undefined;
  const rows = React.useMemo(() => usersPayload?.data ?? [], [usersPayload?.data]);
  const rolesData = rolesPayload?.data ?? null;
  const builtInRoles = rolesData?.built_in ?? [];
  const customRoles = React.useMemo(() => rolesData?.roles ?? [], [rolesData]);
  const filteredRows = React.useMemo(() => {
    return rows.filter((user) => {
      const active = user.isActive;
      const customAssigned = user.assigned_roles.length > 0;
      if (segment === "active") return active;
      if (segment === "inactive") return !active;
      if (segment === "custom") return customAssigned;
      if (savedView === "admins") return user.role === "owner" || user.role === "admin";
      if (savedView === "operators") return user.role !== "owner" && user.role !== "admin";
      return true;
    });
  }, [rows, segment, savedView]);
  const selectedUser = filteredRows.find((user) => user.id === selectedUserId) ?? rows.find((user) => user.id === selectedUserId) ?? null;

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedUserId(null);
      return;
    }
    if (!selectedUserId || !filteredRows.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedUserId]);

  React.useEffect(() => {
    if (!selectedUser) return;
    setEditorName(selectedUser.name ?? "");
    setEditorPrimaryRole(selectedUser.role);
    setEditorRoleIds(
      customRoles
        .filter((role) => selectedUser.assigned_roles.includes(role.name))
        .map((role) => role.id),
    );
    setEditorIsActive(selectedUser.isActive);
  }, [customRoles, selectedUser]);

  function toggleRoleSelection(roleId: string, current: string[], setter: (next: string[]) => void) {
    setter(
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  const columns = React.useMemo<ColumnDef<CompanyUser>[]>(
    () => [
      {
        id: "user",
        header: "User",
        accessorFn: (user) => user.email,
        meta: { label: "User" },
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-[var(--foreground)]">{row.original.email}</div>
            <div className="text-xs text-[var(--muted)]">{row.original.name ?? "No name set"}</div>
          </div>
        ),
      },
      {
        id: "primaryRole",
        header: "Primary role",
        accessorFn: (user) => user.role,
        meta: { label: "Primary role" },
        cell: ({ row }) => <QueueRowStateBadge label={row.original.role} variant="outline" />,
      },
      {
        id: "assignedRoles",
        header: "Custom roles",
        accessorFn: (user) => user.assigned_roles.join(", "),
        meta: { label: "Custom roles" },
        cell: ({ row }) => row.original.assigned_roles.length ? row.original.assigned_roles.join(", ") : "—",
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (user) => (user.isActive ? "Active" : "Inactive"),
        meta: { label: "Status" },
        cell: ({ row }) => <QueueRowStateBadge label={row.original.isActive ? "Active" : "Inactive"} />,
      },
      {
        id: "lastLogin",
        header: "Last login",
        accessorFn: (user) => user.lastLogin ?? "",
        meta: { label: "Last login" },
        cell: ({ row }) => formatDateTimeLabel(row.original.lastLogin, "Never"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-7">
      <WorkspaceConfigHero
        eyebrow="People and access"
        title="Users"
        subtitle="Invite teammates, assign primary roles, and layer custom permission bundles onto each user."
        badges={[
          <WorkspaceStatBadge key="users" label="Users" value={rows.length} />,
          <WorkspaceStatBadge key="roles" label="Custom roles" value={customRoles.length} variant="outline" />,
          <WorkspaceStatBadge key="warnings" label="Seat warnings" value={seatWarnings.data?.items.length ?? 0} variant="outline" />,
        ]}
      />

      <BillingWarningStack summary={seatWarnings.data} limit={2} />

      <WorkspacePanel title="Invite user" subtitle="The invite flow supports a built-in primary role plus any number of custom role assignments.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} user{rows.length === 1 ? "" : "s"}</Badge>
            <Badge variant="outline">{customRoles.length} custom role{customRoles.length === 1 ? "" : "s"}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Email" value={email} onChange={setEmail} placeholder="user@example.com" />
            <TextField label="Name" value={name} onChange={setName} placeholder="Optional" />
            <div>
              <SelectField label="Primary role" value={primaryRole} onChange={setPrimaryRole}>
                {builtInRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
            <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Custom roles</div>
            {customRoles.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No custom roles yet. Create them from the Roles screen.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {customRoles.map((role) => (
                  <label key={role.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 text-sm shadow-[var(--shadow-soft)]">
                    <input
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRoleSelection(role.id, selectedRoleIds, setSelectedRoleIds)}
                      type="checkbox"
                    />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">{role.name}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{role.permissions.length} permissions</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error ? <InlineError message={error} /> : null}
          {ok ? <div className="text-sm text-[var(--success)]">{ok}</div> : null}

          <PrimaryButton
            type="button"
            disabled={invite.isPending}
            onClick={async () => {
              setError(null);
              setOk(null);
              if (!email.trim()) return setError("Email is required");
              try {
                const res = await invite.mutateAsync({
                  email: email.trim(),
                  name: name.trim() || undefined,
                  primary_role: primaryRole,
                  role_ids: selectedRoleIds,
                });
                const payload = res as { ok?: boolean; data?: { user?: CompanyUser; dev?: { temporary_password?: string } } };
                const pw = payload.data?.dev?.temporary_password;
                setOk(pw ? `Invited. Temporary password: ${pw}` : "Invited.");
                setEmail("");
                setName("");
                setPrimaryRole("staff");
                setSelectedRoleIds([]);
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Failed to invite"));
              }
            }}
          >
            {invite.isPending ? "Inviting…" : "Invite"}
          </PrimaryButton>
        </div>
      </WorkspacePanel>

      <QueueSegmentBar
        items={[
          { id: "all", label: "All users", count: rows.length },
          { id: "active", label: "Active", count: rows.filter((user) => user.isActive).length },
          { id: "inactive", label: "Inactive", count: rows.filter((user) => !user.isActive).length },
          { id: "custom", label: "Custom access", count: rows.filter((user) => user.assigned_roles.length > 0).length },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "All" },
              { id: "admins", label: "Admins" },
              { id: "operators", label: "Operators" },
            ]}
            value={savedView}
            onValueChange={setSavedView}
          />
        }
      />

      <QueueShell
        inspector={
          <QueueInspector
            eyebrow="Access editor"
            title={selectedUser ? selectedUser.name || selectedUser.email : "Select a user"}
            subtitle={selectedUser ? "Adjust the primary role, custom access bundle, and active state without leaving the roster." : "Choose a user from the roster to edit access."}
            footer={
              selectedUser ? (
                <QueueQuickActions>
                  <PrimaryButton
                    type="button"
                    disabled={patch.isPending}
                    onClick={async () => {
                      try {
                        await patch.mutateAsync({
                          userId: selectedUser.id,
                          patch: {
                            name: editorName.trim() || undefined,
                            primary_role: editorPrimaryRole,
                            role_ids: editorRoleIds,
                            is_active: editorIsActive,
                          },
                        });
                        setOk("User access updated.");
                      } catch (e: unknown) {
                        setError(getErrorMessage(e, "Failed to update user"));
                      }
                    }}
                  >
                    {patch.isPending ? "Saving…" : "Save access"}
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={() => setSelectedUserId(null)}>
                    Clear
                  </SecondaryButton>
                </QueueQuickActions>
              ) : null
            }
          >
            {!selectedUser ? (
              <EmptyState title="Select a user" hint="Choose a user from the roster to edit access." />
            ) : (
              <>
                <QueueMetaList
                  items={[
                    { label: "Email", value: selectedUser.email },
                    { label: "Last login", value: formatDateTimeLabel(selectedUser.lastLogin, "Never") },
                    { label: "Primary role", value: selectedUser.role },
                  ]}
                />
                <TextField label="Name" value={editorName} onChange={setEditorName} />
                <SelectField label="Primary role" value={editorPrimaryRole} onChange={setEditorPrimaryRole}>
                  {builtInRoles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </SelectField>
                <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                  <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Custom roles</div>
                  {customRoles.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No custom roles created yet.</div>
                  ) : (
                    customRoles.map((role) => (
                      <label key={role.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 text-sm shadow-[var(--shadow-soft)]">
                        <input
                          checked={editorRoleIds.includes(role.id)}
                          onChange={() => toggleRoleSelection(role.id, editorRoleIds, setEditorRoleIds)}
                          type="checkbox"
                        />
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{role.name}</div>
                          <div className="mt-1 text-xs text-[var(--muted)]">{role.permissions.join(", ")}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input checked={editorIsActive} onChange={(e) => setEditorIsActive(e.target.checked)} type="checkbox" />
                  User is active
                </label>
              </>
            )}
          </QueueInspector>
        }
      >
        <div className="space-y-3">
          {users.isLoading ? <LoadingBlock label="Loading users…" /> : null}
          {users.isError ? <InlineError message={getErrorMessage(users.error, "Failed to load users")} /> : null}
          {users.data && rows.length === 0 ? <EmptyState title="No users" hint="Invite one above." /> : null}
          {error ? <InlineError message={error} /> : null}
          {ok ? <div className="text-sm text-[var(--success)]">{ok}</div> : null}
        </div>

        {users.data && rows.length > 0 ? (
          <WorkspacePanel title="Company roster" subtitle="Review activity, access posture, and custom role coverage from one queue.">
            <DataGrid
              data={filteredRows}
              columns={columns}
              getRowId={(row) => row.id}
              onRowClick={(row) => setSelectedUserId(row.id)}
              rowClassName={(row) => (row.original.id === selectedUserId ? "bg-[var(--row-selected)]" : undefined)}
              initialSorting={[{ id: "user", desc: false }]}
              emptyTitle="No matching users"
              emptyHint="Try another saved view or segment."
              toolbarTitle="Users"
              toolbarDescription="Select a row to review and change the access bundle."
              toolbarActions={
                <div className="text-xs text-[var(--muted)]">
                  {filteredRows.length} of {rows.length} shown
                </div>
              }
            />
          </WorkspacePanel>
        ) : null}
      </QueueShell>
    </div>
  );
}
