"use client";

import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/utils";
import type { MargemMensal } from "@/server/relatorios";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "./chart-theme";

function compactBRL(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatBRL(value);
}

const NOMES: Record<string, string> = {
  receita: "Receita",
  custo: "Custo de peças",
  margem: "Margem",
};

/** Receita vs. custo de peças (barras) com a margem sobreposta (linha). */
export function MargemChart({ data }: { data: MargemMensal[] }) {
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
        <Bar dataKey="receita" name="receita" fill={CHART_COLORS.accent} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="custo" name="custo" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Line
          type="monotone"
          dataKey="margem"
          name="margem"
          stroke={CHART_COLORS.success}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
