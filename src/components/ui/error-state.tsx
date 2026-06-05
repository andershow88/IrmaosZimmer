import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Estado de erro reutilizável (análogo a `EmptyState`).
 * Informe `onRetry` para exibir o botão padrão "Tentar novamente",
 * ou passe um `action` customizado.
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Algo deu errado",
  description,
  retryLabel = "Tentar novamente",
  onRetry,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-danger/40 bg-danger/5 px-6 py-12 text-center"
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/10 text-danger">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-xs text-muted">{description}</p>}
      {action ? (
        <div className="mt-2">{action}</div>
      ) : (
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RotateCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )
      )}
    </div>
  );
}
