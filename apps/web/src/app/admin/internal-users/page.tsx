"use client";

import * as React from "react";

import {
  useAdminInternalRoles,
  useAdminInternalUsers,
  useCreateAdminInternalUser,
  useUpdateAdminInternalUser,
} from "@/lib/admin/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectControl, SelectField, TextField } from "@/lib/ui/form";

type RoleOption = {
  code: string;
  label: string;
  permissions: string[];
};

type InternalUserRow = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  permissions: string[];
  is_active: boolean;
  is_super_admin: boolean;
  last_login?: string | null;
  created_at: string;
};

function InternalUserActions(props: {
  row: InternalUserRow;
  roles: RoleOption[];
  busyId: string | null;
  setBusyId: (id: string | null) => void;
  setError: (message: string | null) => void;
}) {
  const updater = useUpdateAdminInternalUser(props.row.id);

  return (
    <>
      <DataTd>
        <SelectControl
          ariaLabel="Internal user role"
          className="h-10 px-3"
          value={props.row.role}
          onChange={async (value) => {
            try {
              props.setError(null);
              props.setBusyId(props.row.id);
              await updater.mutateAsync({ role: value });
            } catch (err) {
              props.setError(getErrorMessage(err, "Failed to update admin role"));
            } finally {
              props.setBusyId(null);
            }
          }}
          disabled={props.busyId === props.row.id || updater.isPending}
        >
          {props.roles.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </SelectControl>
      </DataTd>
      <DataTd>
        <Badge variant={props.row.is_active ? "secondary" : "outline"}>
          {props.row.is_active ? "Active" : "Inactive"}
        </Badge>
      </DataTd>
      <DataTd>
        <div className="flex max-w-[360px] flex-wrap gap-2">
          {props.row.permissions.map((permission) => (
            <Badge key={permission} variant="outline">
              {permission}
            </Badge>
          ))}
        </div>
      </DataTd>
      <DataTd>{props.row.last_login ? new Date(props.row.last_login).toLocaleString() : "Never"}</DataTd>
      <DataTd className="text-right">
        <div className="inline-flex gap-2">
          <SecondaryButton
            type="button"
            disabled={props.busyId === props.row.id || updater.isPending}
            onClick={async () => {
              try {
                props.setError(null);
                props.setBusyId(props.row.id);
                await updater.mutateAsync({ is_active: !props.row.is_active });
              } catch (err) {
                props.setError(getErrorMessage(err, "Failed to update admin status"));
              } finally {
                props.setBusyId(null);
              }
            }}
          >
            {props.row.is_active ? "Deactivate" : "Activate"}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={props.busyId === props.row.id || updater.isPending}
            onClick={async () => {
              try {
                props.setError(null);
                props.setBusyId(props.row.id);
                await updater.mutateAsync({ password: "ChangeMe123!" });
              } catch (err) {
                props.setError(getErrorMessage(err, "Failed to reset password"));
              } finally {
                props.setBusyId(null);
              }
            }}
          >
            Reset password
          </SecondaryButton>
        </div>
      </DataTd>
    </>
  );
}

export default function AdminInternalUsersPage() {
  const [q, setQ] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("platform_owner");
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const rolesQuery = useAdminInternalRoles();
  const usersQuery = useAdminInternalUsers({ page: 1, limit: 100, q: q || undefined });
  const createUser = useCreateAdminInternalUser();

  const roles = React.useMemo(
    () => ((rolesQuery.data?.data as RoleOption[] | undefined) ?? []),
    [rolesQuery.data],
  );
  const rows = React.useMemo(
    () => ((usersQuery.data?.data as InternalUserRow[] | undefined) ?? []),
    [usersQuery.data],
  );

  React.useEffect(() => {
    if (!role && roles[0]?.code) setRole(roles[0].code);
  }, [role, roles]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Governance"
        title="Internal users"
        subtitle="Manage internal admin operators, role assignments, and privileged access for the SaaS control plane."
      />

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create internal admin</CardTitle>
            <CardDescription>Provision an operator with a dedicated admin role and credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <TextField label="Name" value={name} onChange={setName} />
            <TextField label="Email" value={email} onChange={setEmail} required />
            <TextField label="Temporary password" type="password" value={password} onChange={setPassword} required />
            <div>
              <SelectField label="Role" value={role} onChange={setRole}>
                {roles.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <PrimaryButton
              type="button"
              disabled={createUser.isPending}
              onClick={async () => {
                try {
                  setError(null);
                  await createUser.mutateAsync({
                    name: name || undefined,
                    email,
                    password,
                    role,
                  });
                  setName("");
                  setEmail("");
                  setPassword("");
                } catch (err) {
                  setError(getErrorMessage(err, "Failed to create internal admin"));
                }
              }}
            >
              Create admin user
            </PrimaryButton>
            {error ? <InlineError message={error} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{rows.length} admin user{rows.length === 1 ? "" : "s"}</Badge>
              <Badge variant="outline">{roles.length} role profiles</Badge>
            </div>
            <CardTitle>Role catalog</CardTitle>
            <CardDescription>Internal admin roles use a lightweight fixed permission bundle.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {roles.map((option) => (
              <div key={option.code} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="font-semibold">{option.label}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {option.permissions.map((permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operator directory</CardTitle>
          <CardDescription>Search internal admins and change role or active status inline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <TextField label="Search" value={q} onChange={setQ} placeholder="email, name, or role" />
          </div>

          {rolesQuery.isLoading || usersQuery.isLoading ? <LoadingBlock label="Loading internal admin users..." /> : null}
          {rolesQuery.isError ? <InlineError message={getErrorMessage(rolesQuery.error, "Failed to load role catalog")} /> : null}
          {usersQuery.isError ? <InlineError message={getErrorMessage(usersQuery.error, "Failed to load internal users")} /> : null}

          {rows.length > 0 ? (
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>User</DataTh>
                    <DataTh>Role</DataTh>
                    <DataTh>Status</DataTh>
                    <DataTh>Permissions</DataTh>
                    <DataTh>Last login</DataTh>
                    <DataTh className="text-right">Actions</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((row) => {
                    return (
                      <DataTr key={row.id}>
                        <DataTd>
                          <div className="font-medium">{row.name || "Unnamed admin"}</div>
                          <div className="text-xs text-[var(--muted)]">{row.email}</div>
                        </DataTd>
                        <InternalUserActions
                          row={row}
                          roles={roles}
                          busyId={busyId}
                          setBusyId={setBusyId}
                          setError={setError}
                        />
                      </DataTr>
                    );
                  })}
                </tbody>
              </DataTable>
            </DataTableShell>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
