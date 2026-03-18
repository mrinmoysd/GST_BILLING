import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em]",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
        secondary: "border-transparent bg-[var(--surface-muted)] text-[var(--muted-strong)]",
        destructive: "border-transparent bg-[var(--danger)] text-white",
        outline: "border-[var(--border)] bg-transparent text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
