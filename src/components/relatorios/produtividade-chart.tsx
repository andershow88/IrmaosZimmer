"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { ProdutividadeMecanico } from "@/server/relatorios";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "./chart-theme";

function truncar(s: string, max = 16): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function ProdutividadeChart({ data }: { data: ProdutividadeMecanico[] }) {
  const chartData = data.map((d) => ({
    nome: truncar(d.nome),
    nomeCompleto: d.nome,
    ordens: d.ordens,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="nome" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [formatNumber(Number(value) || 0), "Ordens"]}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as { nomeCompleto?: string } | undefined)
              ?.nomeCompleto ?? ""
          }
        />
        <Bar
          dataKey="ordens"
          name="Ordens"
          fill={CHART_COLORS.accentLight}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
