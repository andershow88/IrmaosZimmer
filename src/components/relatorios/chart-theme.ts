/**
 * Paleta e estilos compartilhados pelos gráficos (recharts).
 * Cores fixas em hex para renderização confiável de SVG nos dois temas.
 */

export const CHART_COLORS = {
  accent: "#00a651",
  accentLight: "#7cb518",
  success: "#16a34a",
  warning: "#ea8c00",
  danger: "#dc2626",
  info: "#0284c7",
  muted: "#64748b",
} as const;

/**
 * Sequência de cores para séries categóricas (pizza, ranking).
 * Verde da marca como cor primária; demais tons escolhidos com
 * saturação/luminosidade suficientes p/ contraste e distinção tanto
 * sobre fundo claro (#f4f6f9) quanto escuro (#0e0f11).
 */
export const CHART_PALETTE: string[] = [
  "#00a651", // verde marca (primária)
  "#7cb518", // verde-limão (mais escuro que o antigo #8cc63f p/ contraste claro)
  "#0284c7", // azul (mais escuro que #0ea5e9)
  "#ea8c00", // âmbar (mais escuro p/ contraste claro)
  "#dc2626", // vermelho
  "#7c3aed", // roxo (mais escuro e saturado que #8b5cf6)
  "#0d9488", // teal (mais escuro que #14b8a6 p/ contraste claro)
  "#db2777", // rosa (mais escuro que #ec4899)
  "#005c2e", // verde profundo
  "#475569", // ardósia (mais escuro que #64748b)
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
