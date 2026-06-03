import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-bg-elevated/40 px-6 py-12 text-center">
      {Icon && (
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {message && <p className="text-xs text-muted max-w-xs">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
