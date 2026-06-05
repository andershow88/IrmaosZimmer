import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  density?: "sm" | "md";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, density = "md", children, ...props }, ref) => {
    const sizeClasses =
      density === "sm" ? "h-9 px-3 pr-9 text-xs" : "h-11 px-3.5 pr-10 text-sm";
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-xl border border-border bg-bg-elevated font-medium text-foreground",
            "shadow-sm transition cursor-pointer",
            "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/50",
            "hover:border-border-strong/70",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            sizeClasses,
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
            density === "sm" ? "right-2.5 h-3.5 w-3.5" : "right-3 h-4 w-4"
          )}
        />
      </div>
    );
  }
);
Select.displayName = "Select";
