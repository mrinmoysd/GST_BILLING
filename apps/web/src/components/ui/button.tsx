import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-[var(--background)] shadow-[var(--shadow-soft)] active:translate-y-px",
  {
    variants: {
      variant: {
        default: "border-[color:color-mix(in_oklab,var(--accent)_82%,#0b1220)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
        secondary: "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
        outline: "border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
        ghost: "border-transparent bg-transparent text-[var(--muted-strong)] shadow-none hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        destructive: "border-[color:color-mix(in_oklab,var(--danger)_84%,#0b1220)] bg-[var(--danger)] text-white hover:opacity-95",
        link: "border-transparent bg-transparent px-0 text-[var(--accent)] shadow-none hover:text-[var(--accent-hover)] hover:underline underline-offset-4",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-[8px] px-3 text-[13px]",
        lg: "h-12 rounded-[10px] px-5 text-sm",
        icon: "h-10 w-10 rounded-[10px] px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
