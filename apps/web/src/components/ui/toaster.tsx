"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        className: "border border-neutral-200 bg-white text-neutral-950",
      }}
    />
  );
}
