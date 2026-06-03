import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  density?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, density = "md", ...props }, ref) => {
    const sizeClasses = density === "sm" ? "h-9 px-3 text-xs" : "h-11 px-3.5 text-sm";
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-border bg-bg-elevated font-medium text-foreground",
          "placeholder:text-subtle placeholder:font-normal shadow-sm transition outline-none",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          "hover:border-border-strong/70",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
