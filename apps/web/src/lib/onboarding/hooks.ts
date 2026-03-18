"use client";

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session";
import type { SessionCompany, SessionUser } from "@/lib/auth/types";

type BootstrapResponse = {
  access_token: string;
  user: SessionUser;
  company: SessionCompany;
  onboarding: {
    completed: boolean;
    gstin_verification_status: string;
  };
};

export function useBootstrapOnboarding() {
  const { setSessionFromLogin } = useAuth();

  return useMutation({
    mutationKey: ["onboarding", "bootstrap"],
    mutationFn: async (body: {
      company_name: string;
      owner_name: string;
      email: string;
      password: string;
      gstin?: string;
      pan?: string;
      business_type?: string;
      state?: string;
      state_code?: string;
      timezone?: string;
      invoice_prefix?: string;
      logo_url?: string;
      allow_negative_stock?: boolean;
    }) => {
      const res = await apiClient.post<BootstrapResponse>("/onboarding/bootstrap", body);
      setSessionFromLogin(res.data);
      return res.data;
    },
  });
}
