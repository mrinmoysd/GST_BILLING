"use client";

import type { CommercialWarningSummary } from "@/lib/settings/subscriptionCommerce";
import { InlineNotice } from "@/lib/ui/state";

export function BillingWarningStack(props: {
  summary?: CommercialWarningSummary | null;
  empty?: React.ReactNode;
  limit?: number;
}) {
  const items = props.summary?.items ?? [];
  if (items.length === 0) return props.empty ?? null;

  return (
    <div className="space-y-3">
      {items.slice(0, props.limit ?? items.length).map((warning) => (
        <InlineNotice
          key={warning.code}
          title={warning.title}
          message={warning.message}
          tone={warning.severity}
        />
      ))}
    </div>
  );
}
