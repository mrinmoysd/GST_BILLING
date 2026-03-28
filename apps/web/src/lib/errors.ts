import type { NormalizedApiError } from "@/lib/api/types";

export type AppError = NormalizedApiError & {
  userMessage: string;
  retryable: boolean;
  rawMessage?: string;
};

type NormalizeOptions = {
  fallback?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRawMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (isObject(error) && typeof error.message === "string") return error.message;
  return undefined;
}

function isTechnicalMessage(message: string) {
  const lowered = message.toLowerCase();
  return [
    "prisma",
    "sql",
    "stack",
    "exception",
    "trace",
    "jwt",
    "invalid `prisma",
    "failed to fetch",
    "networkerror",
    "request failed",
    "unexpected token",
  ].some((token) => lowered.includes(token));
}

function getStatus(error: unknown) {
  if (isObject(error) && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
}

function getCode(error: unknown) {
  if (isObject(error) && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}

function getDetails(error: unknown) {
  if (isObject(error) && "details" in error) {
    return error.details;
  }
  return undefined;
}

function isAbortError(error: unknown) {
  return isObject(error) && error.name === "AbortError";
}

function isNetworkError(error: unknown, rawMessage?: string) {
  if (isAbortError(error)) return false;
  if (error instanceof TypeError) return true;
  return rawMessage?.toLowerCase().includes("failed to fetch") ?? false;
}

function messageFromStatus(status: number | undefined, fallback: string) {
  switch (status) {
    case 400:
    case 422:
      return "Please review the highlighted details and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "This action conflicts with the current data. Refresh and try again.";
    case 429:
      return "Too many requests right now. Please wait a moment and try again.";
    default:
      return status && status >= 500
        ? "Something went wrong on our side. Please try again."
        : fallback;
  }
}

export function normalizeError(
  error: unknown,
  options: NormalizeOptions = {},
): AppError {
  const fallback = options.fallback ?? "Something went wrong. Please try again.";
  const rawMessage = getRawMessage(error);
  const status = getStatus(error);
  const code = getCode(error);
  const details = getDetails(error);

  let userMessage = fallback;

  if (isAbortError(error)) {
    userMessage = "That request was interrupted. Please try again.";
  } else if (isNetworkError(error, rawMessage)) {
    userMessage = "We couldn't reach the server. Check your connection and try again.";
  } else if (status !== undefined) {
    if (
      status < 500 &&
      rawMessage &&
      !isTechnicalMessage(rawMessage) &&
      rawMessage.trim().length > 0
    ) {
      userMessage = rawMessage;
    } else {
      userMessage = messageFromStatus(status, fallback);
    }
  } else if (rawMessage && !isTechnicalMessage(rawMessage)) {
    userMessage = rawMessage;
  }

  return {
    status,
    code,
    message: rawMessage ?? fallback,
    details,
    rawMessage,
    userMessage,
    retryable:
      isNetworkError(error, rawMessage) ||
      isAbortError(error) ||
      (status !== undefined && (status === 408 || status === 425 || status === 429 || status >= 500)),
  };
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  return normalizeError(error, { fallback }).userMessage;
}

export function logError(
  error: unknown,
  context: string,
  metadata?: Record<string, unknown>,
) {
  const normalized = normalizeError(error);
  console.error("[app-error]", {
    context,
    status: normalized.status,
    code: normalized.code,
    message: normalized.message,
    rawMessage: normalized.rawMessage,
    details: normalized.details,
    retryable: normalized.retryable,
    ...(metadata ? { metadata } : {}),
  });
  return normalized;
}
