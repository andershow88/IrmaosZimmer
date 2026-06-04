"use client";

import { useRouter } from "next/navigation";
import type { StatusAgendamento } from "@prisma/client";
import { resolveStatus, type StatusKind } from "@/components/ui/status-badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos (dados já calculados em America/Sao_Paulo no servidor)
// ---------------------------------------------------------------------------

/** Bloco de um agendamento já posicionado por minutos do dia. */
export type BlocoAgendamento = {
  id: string;
  /** Minuto de início no dia (0..1439, em SP). */
  inicioMin: number;
  /** Duração em minutos. */
  duracaoMin: number;
  /** "HH:MM" de início (em SP). */
  horaLabel: string;
  status: StatusAgendamento;
  cliente: string;
  veiculo: string | null;
  servico: string | null;
  mecanico: string | null;
  box: string | null;
};

export type DiaCalendario = {
  /** "YYYY-MM-DD" (em SP). */
  data: string;
  /** "Seg" / "Ter" ... abreviação do dia. */
  diaSemanaLabel: string;
  /** "03/06" — dia/mês. */
  diaMesLabel: string;
  /** É o dia de hoje (em SP)? */
  hoje: boolean;
  blocos: BlocoAgendamento[];
};

export interface CalendarWeekProps {
  dias: DiaCalendario[];
  /** Minuto inicial da grade (ex.: 480 = 08:00). */
  gridStartMin: number;
  /** Minuto final da grade (ex.: 1080 = 18:00). */
  gridEndMin: number;
  /** Granularidade da grade (minutos por linha). */
  slotMin: number;
}

// Altura em pixels de cada slot (linha da grade).
const SLOT_PX = 56;

// ---------------------------------------------------------------------------
// Cores por status — REUTILIZA a paleta/variantes do StatusBadge.
// ---------------------------------------------------------------------------

const VARIANT_BLOCK: Record<BadgeVariant, string> = {
  accent: "border-accent/40 bg-accent-soft text-accent hover:bg-accent/20",
  success: "border-success/40 bg-success/10 text-success hover:bg-success/20",
  warning: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  danger: "border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  info: "border-info/40 bg-info/10 text-info hover:bg-info/20",
  outline: "border-border bg-surface-2 text-muted hover:bg-surface",
  default: "border-border bg-surface-2 text-foreground hover:bg-surface",
};

const KIND: StatusKind = "agendamento";

function blocoClasses(status: StatusAgendamento): string {
  const { variant } = resolveStatus(KIND, status);
  return VARIANT_BLOCK[variant];
}

function minutosParaHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CalendarWeek({
  dias,
  gridStartMin,
  gridEndMin,
  slotMin,
}: CalendarWeekProps) {
  const router = useRouter();
  const pxPorMin = SLOT_PX / slotMin;
  const totalMin = Math.max(slotMin, gridEndMin - gridStartMin);
  const alturaTotal = totalMin * pxPorMin;

  // Linhas de horário (régua à esquerda).
  const linhas: number[] = [];
  for (let t = gridStartMin; t <= gridEndMin; t += slotMin) linhas.push(t);

  const colTemplate = `4rem repeat(${dias.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-elevated shadow-sm">
      <div className="min-w-[640px]">
        {/* Cabeçalho dos dias (sticky no topo ao rolar horizontalmente) */}
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div className="sticky left-0 z-20 bg-bg-elevated" />
          {dias.map((d) => (
            <div
              key={d.data}
              className={cn(
                "border-l border-border px-2 py-2.5 text-center",
                d.hoje && "bg-accent-soft"
              )}
            >
              <div
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide",
                  d.hoje ? "text-accent" : "text-muted"
                )}
              >
                {d.diaSemanaLabel}
              </div>
              <div
                className={cn(
                  "text-sm font-bold",
                  d.hoje ? "text-accent" : "text-foreground"
                )}
              >
                {d.diaMesLabel}
              </div>
            </div>
          ))}
        </div>

        {/* Corpo: régua de horários + colunas dos dias */}
        <div
          className="grid"
          style={{ gridTemplateColumns: colTemplate }}
        >
          {/* Coluna de horários (sticky à esquerda) */}
          <div
            className="sticky left-0 z-10 bg-bg-elevated"
            style={{ height: alturaTotal }}
          >
            {linhas.slice(0, -1).map((t) => (
              <div
                key={t}
                className="relative border-t border-border/60"
                style={{ height: SLOT_PX }}
              >
                <span className="absolute -top-2 right-1.5 text-[11px] tabular-nums text-muted">
                  {minutosParaHHMM(t)}
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {dias.map((d) => (
            <div
              key={d.data}
              className={cn(
                "relative border-l border-border",
                d.hoje && "bg-accent-soft/40"
              )}
              style={{ height: alturaTotal }}
            >
              {/* Linhas de grade horizontais */}
              {linhas.slice(0, -1).map((t) => (
                <div
                  key={t}
                  className="border-t border-border/40"
                  style={{ height: SLOT_PX }}
                />
              ))}

              {/* Blocos de agendamento posicionados */}
              {d.blocos.map((b) => {
                const top = (b.inicioMin - gridStartMin) * pxPorMin;
                const altura = Math.max(22, b.duracaoMin * pxPorMin - 2);
                const compacto = altura < 52;
                return (
                  <button
                    key={b.id}
                    type="button"
                    title={`${b.horaLabel} · ${b.cliente}${b.servico ? ` · ${b.servico}` : ""}`}
                    onClick={() => router.push(`/painel/agenda/${b.id}`)}
                    className={cn(
                      "absolute inset-x-1 z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                      blocoClasses(b.status)
                    )}
                    style={{ top, height: altura }}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <span className="tabular-nums">{b.horaLabel}</span>
                      <span className="truncate">{b.cliente}</span>
                    </div>
                    {!compacto && (
                      <div className="mt-0.5 space-y-0.5 opacity-90">
                        {b.servico && <div className="truncate">{b.servico}</div>}
                        {(b.mecanico || b.box) && (
                          <div className="truncate">
                            {[b.mecanico, b.box].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {d.blocos.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-2 text-center text-[11px] text-subtle">
                  —
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
