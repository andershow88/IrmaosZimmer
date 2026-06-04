"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDuracao } from "@/lib/horas";
import { formatNumber } from "@/lib/utils";
import type {
  GargaloHoras,
  ProdutividadeHoras,
} from "@/server/relatorios";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "./chart-theme";

function truncar(s: string, max = 20): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Eixo em horas inteiras a partir dos minutos. */
function tickHoras(min: number): string {
  return `${Math.round(min / 60)}h`;
}

const NOMES: Record<string, string> = {
  disponiveis: "Disponíveis",
  executadas: "Executadas",
  vendidas: "Vendidas",
};

/**
 * Comparativo de horas disponíveis x executadas x vendidas por mecânico,
 * com leitura curta do gargalo (eficiência / ociosidade). Somente leitura.
 */
export function ProdutividadeHorasChart({
  data,
  gargalo,
}: {
  data: ProdutividadeHoras[];
  gargalo: GargaloHoras | null;
}) {
  const chartData = data.map((d) => ({
    nome: truncar(d.nome),
    nomeCompleto: d.nome,
    disponiveis: d.disponiveis,
    executadas: d.executadas,
    vendidas: d.vendidas,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={Math.max(260, data.length * 56)}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridStroke}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickHoras}
          />
          <YAxis
            type="category"
            dataKey="nome"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => [
              formatDuracao(Number(value) || 0),
              NOMES[String(name)] ?? String(name),
            ]}
            labelFormatter={(_label, payload) =>
              (payload?.[0]?.payload as { nomeCompleto?: string } | undefined)
                ?.nomeCompleto ?? ""
            }
          />
          <Legend
            formatter={(value) => NOMES[String(value)] ?? String(value)}
            wrapperStyle={{ fontSize: "0.75rem" }}
          />
          <Bar
            dataKey="disponiveis"
            name="disponiveis"
            fill={CHART_COLORS.muted}
            radius={[0, 4, 4, 0]}
            maxBarSize={16}
          />
          <Bar
            dataKey="executadas"
            name="executadas"
            fill={CHART_COLORS.accent}
            radius={[0, 4, 4, 0]}
            maxBarSize={16}
          />
          <Bar
            dataKey="vendidas"
            name="vendidas"
            fill={CHART_COLORS.info}
            radius={[0, 4, 4, 0]}
            maxBarSize={16}
          />
        </BarChart>
      </ResponsiveContainer>

      {gargalo && (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metrica
              label="Disponíveis"
              valor={formatDuracao(gargalo.totalDisponiveis)}
            />
            <Metrica
              label="Executadas"
              valor={formatDuracao(gargalo.totalExecutadas)}
            />
            <Metrica
              label="Vendidas"
              valor={formatDuracao(gargalo.totalVendidas)}
            />
            <Metrica
              label="Eficiência / Ociosidade"
              valor={`${formatNumber(gargalo.eficiencia * 100, 0)}% / ${formatNumber(
                gargalo.ociosidade * 100,
                0
              )}%`}
            />
          </div>
          <p className="mt-3 text-sm text-foreground">
            <span className="font-semibold text-accent">Gargalo: </span>
            {gargalo.diagnostico}
          </p>
        </div>
      )}
    </div>
  );
}

function Metrica({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-foreground">{valor}</p>
    </div>
  );
}
