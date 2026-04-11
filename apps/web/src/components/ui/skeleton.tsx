import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-[12px] border border-[var(--border)] bg-[var(--surface-muted)]", className)} {...props} />;
}

export { Skeleton };
