"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Breadcrumbs(props: {
  items: Array<{ href?: string; label: string }>;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-xs text-neutral-500", props.className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {props.items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 ? <span className="text-neutral-300">/</span> : null}
            {it.href ? (
              <Link href={it.href} className="hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="text-neutral-700">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
