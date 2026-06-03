"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { OrcamentoComparativo } from "@/server/relatorios";
import { CHART_COLORS, axisTick, gridStroke, tooltipStyle } from "./chart-theme";

export function OrcamentosChart({ data }: { data: OrcamentoComparativo }) {
  const total = data.aprovados + data.rejeitados;
  const taxa = total > 0 ? Math.round((data.aprovados / total) * 100) : 0;

  const chartData = [
    { nome: "Aprovados", total: data.aprovados, cor: CHART_COLORS.success },
    { nome: "Rejeitados", total: data.rejeitados, cor: CHART_COLORS.danger },
  ];

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Taxa de aprovação:{" "}
        <span className="font-semibold text-foreground">{taxa}%</span>{" "}
        <span className="text-xs">
          ({formatNumber(data.aprovados)} de {formatNumber(total)})
        </span>
      </p>
      <ResponsiveContainer width="100%" height={220}>
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
            formatter={(value) => [formatNumber(Number(value) || 0), "Orçamentos"]}
          />
          <Bar dataKey="total" name="Orçamentos" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {chartData.map((entry) => (
              <Cell key={entry.nome} fill={entry.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
