"use client";

import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/lib/theme/provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      theme={resolvedTheme}
      expand={false}
      visibleToasts={4}
      duration={4200}
      toastOptions={{
        className:
          "rounded-[14px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-soft)]",
      }}
    />
  );
}
