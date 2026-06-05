"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import type { StatusAgendamento } from "@prisma/client";

const STATUS_OPTIONS: { value: StatusAgendamento; label: string }[] = [
  { value: "AGENDADO", label: "Agendado" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "VEICULO_RECEBIDO", label: "Veículo recebido" },
  { value: "NAO_COMPARECEU", label: "Não compareceu" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "CONCLUIDO", label: "Concluído" },
];

export interface AgendaFiltrosProps {
  status: string;
  busca: string;
  /** Mecânico selecionado (id) ou "". */
  mecanicoId?: string;
  /** Lista de mecânicos ativos para o filtro. */
  mecanicos?: { id: string; name: string }[];
  /** Esconde o campo de busca textual (visão calendário não usa busca). */
  ocultarBusca?: boolean;
  /** Contagem de resultados, exibida à direita do FilterBar. */
  resultCount?: number;
}

export function AgendaFiltros({
  status,
  busca,
  mecanicoId = "",
  mecanicos = [],
  ocultarBusca = false,
  resultCount,
}: AgendaFiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [buscaLocal, setBuscaLocal] = useState(busca);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleBusca(next: string) {
    setBuscaLocal(next);
    setParam("q", next.trim());
  }

  function limpar() {
    setBuscaLocal("");
    const params = new URLSearchParams(searchParams.toString());
    // Limpa apenas os filtros; preserva modo/view/ref da navegação.
    params.delete("q");
    params.delete("status");
    params.delete("mecanico");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const activeCount =
    (status ? 1 : 0) +
    (mecanicoId ? 1 : 0) +
    (!ocultarBusca && busca ? 1 : 0);

  return (
    <FilterBar
      activeCount={activeCount}
      onClear={limpar}
      resultCount={resultCount}
    >
      {!ocultarBusca && (
        <SearchInput
          value={buscaLocal}
          onChange={handleBusca}
          debounce={300}
          placeholder="Buscar por cliente, veículo ou serviço…"
          aria-label="Buscar agendamentos"
          className="sm:w-72"
        />
      )}
      {mecanicos.length > 0 && (
        <div className="sm:w-56">
          <Select
            value={mecanicoId}
            onChange={(e) => setParam("mecanico", e.target.value)}
            aria-label="Filtrar por mecânico"
          >
            <option value="">Todos os mecânicos</option>
            {mecanicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="sm:w-56">
        <Select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </FilterBar>
  );
}
