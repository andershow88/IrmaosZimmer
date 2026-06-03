"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Modal genérico do módulo Assistente (formulário + resultado). */
export function ActionModal({
  open,
  title,
  description,
  icon: Icon,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  icon?: LucideIcon;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-xl animate-fade-in">
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          {Icon && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="pt-0.5">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
