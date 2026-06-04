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
 * Barra de controle da agenda: alterna Calendário | Lista, Semana | Dia e
 * navega entre períodos (anterior / Hoje / próximo). Tudo via querystring,
 * preservando os filtros existentes (status, mecânico, busca).
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
      <div className="inline-flex rounded-xl border border-border bg-surface p-0.5">
        <SegButton
          active={modo === "calendario"}
          onClick={() => go({ modo: null })}
          icon={CalendarRange}
          label="Calendário"
        />
        <SegButton
          active={modo === "lista"}
          onClick={() => go({ modo: "lista" })}
          icon={List}
          label="Lista"
        />
      </div>

      {modo === "calendario" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Navegação de período */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Período anterior"
              onClick={() => go({ ref: refAnterior })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go({ ref: null })}
              disabled={isHoje}
              className={cn(
                "h-9 rounded-lg border border-border px-3 text-sm font-semibold transition",
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface-2"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-1 min-w-0 text-sm font-semibold capitalize text-foreground">
              {periodoLabel}
            </span>
          </div>

          {/* Visão: Semana | Dia */}
          <div className="inline-flex rounded-xl border border-border bg-surface p-0.5">
            <SegButton
              active={view === "semana"}
              onClick={() => go({ view: null })}
              icon={CalendarDays}
              label="Semana"
            />
            <SegButton
              active={view === "dia"}
              onClick={() => go({ view: "dia" })}
              icon={Calendar}
              label="Dia"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SegButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
        active
          ? "bg-accent text-white shadow-sm"
          : "text-muted hover:bg-surface-2 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
