"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CalendarRange,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AgendaModo = "calendario" | "lista";
export type CalendarView = "semana" | "dia";

export interface CalendarToggleProps {
  /** Modo atual: calendário ou lista. */
  modo: AgendaModo;
  /** Visão do calendário (só relevante no modo calendário). */
  view: CalendarView;
  /** Rótulo do período visível (ex.: "02 – 08 jun 2026" ou "ter., 03/06/2026"). */
  periodoLabel: string;
  /** Data de referência atual (YYYY-MM-DD em SP). */
  refData: string;
  /** Datas de navegação já calculadas no servidor (YYYY-MM-DD em SP). */
  refAnterior: string;
  refProximo: string;
  refHoje: string;
}

/**
 * Barra de controle da agenda: alterna Calendário | Lista, Semana | Dia (via
 * Tabs acessíveis) e navega entre períodos (anterior / Hoje / próximo). Tudo via
 * querystring, preservando os filtros existentes (status, mecânico, busca).
 */
export function CalendarToggle({
  modo,
  view,
  periodoLabel,
  refData,
  refAnterior,
  refProximo,
  refHoje,
}: CalendarToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(patch: Record<string, string | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function go(patch: Record<string, string | null>) {
    router.replace(buildUrl(patch));
  }

  const isHoje = refData === refHoje;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Modo: Calendário | Lista */}
      <Tabs
        value={modo}
        onValueChange={(v) => go({ modo: v === "calendario" ? null : v })}
      >
        <TabsList aria-label="Modo de visualização da agenda">
          <TabsTrigger value="calendario">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="lista">
            <List className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Lista</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {modo === "calendario" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Navegação de período */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Período anterior"
              onClick={() => go({ ref: refAnterior })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go({ ref: null })}
              disabled={isHoje}
              className={cn(
                "h-9 rounded-lg border border-border px-3 text-sm font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isHoje
                  ? "cursor-default bg-accent-soft text-accent"
                  : "bg-surface text-foreground hover:bg-surface-2"
              )}
            >
              Hoje
            </button>
            <button
              type="button"
              aria-label="Próximo período"
              onClick={() => go({ ref: refProximo })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="ml-1 min-w-0 text-sm font-semibold capitalize text-foreground">
              {periodoLabel}
            </span>
          </div>

          {/* Visão: Semana | Dia */}
          <Tabs
            value={view}
            onValueChange={(v) => go({ view: v === "semana" ? null : v })}
          >
            <TabsList aria-label="Período do calendário">
              <TabsTrigger value="semana">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Semana</span>
              </TabsTrigger>
              <TabsTrigger value="dia">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Dia</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
}
