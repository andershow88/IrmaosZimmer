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
import type { ComissaoMecanico } from "@/server/relatorios";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "./chart-theme";

function truncar(s: string, max = 22): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function compactBRL(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatBRL(value);
}

/** Comissão (R$) por mecânico — barras horizontais. */
export function ComissaoChart({ data }: { data: ComissaoMecanico[] }) {
  const chartData = data.map((d) => ({
    nome: truncar(d.nome),
    nomeCompleto: d.nome,
    comissao: d.comissao,
    faturamento: d.faturamento,
    comissaoPercent: d.comissaoPercent,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
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
          tickFormatter={compactBRL}
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
            const p = item?.payload as
              | { faturamento?: number; comissaoPercent?: number }
              | undefined;
            return [
              `${formatBRL(Number(value) || 0)} (${formatNumber(
                p?.comissaoPercent ?? 0,
                2
              )}% de ${formatBRL(p?.faturamento ?? 0)})`,
              "Comissão",
            ];
          }}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as { nomeCompleto?: string } | undefined)
              ?.nomeCompleto ?? ""
          }
        />
        <Bar
          dataKey="comissao"
          name="Comissão"
          fill={CHART_COLORS.success}
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
