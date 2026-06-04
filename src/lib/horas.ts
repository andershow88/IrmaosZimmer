// Fonte única de formatação de horas (OS, relatórios, avisos). Não duplicar.
// Puro e client-safe: NÃO usar "server-only" aqui.

/**
 * Formata uma duração em minutos para pt-BR amigável.
 * Ex.: 150 -> "2h 30min", 120 -> "2h", 45 -> "45min".
 * Retorna "—" para 0, valores negativos, null/undefined ou não-numéricos.
 */
export function formatDuracao(min: number | null | undefined): string {
  if (min == null || !Number.isFinite(min) || min <= 0) return "—";
  const total = Math.round(min);
  const horas = Math.floor(total / 60);
  const minutos = total % 60;
  if (horas > 0 && minutos > 0) return `${horas}h ${minutos}min`;
  if (horas > 0) return `${horas}h`;
  return `${minutos}min`;
}

/**
 * Converte minutos em horas decimais com 1 casa.
 * Ex.: 150 -> 2.5, 45 -> 0.8. Retorna 0 para null/undefined/não-numérico.
 */
export function minutosParaHoras(min: number | null | undefined): number {
  if (min == null || !Number.isFinite(min)) return 0;
  return Math.round((min / 60) * 10) / 10;
}
