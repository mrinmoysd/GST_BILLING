export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  company_id: string;
};

export type SessionCompany = {
  id: string;
  name: string;
};

export type SessionState = {
  accessToken: string | null;
  user: SessionUser | null;
  company: SessionCompany | null;
};
