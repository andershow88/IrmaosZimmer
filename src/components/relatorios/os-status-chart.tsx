"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/utils";
import type { StatusDistribuicao } from "@/server/relatorios";
import { colorAt, tooltipStyle } from "./chart-theme";

export function OsStatusChart({ data }: { data: StatusDistribuicao[] }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={2}
              stroke="var(--bg-elevated)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.status} fill={colorAt(index)} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [
                formatNumber(Number(value) || 0),
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid w-full grid-cols-1 gap-1.5 sm:w-1/2">
        {data.map((entry, index) => (
          <li
            key={entry.status}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex items-center gap-2 truncate text-muted">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorAt(index) }}
              />
              <span className="truncate">{entry.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {formatNumber(entry.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
