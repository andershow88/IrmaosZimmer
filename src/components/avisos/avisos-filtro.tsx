"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ContagemAvisos } from "@/server/avisos";

type Filtro = "TODOS" | "ANIVERSARIO" | "REVISAO";

const TABS: { value: Filtro; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ANIVERSARIO", label: "Aniversários" },
  { value: "REVISAO", label: "Revisões" },
];

export function AvisosFiltro({
  ativo,
  contagem,
}: {
  ativo: Filtro;
  contagem: ContagemAvisos;
}) {
  function contar(value: Filtro): number {
    if (value === "TODOS") return contagem.total;
    return contagem[value];
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = ativo === tab.value;
        const href =
          tab.value === "TODOS"
            ? "/painel/avisos"
            : `/painel/avisos?tipo=${tab.value}`;
        return (
          <Link
            key={tab.value}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
              active
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                active ? "bg-accent text-white" : "bg-surface-2 text-foreground"
              )}
            >
              {contar(tab.value)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
