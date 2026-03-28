"use client";

import { toast } from "sonner";

import { getErrorMessage, logError, normalizeError } from "@/lib/errors";

export function toastSuccess(message: string, options?: { id?: string; description?: string }) {
  return toast.success(message, {
    id: options?.id,
    description: options?.description,
  });
}

export function toastInfo(message: string, options?: { id?: string; description?: string }) {
  return toast.info(message, {
    id: options?.id,
    description: options?.description,
  });
}

export function toastError(
  error: unknown,
  options?: {
    fallback?: string;
    id?: string;
    context?: string;
    description?: string;
    title?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const normalized = normalizeError(error, { fallback: options?.fallback });
  logError(error, options?.context ?? "ui-action", options?.metadata);
  return toast.error(options?.title ?? normalized.userMessage, {
    id: options?.id,
    description: options?.description,
  });
}

export function toastFormError(message: string, options?: { id?: string }) {
  return toast.error(message, { id: options?.id });
}

export { getErrorMessage };
