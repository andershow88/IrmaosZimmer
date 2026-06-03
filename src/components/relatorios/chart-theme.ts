/**
 * Paleta e estilos compartilhados pelos gráficos (recharts).
 * Cores fixas em hex para renderização confiável de SVG nos dois temas.
 */

export const CHART_COLORS = {
  accent: "#1B4D89",
  accentLight: "#3B82C4",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0ea5e9",
  muted: "#94a3b8",
} as const;

/** Sequência de cores para séries categóricas (pizza, ranking). */
export const CHART_PALETTE: string[] = [
  "#1B4D89",
  "#3B82C4",
  "#0ea5e9",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#64748b",
];

export function colorAt(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Estilo padrão do tooltip do recharts adequado ao tema. */
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    color: "var(--foreground)",
    fontSize: "0.8125rem",
  },
  labelStyle: { color: "var(--muted)", fontWeight: 600 },
  itemStyle: { color: "var(--foreground)" },
  cursor: { fill: "var(--surface)", opacity: 0.4 },
} as const;

export const axisTick = { fill: "var(--muted)", fontSize: 12 } as const;
export const gridStroke = "var(--border)";
