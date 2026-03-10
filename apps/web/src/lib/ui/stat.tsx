import * as React from "react";

export function StatCard(props: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-neutral-600">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-neutral-500">{props.hint}</div> : null}
    </div>
  );
}
