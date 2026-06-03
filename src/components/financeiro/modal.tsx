"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/** Modal simples reutilizável (overlay + cartão). */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
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
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-bg-elevated p-5 shadow-xl animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
