"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/session";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { session } = useAuth();

  React.useEffect(() => {
    if (session.user?.company_id) {
      router.replace(`/c/${session.user.company_id}/dashboard`);
    }
  }, [router, session.user?.company_id]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Dashboard</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Redirecting…
      </p>
    </main>
  );
}
