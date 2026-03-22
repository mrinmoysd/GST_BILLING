export const INTERNAL_ADMIN_ROLE_DEFINITIONS = [
  {
    code: 'super_admin',
    label: 'Super Admin',
    permissions: [
      'admin.access',
      'admin.dashboard.read',
      'admin.companies.manage',
      'admin.subscriptions.manage',
      'admin.usage.read',
      'admin.support.manage',
      'admin.observability.read',
      'admin.audit.read',
      'admin.internal_users.manage',
    ],
  },
  {
    code: 'platform_owner',
    label: 'Platform Owner',
    permissions: [
      'admin.access',
      'admin.dashboard.read',
      'admin.companies.manage',
      'admin.subscriptions.manage',
      'admin.usage.read',
      'admin.support.manage',
      'admin.observability.read',
      'admin.audit.read',
      'admin.internal_users.manage',
    ],
  },
  {
    code: 'finance_admin',
    label: 'Finance Admin',
    permissions: [
      'admin.access',
      'admin.dashboard.read',
      'admin.subscriptions.manage',
      'admin.usage.read',
      'admin.audit.read',
    ],
  },
  {
    code: 'support_admin',
    label: 'Support Admin',
    permissions: [
      'admin.access',
      'admin.dashboard.read',
      'admin.companies.manage',
      'admin.support.manage',
      'admin.audit.read',
    ],
  },
  {
    code: 'operations_admin',
    label: 'Operations Admin',
    permissions: [
      'admin.access',
      'admin.dashboard.read',
      'admin.observability.read',
      'admin.audit.read',
    ],
  },
  {
    code: 'read_only_admin',
    label: 'Read-only Admin',
    permissions: [
      'admin.access',
      'admin.dashboard.read',
      'admin.usage.read',
      'admin.observability.read',
      'admin.audit.read',
    ],
  },
] as const;

export type InternalAdminRoleCode =
  (typeof INTERNAL_ADMIN_ROLE_DEFINITIONS)[number]['code'];

const INTERNAL_ADMIN_ROLE_CODES = new Set<string>(
  INTERNAL_ADMIN_ROLE_DEFINITIONS.map((role) => role.code),
);

const INTERNAL_ADMIN_ROLE_MAP = new Map(
  INTERNAL_ADMIN_ROLE_DEFINITIONS.map((role) => [role.code, role]),
);

export function isInternalAdminRole(
  role: string | null | undefined,
): role is InternalAdminRoleCode {
  return Boolean(role && INTERNAL_ADMIN_ROLE_CODES.has(role));
}

export function getInternalAdminRoleDefinition(role: string) {
  return INTERNAL_ADMIN_ROLE_MAP.get(role as InternalAdminRoleCode);
}

export function getInternalAdminPermissions(role: string): string[] {
  const permissions = getInternalAdminRoleDefinition(role)?.permissions ?? [];
  return [...permissions];
}
