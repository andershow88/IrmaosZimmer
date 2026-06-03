"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/utils";
import type { FluxoCaixaMensal } from "@/server/financeiro";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "@/components/relatorios/chart-theme";

function compactBRL(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatBRL(value);
}

const NOMES: Record<string, string> = {
  entradas: "Entradas",
  saidas: "Saídas",
  saldo: "Saldo",
};

/** Entradas vs. saídas (barras) com saldo do mês (linha). */
export function FluxoChart({ data }: { data: FluxoCaixaMensal[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="periodo" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={compactBRL}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [
            formatBRL(Number(value) || 0),
            NOMES[String(name)] ?? String(name),
          ]}
        />
        <Legend
          formatter={(value) => NOMES[String(value)] ?? String(value)}
          wrapperStyle={{ fontSize: "0.75rem" }}
        />
        <Bar dataKey="entradas" name="entradas" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="saidas" name="saidas" fill={CHART_COLORS.danger} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Line
          type="monotone"
          dataKey="saldo"
          name="saldo"
          stroke={CHART_COLORS.accent}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
