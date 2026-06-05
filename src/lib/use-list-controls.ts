"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface ListControls {
  /** Termo de busca atual (espelha o `?q=` da URL). */
  query: string;
  /** Atualiza a busca, persistindo em `?q=` e voltando para a 1ª página. */
  onQueryChange: (next: string) => void;
  /** Página atual (base 1) da paginação no cliente. */
  page: number;
  setPage: (page: number) => void;
  /** Itens por página. */
  pageSize: number;
  /** true enquanto a navegação RSC (refetch do servidor) está pendente. */
  pending: boolean;
}

/**
 * Controles de lista reutilizáveis para tabelas com busca + paginação:
 * - a busca é persistida na URL (`?q=`) via `router.replace`, restaurando
 *   bookmark/refresh/compartilhamento (sem poluir o histórico).
 * - a página é mantida no cliente e reiniciada ao mudar a busca.
 *
 * O `initialQuery` deve vir do servidor (searchParams já lidos), garantindo SSR
 * coerente com a URL.
 */
export function useListControls(
  initialQuery: string,
  pageSize = 20
): ListControls {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const onQueryChange = useCallback(
    (next: string) => {
      setQuery(next);
      setPage(1);
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return { query, onQueryChange, page, setPage, pageSize, pending };
}
