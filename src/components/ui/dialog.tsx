"use client";

import { useId, useRef, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /**
   * Confirmação descritiva: nome do registro afetado (ex.: "Cliente João Silva").
   * Exibido em destaque para reduzir confirmações por engano.
   */
  recordName?: ReactNode;
  /**
   * Consequência da ação: lista de itens que serão afetados/removidos em cascata
   * (ex.: ["3 veículos vinculados", "12 ordens de serviço"]).
   */
  consequenceItems?: ReactNode[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estilo do botão de confirmação. */
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  recordName,
  consequenceItems,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  // Focus trap + ESC + retorno de foco (não fecha por ESC enquanto carrega).
  useFocusTrap(cardRef, open, loading ? undefined : onCancel);

  if (!open) return null;

  const hasDescription = description || recordName || consequenceItems?.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        onClick={loading ? undefined : onCancel}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
      />
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasDescription ? descId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-5 shadow-xl outline-none animate-fade-in motion-reduce:animate-none"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              variant === "danger" ? "bg-danger/10 text-danger" : "bg-accent-soft text-accent"
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 pt-0.5 pr-6">
            <h2 id={titleId} className="text-base font-bold text-foreground">
              {title}
            </h2>
            {hasDescription && (
              <div id={descId} className="mt-1 space-y-2 text-sm text-muted">
                {description && <p>{description}</p>}
                {recordName && (
                  <p className="rounded-lg bg-surface px-3 py-2 text-sm font-semibold text-foreground">
                    {recordName}
                  </p>
                )}
                {consequenceItems && consequenceItems.length > 0 && (
                  <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                    <p className="text-xs font-semibold text-danger">
                      Isto também afetará:
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted">
                      {consequenceItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
