"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { type ThemeMode, useTheme } from "@/lib/theme/provider";
import { cn } from "@/lib/utils";

const options: Array<{
  value: ThemeMode;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "light", label: "Light", hint: "Low-glare daylight workspace", icon: Sun },
  { value: "dark", label: "Dark", hint: "Night-shift operator surface", icon: Moon },
  { value: "system", label: "System", hint: "Follow device appearance", icon: Monitor },
];

export function ThemeMenuItems() {
  const { mounted, resolvedTheme, setTheme, theme } = useTheme();

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;
          return (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="items-start gap-3 py-2.5 pl-3 pr-2">
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                  active
                    ? "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                  {option.label}
                  {active ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : null}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">{option.hint}</span>
              </span>
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
      <div className="px-2 py-2 text-xs text-[var(--muted)]">
        Active appearance: {mounted ? resolvedTheme : "loading"}
      </div>
    </>
  );
}
