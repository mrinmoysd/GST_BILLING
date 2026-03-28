"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Breadcrumbs(props: {
  items: Array<{ href?: string; label: string }>;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-xs text-[var(--muted)]", props.className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {props.items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 ? <span className="text-[var(--border-strong)]">/</span> : null}
            {it.href ? (
              <Link href={it.href} className="hover:text-[var(--foreground)] hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="text-[var(--muted-strong)]">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
