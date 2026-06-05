"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Foco — utilidades compartilhadas (focus trap)
   ============================================================ */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Prende o foco dentro de `containerRef` enquanto `active`, fecha no `Escape`
 * e devolve o foco ao elemento anterior quando desativado.
 * Usado por Modal/Dialog/Drawer.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void
) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    previousFocus.current = document.activeElement as HTMLElement | null;

    // Foca o primeiro elemento focável (ou o próprio contêiner).
    const focusFirst = () => {
      if (!container) return;
      const focusable = getFocusable(container);
      (focusable[0] ?? container).focus();
    };
    // Aguarda um frame para o conteúdo montar antes de focar.
    const raf = requestAnimationFrame(focusFirst);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || activeEl === container) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      // Devolve o foco ao elemento que estava ativo antes de abrir.
      previousFocus.current?.focus?.();
    };
  }, [active, containerRef, onEscape]);
}

/** Bloqueia o scroll do body enquanto `active`. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}

/* ============================================================
   Modal
   ============================================================ */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Rodapé fixo (ações). */
  footer?: ReactNode;
  /** Largura máxima do cartão. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Permite fechar clicando no overlay (padrão: true). */
  closeOnOverlay?: boolean;
  /** Oculta o botão "X" do cabeçalho. */
  hideClose?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Modal acessível com focus trap, ESC, retorno de foco, overlay e
 * `aria-modal`/`aria-labelledby`. Base para diálogos e drawers.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  hideClose = false,
  className,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useFocusTrap(cardRef, open, onClose);
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={closeOnOverlay ? onClose : undefined}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex w-full max-h-[calc(100dvh-2rem)] flex-col rounded-2xl border border-border bg-bg-elevated shadow-xl outline-none animate-fade-in motion-reduce:animate-none",
          SIZE[size],
          className
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-bold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
