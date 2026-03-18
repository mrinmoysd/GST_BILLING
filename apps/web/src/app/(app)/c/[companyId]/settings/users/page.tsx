"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyRoles, useCompanyUsers, useInviteCompanyUser, usePatchCompanyUser } from "@/lib/settings/usersHooks";
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
  const [role, setRole] = React.useState("staff");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const rows = users.data?.data.data ?? [];
  const builtInRoles = roles.data?.data.data.built_in ?? [
    { id: "builtin-owner", name: "owner", builtin: true as const },
    { id: "builtin-admin", name: "admin", builtin: true as const },
    { id: "builtin-staff", name: "staff", builtin: true as const },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Users"
        subtitle="Invite team members and adjust current access assignments from a stronger admin-style layout."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{rows.length} user{rows.length === 1 ? "" : "s"}</Badge>
            <Badge variant="outline">{builtInRoles.length} built-in role options</Badge>
          </div>
          <CardTitle>Invite user</CardTitle>
          <CardDescription>The current flow is still dev-mode based, but the screen now matches the broader settings system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Email" value={email} onChange={setEmail} placeholder="user@example.com" />
          <TextField label="Name" value={name} onChange={setName} placeholder="Optional" />
          <div>
            <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Role</label>
            <select className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              {builtInRoles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
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
                const res = await invite.mutateAsync({ email: email.trim(), name: name.trim() || undefined, role });
                const pw = res.data.data.dev?.temporary_password;
                setOk(pw ? `Invited. Temporary password: ${pw}` : "Invited.");
                setEmail("");
                setName("");
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Failed to invite"));
              }
            }}
          >
            {invite.isPending ? "Inviting…" : "Invite"}
          </PrimaryButton>

          <div className="text-xs text-[var(--muted)]">This is temporary dev-mode behavior. Replace it with email invite tokens later.</div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="text-sm font-medium">Users</div>
        {users.isLoading ? <LoadingBlock label="Loading users…" /> : null}
        {users.isError ? <InlineError message={getErrorMessage(users.error, "Failed to load users")} /> : null}
        {users.data && rows.length === 0 ? <EmptyState title="No users" hint="Invite one above." /> : null}

        {users.data && rows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Company users</CardTitle>
              <CardDescription>Adjust current role or activation status from a consistent table layout.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Email</DataTh>
                      <DataTh>Name</DataTh>
                      <DataTh>Role</DataTh>
                      <DataTh>Active</DataTh>
                      <DataTh>Actions</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {rows.map((u) => (
                      <DataTr key={u.id}>
                        <DataTd>{u.email}</DataTd>
                        <DataTd>{u.name ?? "—"}</DataTd>
                        <DataTd>{u.role}</DataTd>
                        <DataTd>{u.isActive ? "Yes" : "No"}</DataTd>
                        <DataTd className="space-x-2">
                      <SecondaryButton
                        type="button"
                        disabled={patch.isPending}
                        onClick={async () => {
                          const newRole = window.prompt("Role (owner/admin/staff)", u.role);
                          if (!newRole || !newRole.trim()) return;
                          try {
                            await patch.mutateAsync({ userId: u.id, patch: { role: newRole.trim() } });
                          } catch (e: unknown) {
                            window.alert(getErrorMessage(e, "Failed to update"));
                          }
                        }}
                      >
                        Change role
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        disabled={patch.isPending}
                        onClick={async () => {
                          try {
                            await patch.mutateAsync({ userId: u.id, patch: { is_active: !u.isActive } });
                          } catch (e: unknown) {
                            window.alert(getErrorMessage(e, "Failed to update"));
                          }
                        }}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
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
    </div>
  );
}
