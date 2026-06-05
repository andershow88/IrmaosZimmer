import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white shadow-md shadow-accent/20 hover:bg-accent-2",
        secondary: "bg-surface text-foreground hover:bg-surface-2 border border-border",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface",
        ghost: "text-foreground hover:bg-surface",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "min-h-10 px-4 py-2.5",
        lg: "min-h-11 px-5 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
