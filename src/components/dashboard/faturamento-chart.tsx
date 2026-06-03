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

export type FaturamentoChartPoint = {
  mes: string;
  total: number;
};

/** Formata valores curtos para o eixo Y (ex.: "R$ 12k"). */
function formatEixo(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${value}`;
}

export function FaturamentoChart({ data }: { data: FaturamentoChartPoint[] }) {
  const vazio = data.every((d) => d.total === 0);

  if (vazio) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Sem faturamento registrado no período.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
            formatter={(value) => [formatBRL(Number(value) || 0), "Faturamento"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-elevated)",
              fontSize: 12,
              color: "var(--color-foreground)",
            }}
            labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
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
  );
}
