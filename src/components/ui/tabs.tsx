"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Contexto
   ============================================================ */

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Componentes de Tabs devem ficar dentro de <Tabs>.");
  return ctx;
}

/* ============================================================
   Tabs (raiz) — controlado ou não-controlado
   ============================================================ */

export interface TabsProps {
  /** Valor controlado da aba ativa. */
  value?: string;
  /** Valor inicial (modo não-controlado). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Conjunto de abas acessível (`role=tablist/tab/tabpanel`, setas, aria-selected).
 * Use controlado (`value` + `onValueChange`) para sincronizar com a URL.
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const baseId = useId();
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  function setValue(v: string) {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  }

  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ============================================================
   TabsList + TabsTrigger
   ============================================================ */

export function TabsList({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Navegação por setas entre as abas habilitadas.
  function onKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        "[role='tab']:not([disabled])"
      ) ?? []
    );
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    e.preventDefault();
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-surface/60 p-1 scrollbar-thin",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  disabled,
  className,
}: {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { value: active, setValue, baseId } = useTabs();
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "bg-bg-elevated text-foreground shadow-sm"
          : "text-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ============================================================
   TabsContent
   ============================================================ */

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: active, baseId } = useTabs();
  if (active !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl", className)}
    >
      {children}
    </div>
  );
}
