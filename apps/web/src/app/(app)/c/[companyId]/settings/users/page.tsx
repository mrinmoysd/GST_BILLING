"use client";

import * as React from "react";

import { useCompanyRoles, useCompanyUsers, useInviteCompanyUser, usePatchCompanyUser } from "@/lib/settings/usersHooks";
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
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Invite users and manage roles." />

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Invite user (dev-mode)</div>
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Email" value={email} onChange={setEmail} placeholder="user@example.com" />
          <TextField label="Name" value={name} onChange={setName} placeholder="Optional" />
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
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

        <div className="text-xs text-neutral-500">
          This is temporary dev-mode behavior. Replace with email invite tokens later.
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Users</div>
        {users.isLoading ? <LoadingBlock label="Loading users…" /> : null}
        {users.isError ? <InlineError message={getErrorMessage(users.error, "Failed to load users")} /> : null}
        {users.data && rows.length === 0 ? <EmptyState title="No users" hint="Invite one above." /> : null}

        {users.data && rows.length > 0 ? (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Active</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.name ?? "—"}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">{u.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 space-x-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
