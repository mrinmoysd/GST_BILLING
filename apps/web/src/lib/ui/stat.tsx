import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard(props: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "quiet" | "strong" }) {
  return (
    <Card
      className={cn(
        props.tone === "strong"
          ? "border-[var(--border)] bg-[var(--surface-panel-strong)] text-white"
          : props.tone === "quiet"
            ? "bg-[var(--surface-panel-muted)]"
            : "bg-[var(--surface-panel)]",
      )}
    >
      <CardContent className="p-5">
        <div className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", props.tone === "strong" ? "text-white/56" : "text-[var(--muted)]")}>{props.label}</div>
        <div className={cn("mt-3 text-3xl font-semibold tracking-[-0.03em]", props.tone === "strong" ? "text-white" : "text-[var(--foreground)]")}>{props.value}</div>
        {props.hint ? <div className={cn("mt-2 text-sm", props.tone === "strong" ? "text-white/72" : "text-[var(--muted)]")}>{props.hint}</div> : null}
      </CardContent>
    </Card>
  );
}
