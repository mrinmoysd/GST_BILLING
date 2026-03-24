"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
    <label className="block space-y-2">
      <Label className="text-[13px] font-semibold text-[var(--muted-strong)]">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type ?? "text"}
        required={required}
      />
    </label>
  );
}

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return <CalendarPopoverField label={label} value={value} onChange={onChange} placeholder={placeholder} required={required} />;
}

function parseDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const date = parseDateValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const firstGridDay = new Date(firstDay);
  firstGridDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    return date;
  });
}

export function CalendarPopoverField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const id = React.useId();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const selectedDate = React.useMemo(() => parseDateValue(value), [value]);
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(
    () => startOfMonth(selectedDate ?? new Date()),
  );

  React.useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const today = new Date();
  const days = React.useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  return (
    <div className="relative space-y-2" ref={rootRef}>
      <Label className="text-[13px] font-semibold text-[var(--muted-strong)]" htmlFor={id}>
        {label}
      </Label>
      <input id={id} type="hidden" value={value} required={required} readOnly />
      <button
        id={id}
        type="button"
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-left text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]",
          !value && "text-[var(--muted)]",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value ? formatDisplayDate(value) : placeholder ?? "Select date"}</span>
        <CalendarDays className="h-4 w-4 text-[var(--muted)]" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
              onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(visibleMonth)}
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
              onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              const selected = selectedDate ? isSameDate(day, selectedDate) : false;
              const todayMatch = isSameDate(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={cn(
                    "h-10 rounded-xl text-sm transition",
                    inMonth ? "text-[var(--foreground)]" : "text-[var(--muted)]",
                    selected
                      ? "bg-[var(--accent)] font-semibold text-white shadow-sm"
                      : "bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)]",
                    todayMatch && !selected && "border border-[var(--accent)]",
                  )}
                  onClick={() => {
                    onChange(formatDateValue(day));
                    setOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onChange(formatDateValue(today));
                setVisibleMonth(startOfMonth(today));
                setOpen(false);
              }}
            >
              Today
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  options,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children?: React.ReactNode;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className="block space-y-2">
      <Label className="text-[13px] font-semibold text-[var(--muted-strong)]">{label}</Label>
      <select
        className={cn(
          "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]",
          className,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {options?.map((option) => (
          <option key={`${option.value}:${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
    </label>
  );
}

export function PrimaryButton({
  children,
  ...props
}: ButtonProps & { children: React.ReactNode }) {
  return <Button {...props}>{children}</Button>;
}

export function SecondaryButton({
  children,
  ...props
}: ButtonProps & { children: React.ReactNode }) {
  return (
    <Button variant="secondary" {...props}>
      {children}
    </Button>
  );
}
