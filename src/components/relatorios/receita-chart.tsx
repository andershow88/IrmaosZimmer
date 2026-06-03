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
import { formatBRL } from "@/lib/utils";
import type { ReceitaMensal } from "@/server/relatorios";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "./chart-theme";

function compactBRL(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatBRL(value);
}

export function ReceitaChart({ data }: { data: ReceitaMensal[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
          formatter={(value) => [formatBRL(Number(value) || 0), "Receita"]}
        />
        <Bar
          dataKey="valor"
          name="Receita"
          fill={CHART_COLORS.accent}
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
