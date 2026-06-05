"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** Página atual (base 1). */
  page: number;
  /** Total de registros. */
  total: number;
  /** Itens por página. */
  pageSize: number;
  onPage: (page: number) => void;
  className?: string;
  /** Exibe o resumo "Mostrando X–Y de Z" (padrão: true). */
  showSummary?: boolean;
}

/** Calcula a lista de páginas com reticências (1 … 4 5 6 … 20). */
function buildPages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

/**
 * Paginação acessível: `nav[aria-label]`, `aria-current="page"` na página ativa
 * e botões com `aria-label` descritivo. Não renderiza nada se houver 0 registros.
 */
export function Pagination({
  page,
  total,
  pageSize,
  onPage,
  className,
  showSummary = true,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const pages = buildPages(current, totalPages);

  const btnBase =
    "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className
      )}
    >
      {showSummary && (
        <p className="text-xs text-muted" aria-live="polite">
          Mostrando <span className="font-semibold text-foreground">{from}</span>–
          <span className="font-semibold text-foreground">{to}</span> de{" "}
          <span className="font-semibold text-foreground">{total}</span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
          className={cn(btnBase, "border border-border text-foreground hover:bg-surface")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              aria-hidden="true"
              className="grid h-9 min-w-9 place-items-center text-sm text-subtle"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Página ${p}`}
              aria-current={p === current ? "page" : undefined}
              onClick={() => onPage(p)}
              className={cn(
                btnBase,
                p === current
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "border border-border text-foreground hover:bg-surface"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Próxima página"
          disabled={current >= totalPages}
          onClick={() => onPage(current + 1)}
          className={cn(btnBase, "border border-border text-foreground hover:bg-surface")}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
