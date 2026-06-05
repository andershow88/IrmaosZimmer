"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";

/**
 * Filtro simples da lista do mecânico: busca (debounce) + alternar a exibição
 * das OS finalizadas. Tudo via URL para manter o Server Component da lista.
 */
export function OficinaFiltro({
  q,
  incluirFinalizadas,
}: {
  q: string;
  incluirFinalizadas: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <SearchInput
          value={q}
          onChange={(v) => setParam("q", v.trim())}
          debounce={300}
          placeholder="Buscar veículo, placa, cliente ou nº…"
          aria-label="Buscar ordens de serviço"
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={incluirFinalizadas}
          onChange={(e) => setParam("finalizadas", e.target.checked ? "1" : "")}
          className="h-5 w-5 rounded border-border accent-[var(--accent)]"
        />
        Mostrar finalizadas
      </label>
    </div>
  );
}
