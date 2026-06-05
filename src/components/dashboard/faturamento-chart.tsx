"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type FaturamentoChartPoint = {
  mes: string;
  total: number;
};

export type FaturamentoPeriodos = {
  "3": FaturamentoChartPoint[];
  "6": FaturamentoChartPoint[];
  "12": FaturamentoChartPoint[];
};

type PeriodoKey = keyof FaturamentoPeriodos;

const PERIODOS: { key: PeriodoKey; label: string }[] = [
  { key: "3", label: "3 meses" },
  { key: "6", label: "6 meses" },
  { key: "12", label: "12 meses" },
];

/** Formata valores curtos para o eixo Y (ex.: "R$ 12k"). */
function formatEixo(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${value}`;
}

/**
 * Gráfico de faturamento com seletor de período (3/6/12 meses).
 * Aceita os três conjuntos pré-calculados no servidor; alterna sem refetch.
 * Mantém estado "sem dados" intencional com EmptyState.
 */
export function FaturamentoChart({
  periodos,
  defaultPeriodo = "6",
}: {
  periodos: FaturamentoPeriodos;
  defaultPeriodo?: PeriodoKey;
}) {
  const [periodo, setPeriodo] = useState<PeriodoKey>(defaultPeriodo);
  const data = periodos[periodo];

  const { vazio, totalPeriodo, variacao } = useMemo(() => {
    const vazio = data.every((d) => d.total === 0);
    const total = data.reduce((acc, d) => acc + d.total, 0);
    // Variação do último mês vs penúltimo (MoM).
    let variacao: number | null = null;
    if (data.length >= 2) {
      const ult = data[data.length - 1].total;
      const pen = data[data.length - 2].total;
      if (pen > 0) variacao = ((ult - pen) / pen) * 100;
    }
    return { vazio, totalPeriodo: total, variacao };
  }, [data]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatBRL(totalPeriodo)}
          </p>
          <p className="text-xs text-muted">
            Total no período
            {variacao != null && (
              <span
                className={cn(
                  "ml-1 font-medium",
                  variacao >= 0 ? "text-success" : "text-danger"
                )}
              >
                {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(0)}% MoM
              </span>
            )}
          </p>
        </div>
        <div
          role="group"
          aria-label="Selecionar período"
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriodo(p.key)}
              aria-pressed={periodo === p.key}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                periodo === p.key
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {vazio ? (
        <div className="py-4">
          <EmptyState
            icon={BarChart3}
            title="Sem faturamento no período"
            message="Os pagamentos recebidos aparecerão aqui assim que houver registros."
          />
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                tickFormatter={formatEixo}
                tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface)", opacity: 0.5 }}
                formatter={(value) => [
                  formatBRL(Number(value) || 0),
                  "Faturamento",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-elevated)",
                  fontSize: 12,
                  color: "var(--color-foreground)",
                }}
                labelStyle={{
                  color: "var(--color-foreground)",
                  fontWeight: 600,
                }}
              />
              <Bar
                dataKey="total"
                fill="var(--color-accent)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
