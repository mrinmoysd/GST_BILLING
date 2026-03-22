export type AdminSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  assigned_roles: string[];
  permissions: string[];
  company_id: string | null;
  is_super_admin: boolean;
  is_active: boolean;
};

export type AdminSessionState = {
  accessToken: string | null;
  user: AdminSessionUser | null;
};
