"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
}

export function AgendaFiltros({ status, busca }: AgendaFiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="sm:w-72">
        <Input
          type="search"
          placeholder="Buscar por cliente, veículo ou serviço..."
          defaultValue={busca}
          onChange={(e) => setParam("q", e.target.value)}
        />
      </div>
      <div className="sm:w-56">
        <Select value={status} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
