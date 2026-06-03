import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: string;
  /** Cor do ícone/realce. */
  tone?: "accent" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "accent",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm",
        className
      )}
    >
      {Icon && (
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted truncate">{hint}</p>}
      </div>
    </div>
  );
}
