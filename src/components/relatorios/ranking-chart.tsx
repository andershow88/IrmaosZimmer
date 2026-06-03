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
import { formatBRL, formatNumber } from "@/lib/utils";
import type { RankingItem } from "@/server/relatorios";
import { axisTick, gridStroke, tooltipStyle } from "./chart-theme";

function truncar(s: string, max = 22): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function RankingChart({
  data,
  color,
  unidadeLabel = "Quantidade",
}: {
  data: RankingItem[];
  color: string;
  unidadeLabel?: string;
}) {
  const chartData = data.map((d) => ({
    nome: truncar(d.nome),
    nomeCompleto: d.nome,
    quantidade: d.quantidade,
    valor: d.valor,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
        <XAxis
          type="number"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, _name, item) => {
            const valor = (item?.payload as { valor?: number } | undefined)?.valor;
            return [
              `${formatNumber(Number(value) || 0)} • ${formatBRL(valor ?? 0)}`,
              unidadeLabel,
            ];
          }}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as { nomeCompleto?: string } | undefined)
              ?.nomeCompleto ?? ""
          }
        />
        <Bar
          dataKey="quantidade"
          name={unidadeLabel}
          fill={color}
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
