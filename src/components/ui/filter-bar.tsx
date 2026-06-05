"use client";

import { type ReactNode } from "react";
import { FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  children: ReactNode;
  /** Quando há filtros ativos, exibe o botão "Limpar filtros". */
  onClear?: () => void;
  /** Número de filtros ativos (controla a visibilidade do botão limpar e o contador). */
  activeCount?: number;
  /** Contagem de resultados, exibida à direita (ex.: 12 resultados). */
  resultCount?: number;
  resultLabel?: (n: number) => string;
  clearLabel?: string;
  className?: string;
}

function defaultResultLabel(n: number) {
  return n === 1 ? "1 resultado" : `${n} resultados`;
}

/**
 * Contêiner de filtros com botão "Limpar filtros" e contagem de resultados.
 * Coloque dentro `SearchInput`, `Select`, `Tabs`, etc.
 */
export function FilterBar({
  children,
  onClear,
  activeCount = 0,
  resultCount,
  resultLabel = defaultResultLabel,
  clearLabel = "Limpar filtros",
  className,
}: FilterBarProps) {
  const showClear = onClear && activeCount > 0;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-bg-elevated p-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {children}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {typeof resultCount === "number" && (
          <span className="text-xs text-muted" aria-live="polite">
            {resultLabel(resultCount)}
          </span>
        )}
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
            {clearLabel}
            {activeCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent-soft px-1 text-[10px] font-bold text-accent">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
