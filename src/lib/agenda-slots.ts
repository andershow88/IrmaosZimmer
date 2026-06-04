// Fonte única da geração de horários da agenda.
// Puro e client-safe: NÃO usar "server-only", prisma ou next/* aqui — este
// módulo é compartilhado entre o painel interno e o site público.

/**
 * Converte um horário "HH:MM" em minutos desde a meia-noite.
 * Ex.: "08:30" -> 510. Retorna NaN para entradas inválidas.
 */
export function horaParaMinutos(hora: string): number {
  if (typeof hora !== "string") return Number.NaN;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!m) return Number.NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return Number.NaN;
  return h * 60 + min;
}

/**
 * Converte minutos desde a meia-noite em "HH:MM" (com zero à esquerda).
 * Ex.: 510 -> "08:30".
 */
export function minutosParaHora(minutos: number): string {
  const total = Math.max(0, Math.floor(minutos));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Gera a lista de horários ("HH:MM") de um expediente, a cada `slotMin`
 * minutos, começando em `abre` e parando antes de `fecha`. Se houver pausa
 * (almoço), os horários que caem dentro do intervalo [pausaInicio, pausaFim)
 * são excluídos.
 *
 * Fonte única — usada tanto pela disponibilidade do servidor quanto pelo front.
 *
 * @returns lista ordenada de horários; vazia se os parâmetros forem inválidos.
 */
export function gerarHorarios(
  abre: string,
  fecha: string,
  slotMin: number,
  pausaInicio?: string | null,
  pausaFim?: string | null,
): string[] {
  const inicio = horaParaMinutos(abre);
  const fim = horaParaMinutos(fecha);
  if (
    Number.isNaN(inicio) ||
    Number.isNaN(fim) ||
    !Number.isFinite(slotMin) ||
    slotMin <= 0 ||
    fim <= inicio
  ) {
    return [];
  }

  // Janela de pausa (almoço) — só vale se ambos forem válidos e bem ordenados.
  const pInicio = pausaInicio ? horaParaMinutos(pausaInicio) : Number.NaN;
  const pFim = pausaFim ? horaParaMinutos(pausaFim) : Number.NaN;
  const temPausa =
    !Number.isNaN(pInicio) && !Number.isNaN(pFim) && pFim > pInicio;

  const horarios: string[] = [];
  for (let t = inicio; t < fim; t += slotMin) {
    // Exclui horários que iniciam dentro da pausa de almoço.
    if (temPausa && t >= pInicio && t < pFim) continue;
    horarios.push(minutosParaHora(t));
  }
  return horarios;
}
