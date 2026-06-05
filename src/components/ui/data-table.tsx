"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { RowActions, type MenuItem } from "@/components/ui/dropdown-menu";

/* ============================================================
   Tipos
   ============================================================ */

export interface Column<T> {
  /** Chave única da coluna. */
  key: string;
  header: ReactNode;
  /** Render do valor da célula. */
  render: (row: T) => ReactNode;
  /** Habilita ordenação por clique no cabeçalho (controlada via `sort`/`onSort`). */
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Extrai a chave estável de cada linha. */
  rowKey: (row: T) => string | number;

  /** Estados de carregamento/erro. */
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;

  /** Estado vazio (usa EmptyState). */
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;

  /** Legenda invisível p/ leitores de tela (a11y). */
  caption?: string;

  /** Slot de toolbar (busca/filtros) acima da tabela. */
  toolbar?: ReactNode;

  /** Contagem de resultados (exibida na toolbar interna). Use `data.length` se omitido. */
  resultCount?: number;
  showCount?: boolean;

  /** Ordenação controlada. */
  sort?: SortState | null;
  onSort?: (sort: SortState) => void;

  /** Ações por linha (renderiza coluna com RowActions). */
  rowActions?: (row: T) => MenuItem[];

  /** Clique na linha inteira (cursor pointer + tecla Enter). */
  onRowClick?: (row: T) => void;

  /** Paginação opcional. */
  page?: number;
  pageSize?: number;
  total?: number;
  onPage?: (page: number) => void;

  /**
   * Fallback responsivo: render de cada linha como cartão no mobile.
   * Se omitido, a tabela apenas rola horizontalmente em telas pequenas.
   */
  mobileCard?: (row: T) => ReactNode;

  className?: string;
}

const SKELETON_ROWS = 5;

/* ============================================================
   DataTable
   ============================================================ */

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  error,
  onRetry,
  emptyTitle = "Nenhum registro encontrado",
  emptyMessage,
  emptyIcon,
  emptyAction,
  caption,
  toolbar,
  resultCount,
  showCount = true,
  sort,
  onSort,
  rowActions,
  onRowClick,
  page,
  pageSize,
  total,
  onPage,
  mobileCard,
  className,
}: DataTableProps<T>) {
  const captionId = useId();
  // Estado interno de ordenação caso o consumidor não controle.
  const [innerSort, setInnerSort] = useState<SortState | null>(null);
  const activeSort = sort !== undefined ? sort : innerSort;

  const count = resultCount ?? total ?? data.length;

  function toggleSort(key: string) {
    const next: SortState =
      activeSort?.key === key
        ? { key, dir: activeSort.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" };
    if (onSort) onSort(next);
    else setInnerSort(next);
  }

  const hasActions = !!rowActions;

  const alignClass = (a?: Column<T>["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  /* ---------------- Toolbar (busca/filtros + contagem) ---------------- */
  const renderedToolbar =
    toolbar || showCount ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">{toolbar}</div>
        {showCount && !loading && !error && (
          <span className="shrink-0 text-xs text-muted" aria-live="polite">
            {count === 1 ? "1 resultado" : `${count} resultados`}
          </span>
        )}
      </div>
    ) : null;

  /* ---------------- Corpo da tabela (desktop) ---------------- */
  const desktopTable = (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-border bg-bg-elevated scrollbar-thin",
        mobileCard && "hidden sm:block"
      )}
    >
      <table
        className="w-full border-collapse text-sm"
        aria-describedby={caption ? captionId : undefined}
        aria-busy={loading || undefined}
      >
        {caption && (
          <caption id={captionId} className="sr-only">
            {caption}
          </caption>
        )}
        <thead className="border-b border-border bg-surface/60 text-left">
          <tr>
            {columns.map((col) => {
              const isSorted = activeSort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable
                      ? isSorted
                        ? activeSort!.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted whitespace-nowrap",
                    alignClass(col.align),
                    col.className
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded transition hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        col.align === "right" && "flex-row-reverse"
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        activeSort!.dir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown
                          className="h-3.5 w-3.5 opacity-40"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
            {hasActions && (
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Ações</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading
            ? Array.from({ length: SKELETON_ROWS }).map((_, r) => (
                <tr key={`sk-${r}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </td>
                  )}
                </tr>
              ))
            : data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter") onRowClick(row);
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    "transition-colors hover:bg-surface/50",
                    onRowClick &&
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle text-foreground",
                        alignClass(col.align),
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end">
                        <RowActions items={rowActions(row)} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );

  /* ---------------- Cartões (mobile) ---------------- */
  const mobileList = mobileCard && (
    <div className="flex flex-col gap-3 sm:hidden" aria-busy={loading || undefined}>
      {loading
        ? Array.from({ length: SKELETON_ROWS }).map((_, r) => (
            <div
              key={`mc-${r}`}
              className="rounded-2xl border border-border bg-bg-elevated p-4"
            >
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-3 h-3 w-3/4" />
            </div>
          ))
        : data.map((row) => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "rounded-2xl border border-border bg-bg-elevated p-4",
                onRowClick && "cursor-pointer transition hover:bg-surface/40"
              )}
            >
              {mobileCard(row)}
              {hasActions && (
                <div
                  className="mt-2 flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActions items={rowActions(row)} />
                </div>
              )}
            </div>
          ))}
    </div>
  );

  /* ---------------- Render ---------------- */
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {renderedToolbar}

      {error ? (
        <ErrorState description={error} onRetry={onRetry} />
      ) : !loading && data.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
        />
      ) : (
        <>
          {desktopTable}
          {mobileList}
        </>
      )}

      {onPage &&
        typeof page === "number" &&
        typeof pageSize === "number" &&
        typeof total === "number" &&
        !loading &&
        !error && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={onPage}
          />
        )}
    </div>
  );
}
