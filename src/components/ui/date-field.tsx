import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface DateFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  density?: "sm" | "md";
}

/**
 * Campo de data padronizado (`type="date"`). Mesma semântica de valor do input
 * nativo (`yyyy-mm-dd`) — drop-in para os inputs de data dos formulários, sem
 * alterar parsing no servidor. Apenas unifica estilo/foco/acessibilidade.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, density = "md", ...props }, ref) => {
    const sizeClasses =
      density === "sm" ? "h-9 px-3 text-xs" : "h-11 px-3.5 text-sm";
    return (
      <input
        ref={ref}
        type="date"
        className={cn(
          "w-full rounded-xl border border-border bg-bg-elevated font-medium text-foreground",
          "placeholder:text-subtle placeholder:font-normal shadow-sm transition",
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/50",
          "hover:border-border-strong/70",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/40",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100",
          sizeClasses,
          className
        )}
        {...props}
      />
    );
  }
);
DateField.displayName = "DateField";
