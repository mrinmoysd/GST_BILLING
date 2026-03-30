"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AuthShell(props: {
  mode?: "tenant" | "admin";
  eyebrow: string;
  title: string;
  subtitle: string;
  asideTitle: string;
  asideBody: string;
  asidePoints: string[];
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const admin = props.mode === "admin";

  return (
    <main
      className={cn(
        "min-h-screen overflow-hidden",
        admin ? "bg-[var(--public-auth-bg-admin)]" : "bg-[var(--public-auth-bg)]",
      )}
    >
      <div className="grid min-h-screen lg:grid-cols-[0.94fr_1.06fr]">
        <section className="relative flex min-h-[38vh] flex-col justify-between overflow-hidden border-b border-[var(--public-border)] px-6 py-8 lg:min-h-screen lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,95,140,0.16),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(23,32,51,0.12),transparent_34%)]" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--foreground)] text-sm font-semibold text-white">GB</div>
              <div>
                <div className="font-display text-2xl font-semibold leading-none text-[var(--foreground)]">GST Billing</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  {admin ? "Internal platform access" : "India-first billing operations"}
                </div>
              </div>
            </Link>
            <Badge variant="secondary">{admin ? "Internal" : "Workspace"}</Badge>
          </div>

          <div className="relative z-10 mt-14 space-y-6 lg:mt-20">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">{props.eyebrow}</div>
            <h1 className="font-display max-w-xl text-5xl leading-[0.92] font-semibold tracking-[-0.05em] text-[var(--foreground)] md:text-6xl">
              {props.title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-[var(--muted-strong)]">{props.subtitle}</p>
          </div>

          <div className="relative z-10 mt-10 max-w-xl space-y-5 border-t border-[var(--public-border)] pt-6">
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <ShieldCheck className="h-5 w-5" />
              <div className="text-sm font-semibold">{props.asideTitle}</div>
            </div>
            <p className="text-sm leading-6 text-[var(--muted-strong)]">{props.asideBody}</p>
            <div className="space-y-3">
              {props.asidePoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-6 text-[var(--muted-strong)]">
                  <ArrowRight className="mt-1 h-3.5 w-3.5 flex-none text-[var(--accent)]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[62vh] items-center px-4 py-8 md:px-8 lg:min-h-screen lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-[var(--public-border)] bg-[var(--public-auth-panel-bg)] p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
              {props.children}
            </div>
            {props.footer ? <div className="mt-6 text-sm text-[var(--muted)]">{props.footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
