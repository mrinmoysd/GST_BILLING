"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCompanyRoles,
  useCompanyUsers,
  useInviteCompanyUser,
  usePatchCompanyUser,
} from "@/lib/settings/usersHooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
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

export default function UsersSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const users = useCompanyUsers(companyId);
  const roles = useCompanyRoles(companyId);
  const invite = useInviteCompanyUser(companyId);
  const patch = usePatchCompanyUser(companyId);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [primaryRole, setPrimaryRole] = React.useState("staff");
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [editorName, setEditorName] = React.useState("");
  const [editorPrimaryRole, setEditorPrimaryRole] = React.useState("staff");
  const [editorRoleIds, setEditorRoleIds] = React.useState<string[]>([]);
  const [editorIsActive, setEditorIsActive] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const rows = users.data?.data.data ?? [];
  const rolesData = roles.data?.data.data;
  const builtInRoles = rolesData?.built_in ?? [];
  const customRoles = React.useMemo(() => rolesData?.roles ?? [], [rolesData]);
  const selectedUser = rows.find((user) => user.id === selectedUserId) ?? null;

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

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Users"
        subtitle="Invite teammates, assign primary roles, and layer custom permission bundles onto each user."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} user{rows.length === 1 ? "" : "s"}</Badge>
            <Badge variant="outline">{customRoles.length} custom role{customRoles.length === 1 ? "" : "s"}</Badge>
          </div>
          <CardTitle>Invite user</CardTitle>
          <CardDescription>The invite flow now supports a built-in primary role plus any number of custom role assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Email" value={email} onChange={setEmail} placeholder="user@example.com" />
            <TextField label="Name" value={name} onChange={setName} placeholder="Optional" />
            <div>
              <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Primary role</label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
              >
                {builtInRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Custom roles</div>
            {customRoles.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No custom roles yet. Create them from the Roles screen.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {customRoles.map((role) => (
                  <label key={role.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
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
          {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

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
                const pw = res.data.data.dev?.temporary_password;
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
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="text-sm font-medium">Users</div>
          {users.isLoading ? <LoadingBlock label="Loading users…" /> : null}
          {users.isError ? <InlineError message={getErrorMessage(users.error, "Failed to load users")} /> : null}
          {users.data && rows.length === 0 ? <EmptyState title="No users" hint="Invite one above." /> : null}

          {users.data && rows.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Company users</CardTitle>
                <CardDescription>Select a row to edit primary role, custom roles, and activation status.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>User</DataTh>
                        <DataTh>Primary role</DataTh>
                        <DataTh>Assigned roles</DataTh>
                        <DataTh>Active</DataTh>
                        <DataTh>Actions</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {rows.map((user) => (
                        <DataTr key={user.id}>
                          <DataTd>
                            <div className="font-medium text-[var(--foreground)]">{user.email}</div>
                            <div className="text-xs text-[var(--muted)]">{user.name ?? "No name set"}</div>
                          </DataTd>
                          <DataTd>{user.role}</DataTd>
                          <DataTd>{user.assigned_roles.join(", ")}</DataTd>
                          <DataTd>{user.isActive ? "Yes" : "No"}</DataTd>
                          <DataTd>
                            <SecondaryButton type="button" onClick={() => setSelectedUserId(user.id)}>
                              Edit access
                            </SecondaryButton>
                          </DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access editor</CardTitle>
            <CardDescription>Use a real editor instead of prompt-based role changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedUser ? (
              <EmptyState title="Select a user" hint="Choose a user from the table to edit access." />
            ) : (
              <>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{selectedUser.email}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">Last login: {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Never"}</div>
                </div>

                <TextField label="Name" value={editorName} onChange={setEditorName} />

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Primary role</label>
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                    value={editorPrimaryRole}
                    onChange={(e) => setEditorPrimaryRole(e.target.value)}
                  >
                    {builtInRoles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[13px] font-semibold text-[var(--muted-strong)]">Custom roles</div>
                  {customRoles.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No custom roles created yet.</div>
                  ) : (
                    customRoles.map((role) => (
                      <label key={role.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
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

                <div className="flex flex-wrap gap-3">
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
