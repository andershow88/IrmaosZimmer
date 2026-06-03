"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIA_OPTIONS } from "./categorias";

export function ServicoFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const categoria = searchParams.get("categoria") ?? "";
  const ativo = searchParams.get("ativo") ?? "";

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Debounce da busca por nome.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => apply({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_180px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome..."
          className="pl-9"
          aria-label="Buscar serviço por nome"
        />
      </div>

      <Select
        value={categoria}
        onChange={(e) => apply({ categoria: e.target.value })}
        aria-label="Filtrar por categoria"
      >
        <option value="">Todas as categorias</option>
        {CATEGORIA_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Select
        value={ativo}
        onChange={(e) => apply({ ativo: e.target.value })}
        aria-label="Filtrar por situação"
      >
        <option value="">Ativos e inativos</option>
        <option value="true">Somente ativos</option>
        <option value="false">Somente inativos</option>
      </Select>
    </div>
  );
}
