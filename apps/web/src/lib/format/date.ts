"use client";

function parseDateInput(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const fallback = new Date(normalized);
  return Number.isNaN(fallback.valueOf()) ? null : fallback;
}

export function formatDateLabel(value: string | null | undefined, fallback = "—") {
  const date = parseDateInput(value);
  if (!date) return value?.trim() || fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(value: string | null | undefined, fallback = "—") {
  const date = parseDateInput(value);
  if (!date) return value?.trim() || fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
