import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent shrink-0">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
