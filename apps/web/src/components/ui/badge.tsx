import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]",
        secondary: "border-[color:color-mix(in_oklab,var(--secondary)_18%,var(--border))] bg-[color:color-mix(in_oklab,var(--secondary-soft)_76%,var(--surface))] text-[var(--secondary-foreground)]",
        destructive: "border-transparent bg-[var(--danger)] text-white",
        outline: "border-[var(--border)] bg-[var(--surface-panel-glass)] text-[var(--foreground)]",
        success: "border-[color:color-mix(in_oklab,var(--success)_22%,var(--border))] bg-[color:color-mix(in_oklab,var(--success-soft)_80%,var(--surface))] text-[var(--success)]",
        warning: "border-[color:color-mix(in_oklab,var(--warning)_22%,var(--border))] bg-[color:color-mix(in_oklab,var(--warning-soft)_82%,var(--surface))] text-[var(--warning)]",
        info: "border-[color:color-mix(in_oklab,var(--info)_22%,var(--border))] bg-[color:color-mix(in_oklab,var(--info-soft)_82%,var(--surface))] text-[var(--info)]",
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
