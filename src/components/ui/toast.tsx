"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  Info,
  TriangleAlert,
  XCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Tipos
   ============================================================ */

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Tempo até o auto-fechamento, em ms. Use `0` para não fechar sozinho. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "title">> {
  id: string;
  description?: ReactNode;
  variant: ToastVariant;
  duration: number;
}

const DEFAULT_DURATION = 5000;

const VARIANT_META: Record<
  ToastVariant,
  { icon: LucideIcon; iconClass: string; barClass: string }
> = {
  success: { icon: CheckCircle2, iconClass: "text-success", barClass: "bg-success" },
  error: { icon: XCircle, iconClass: "text-danger", barClass: "bg-danger" },
  warning: { icon: TriangleAlert, iconClass: "text-warning", barClass: "bg-warning" },
  info: { icon: Info, iconClass: "text-info", barClass: "bg-info" },
};

/* ============================================================
   Bridge: permite chamar toast() fora de componentes React
   ============================================================ */

type Emit = (toast: ToastOptions) => void;
let emit: Emit | null = null;
const queue: ToastOptions[] = [];

/**
 * Dispara um toast. Pode ser chamado de qualquer lugar (handlers, server-action
 * results, etc.). Requer que `<Toaster />` esteja montado em algum ponto da árvore.
 */
export function toast(options: ToastOptions) {
  if (emit) emit(options);
  else queue.push(options); // antes do mount: enfileira e processa quando o Toaster montar
}

/* ============================================================
   Contexto / hook
   ============================================================ */

interface ToastContextValue {
  toast: Emit;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Hook para disparar toasts dentro de componentes React. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: funciona mesmo se o componente não estiver sob o Provider,
    // contanto que <Toaster /> esteja montado em algum lugar.
    return { toast, dismiss: () => {} };
  }
  return ctx;
}

/* ============================================================
   Toaster (Provider + render dos toasts)
   ============================================================ */

let counter = 0;

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<Emit>((options) => {
    const item: ToastItem = {
      id: `toast-${++counter}`,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "info",
      duration: options.duration ?? DEFAULT_DURATION,
    };
    setToasts((prev) => [...prev, item]);
  }, []);

  // Registra a ponte global e drena a fila pré-mount.
  useEffect(() => {
    emit = push;
    if (queue.length) {
      queue.splice(0).forEach((opt) => push(opt));
    }
    return () => {
      if (emit === push) emit = null;
    };
  }, [push]);

  const value = useMemo<ToastContextValue>(
    () => ({ toast: push, dismiss }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ============================================================
   Viewport + Toast individual
   ============================================================ */

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      // region: anúncios não-urgentes; erros usam aria-live="assertive" no item.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4 safe-bottom sm:max-w-sm sm:left-auto"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast: t,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const meta = VARIANT_META[t.variant];
  const Icon = meta.icon;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (t.duration <= 0) return;
    clear();
    timer.current = setTimeout(() => onDismiss(t.id), t.duration);
  }, [t.duration, t.id, onDismiss, clear]);

  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  const isError = t.variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={clear}
      onMouseLeave={start}
      onFocus={clear}
      onBlur={start}
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-border bg-bg-elevated p-4 pr-10 shadow-xl",
        "animate-fade-in motion-reduce:animate-none"
      )}
    >
      <span className={cn("mt-0.5 shrink-0", meta.iconClass)} aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs text-muted break-words">{t.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Fechar notificação"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
      <span
        className={cn("absolute inset-x-0 bottom-0 h-0.5 opacity-70", meta.barClass)}
        aria-hidden="true"
      />
    </div>
  );
}
