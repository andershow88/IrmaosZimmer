"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const OPCOES = [
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
];

export function PeriodoSelect({ valor }: { valor: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("meses", e.target.value);
    startTransition(() => {
      router.push(`/painel/relatorios?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="periodo" className="mb-0 whitespace-nowrap text-xs text-muted">
        Período da receita
      </Label>
      <div className="w-44">
        <Select
          id="periodo"
          density="sm"
          value={String(valor)}
          onChange={handleChange}
          disabled={pending}
        >
          {OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
