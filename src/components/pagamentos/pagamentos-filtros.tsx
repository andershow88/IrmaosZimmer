"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { STATUS_OPTIONS, FORMA_OPTIONS } from "./constants";

export function PagamentosFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Buscar por OS ou cliente…"
          className="pl-9"
        />
      </div>

      <Select
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        {STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        defaultValue={params.get("forma") ?? ""}
        onChange={(e) => setParam("forma", e.target.value)}
        aria-label="Filtrar por forma de pagamento"
      >
        <option value="">Todas as formas</option>
        {FORMA_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </div>
  );
}
