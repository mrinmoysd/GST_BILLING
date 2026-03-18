import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard(props: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,251,0.96))]">
      <CardContent className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{props.label}</div>
        <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{props.value}</div>
        {props.hint ? <div className="mt-2 text-sm text-[var(--muted)]">{props.hint}</div> : null}
      </CardContent>
    </Card>
  );
}
