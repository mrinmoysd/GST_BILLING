"use client";

import * as React from "react";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium">{label}</div>
      <input
        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type ?? "text"}
        required={required}
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}
