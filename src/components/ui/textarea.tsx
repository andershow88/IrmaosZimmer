import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-xl border border-border bg-bg-elevated px-3.5 py-2.5 text-sm font-medium text-foreground",
        "placeholder:text-subtle placeholder:font-normal shadow-sm transition outline-none resize-y",
        "focus:border-accent focus:ring-2 focus:ring-accent/20",
        "hover:border-border-strong/70",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
