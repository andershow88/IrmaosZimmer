"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const STATUS_OPTS: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "ABERTA", label: "Aberta" },
  { value: "AGUARDANDO_DIAGNOSTICO", label: "Aguardando diagnóstico" },
  { value: "AGUARDANDO_APROVACAO", label: "Aguardando aprovação" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "EM_EXECUCAO", label: "Em execução" },
  { value: "AGUARDANDO_PECAS", label: "Aguardando peças" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADA", label: "Cancelada" },
];

const PRIORIDADE_OPTS: { value: string; label: string }[] = [
  { value: "", label: "Todas as prioridades" },
  { value: "BAIXA", label: "Baixa" },
  { value: "NORMAL", label: "Normal" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

export function OSFilters({
  status,
  prioridade,
  q,
}: {
  status: string;
  prioridade: string;
  q: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          defaultValue={q}
          placeholder="Buscar por número, cliente ou placa…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value.trim());
            }
          }}
          onBlur={(e) => setParam("q", e.target.value.trim())}
        />
      </div>
      <div className="w-full sm:w-56">
        <Select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-full sm:w-52">
        <Select
          value={prioridade}
          onChange={(e) => setParam("prioridade", e.target.value)}
        >
          {PRIORIDADE_OPTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
