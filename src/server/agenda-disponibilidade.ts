import "server-only";

// ENGINE de disponibilidade da agenda — FONTE ÚNICA usada pelo painel interno
// e pelo endpoint público de agendamento. Toda a lógica de fuso horário roda em
// America/Sao_Paulo (o servidor pode estar em UTC).

import { prisma } from "@/lib/db";
import { gerarHorarios, horaParaMinutos } from "@/lib/agenda-slots";
import type {
  AgendaConfig,
  HorarioExpediente,
  DiaBloqueado,
} from "@prisma/client";

const TZ = "America/Sao_Paulo";

// ---------------------------------------------------------------------------
// Helpers de fuso horário (America/Sao_Paulo)
// ---------------------------------------------------------------------------

/**
 * Partes de data/hora de um `Date` no fuso de São Paulo.
 * Retorna ano/mês/dia/hora/minuto e o diaSemana (0=Dom..6=Sáb).
 */
function partesEmSP(d: Date): {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  diaSemana: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const semanaMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  let hora = Number(get("hour"));
  // Intl pode devolver "24" para meia-noite em alguns ambientes.
  if (hora === 24) hora = 0;
  return {
    ano: Number(get("year")),
    mes: Number(get("month")),
    dia: Number(get("day")),
    hora,
    minuto: Number(get("minute")),
    diaSemana: semanaMap[get("weekday")] ?? 0,
  };
}

/**
 * Constrói um `Date` (UTC) que corresponde a um instante de parede (wall clock)
 * em São Paulo: ano/mês/dia "HH:MM" locais. Calcula o offset do fuso na data
 * para evitar erros de DST e de servidor em UTC.
 */
function dateEmSP(
  ano: number,
  mes: number, // 1-12
  dia: number,
  hora: number,
  minuto: number,
): Date {
  // Primeira aproximação tratando os campos como se fossem UTC.
  const aprox = Date.UTC(ano, mes - 1, dia, hora, minuto, 0, 0);
  // Quanto esse instante "marca" no relógio de SP?
  const p = partesEmSP(new Date(aprox));
  const marcadoUTC = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, 0, 0);
  // O offset é a diferença entre o que queríamos e o que o relógio marcou.
  const offset = aprox - marcadoUTC;
  return new Date(aprox + offset);
}

/** "YYYY-MM-DD" (em SP) -> {ano, mes, dia}. Lança se o formato for inválido. */
function parseDataISO(dataISO: string): { ano: number; mes: number; dia: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO.trim());
  if (!m) throw new Error(`Data inválida (esperado YYYY-MM-DD): ${dataISO}`);
  return { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

/** Diferença em dias (calendário, em SP) entre duas datas dadas em partes. */
function diffDiasSP(
  a: { ano: number; mes: number; dia: number },
  b: { ano: number; mes: number; dia: number },
): number {
  const ua = Date.UTC(a.ano, a.mes - 1, a.dia);
  const ub = Date.UTC(b.ano, b.mes - 1, b.dia);
  return Math.round((ua - ub) / 86_400_000);
}

/**
 * Constrói o instante (Date/UTC) de um horário "HH:MM" numa data "YYYY-MM-DD",
 * interpretados como horário de parede em São Paulo. Útil para transformar a
 * data+hora escolhidas no formulário público no `dataHora` a gravar.
 * Retorna `null` se algum dos formatos for inválido.
 */
export function combinarDataHoraSP(dataISO: string, hora: string): Date | null {
  try {
    const { ano, mes, dia } = parseDataISO(dataISO);
    const min = horaParaMinutos(hora);
    if (Number.isNaN(min)) return null;
    return dateEmSP(ano, mes, dia, Math.floor(min / 60), min % 60);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Config + expediente + bloqueios
// ---------------------------------------------------------------------------

export type ConfigAgendaCompleta = {
  config: AgendaConfig;
  expediente: HorarioExpediente[];
  diasBloqueados: DiaBloqueado[];
};

/**
 * Retorna a configuração da agenda (cria com defaults se não existir),
 * o expediente dos 7 dias e os dias bloqueados.
 */
export async function getConfigAgenda(): Promise<ConfigAgendaCompleta> {
  let config = await prisma.agendaConfig.findFirst();
  if (!config) {
    config = await prisma.agendaConfig.create({ data: {} });
  }
  const [expediente, diasBloqueados] = await Promise.all([
    prisma.horarioExpediente.findMany({ orderBy: { diaSemana: "asc" } }),
    prisma.diaBloqueado.findMany({ orderBy: { data: "asc" } }),
  ]);
  return { config, expediente, diasBloqueados };
}

// ---------------------------------------------------------------------------
// Slots disponíveis (para uma data)
// ---------------------------------------------------------------------------

export type SlotDisponibilidade = {
  hora: string; // "HH:MM"
  disponivel: boolean;
  vagasRestantes: number;
};

/**
 * Lista os slots de um dia ("YYYY-MM-DD") com disponibilidade calculada.
 * Regras (tudo em America/Sao_Paulo):
 *  - Dia fechado (expediente.aberto=false) ou DiaBloqueado -> [].
 *  - Horários gerados via gerarHorarios (slot, abertura, fechamento, pausa).
 *  - vagasRestantes = capacidadePorSlot - nº de Appointments naquele instante
 *    (ignorando CANCELADO e NAO_COMPARECEU).
 *  - disponivel = vagas>0 E início >= agora + antecedenciaMinHoras
 *                 E data <= hoje + maxDiasAntecedencia.
 */
export async function getSlotsDisponiveis(
  dataISO: string,
): Promise<SlotDisponibilidade[]> {
  const { ano, mes, dia } = parseDataISO(dataISO);
  const { config, expediente, diasBloqueados } = await getConfigAgenda();

  // Dia da semana (0..6) da data solicitada, no fuso de SP.
  const diaSemana = partesEmSP(dateEmSP(ano, mes, dia, 12, 0)).diaSemana;
  const exped = expediente.find((e) => e.diaSemana === diaSemana);
  if (!exped || !exped.aberto) return [];

  // Dia bloqueado? (compara só a data, em SP)
  const bloqueado = diasBloqueados.some((b) => {
    const p = partesEmSP(b.data);
    return p.ano === ano && p.mes === mes && p.dia === dia;
  });
  if (bloqueado) return [];

  const horarios = gerarHorarios(
    exped.abre,
    exped.fecha,
    config.slotMinutos,
    exped.pausaInicio,
    exped.pausaFim,
  );
  if (horarios.length === 0) return [];

  // Limites de antecedência (mín. em horas) e janela máxima (em dias).
  const agora = new Date();
  const limiteMin = new Date(
    agora.getTime() + config.antecedenciaMinHoras * 3_600_000,
  );
  const hojeSP = partesEmSP(agora);
  const dentroJanelaDias =
    diffDiasSP({ ano, mes, dia }, hojeSP) <= config.maxDiasAntecedencia;

  // Conta agendamentos ativos do dia inteiro (1 query) e agrupa por instante.
  const inicioDia = dateEmSP(ano, mes, dia, 0, 0);
  const fimDia = new Date(dateEmSP(ano, mes, dia, 23, 59).getTime() + 60_000);
  const agendamentos = await prisma.appointment.findMany({
    where: {
      dataHora: { gte: inicioDia, lt: fimDia },
      status: { notIn: ["CANCELADO", "NAO_COMPARECEU"] },
    },
    select: { dataHora: true },
  });

  // Mapa "HH:MM" (em SP) -> contagem de agendamentos.
  const ocupacao = new Map<string, number>();
  for (const a of agendamentos) {
    const p = partesEmSP(a.dataHora);
    const chave = `${String(p.hora).padStart(2, "0")}:${String(p.minuto).padStart(2, "0")}`;
    ocupacao.set(chave, (ocupacao.get(chave) ?? 0) + 1);
  }

  return horarios.map((hora) => {
    const min = horaParaMinutos(hora);
    const inicioSlot = dateEmSP(ano, mes, dia, Math.floor(min / 60), min % 60);
    const usados = ocupacao.get(hora) ?? 0;
    const vagasRestantes = Math.max(0, config.capacidadePorSlot - usados);
    const disponivel =
      vagasRestantes > 0 &&
      inicioSlot.getTime() >= limiteMin.getTime() &&
      dentroJanelaDias;
    return { hora, disponivel, vagasRestantes };
  });
}

// ---------------------------------------------------------------------------
// Validação de um slot específico (anti-corrida / anti-overbooking)
// ---------------------------------------------------------------------------

/**
 * Revalida no servidor, no momento da criação, se um instante (`dataHora`) ainda
 * é agendável: expediente aberto, fora da pausa, não bloqueado, dentro das
 * janelas de antecedência e com capacidade restante naquele horário exato.
 */
export async function validarSlot(
  dataHora: Date,
): Promise<{ ok: boolean; motivo?: string }> {
  if (!(dataHora instanceof Date) || Number.isNaN(dataHora.getTime())) {
    return { ok: false, motivo: "Data/hora inválida." };
  }

  const { config, expediente, diasBloqueados } = await getConfigAgenda();
  const p = partesEmSP(dataHora);

  // Expediente do dia.
  const exped = expediente.find((e) => e.diaSemana === p.diaSemana);
  if (!exped || !exped.aberto) {
    return { ok: false, motivo: "A oficina não atende neste dia." };
  }

  // Dia bloqueado (feriado/férias).
  const bloq = diasBloqueados.find((b) => {
    const bp = partesEmSP(b.data);
    return bp.ano === p.ano && bp.mes === p.mes && bp.dia === p.dia;
  });
  if (bloq) {
    return {
      ok: false,
      motivo: bloq.motivo
        ? `Data indisponível: ${bloq.motivo}.`
        : "Data indisponível (bloqueada).",
    };
  }

  // Dentro do expediente e fora da pausa.
  const minutoSlot = p.hora * 60 + p.minuto;
  const abre = horaParaMinutos(exped.abre);
  const fecha = horaParaMinutos(exped.fecha);
  if (minutoSlot < abre || minutoSlot >= fecha) {
    return { ok: false, motivo: "Horário fora do expediente." };
  }
  if (exped.pausaInicio && exped.pausaFim) {
    const pi = horaParaMinutos(exped.pausaInicio);
    const pf = horaParaMinutos(exped.pausaFim);
    if (!Number.isNaN(pi) && !Number.isNaN(pf) && minutoSlot >= pi && minutoSlot < pf) {
      return { ok: false, motivo: "Horário durante a pausa de almoço." };
    }
  }

  // Antecedência mínima.
  const limiteMin = Date.now() + config.antecedenciaMinHoras * 3_600_000;
  if (dataHora.getTime() < limiteMin) {
    return {
      ok: false,
      motivo: `É necessário agendar com pelo menos ${config.antecedenciaMinHoras}h de antecedência.`,
    };
  }

  // Janela máxima de dias no futuro.
  const hojeSP = partesEmSP(new Date());
  if (
    diffDiasSP({ ano: p.ano, mes: p.mes, dia: p.dia }, hojeSP) >
    config.maxDiasAntecedencia
  ) {
    return {
      ok: false,
      motivo: `Só é possível agendar até ${config.maxDiasAntecedencia} dias à frente.`,
    };
  }

  // Capacidade naquele instante exato (anti-overbooking).
  const usados = await prisma.appointment.count({
    where: {
      dataHora,
      status: { notIn: ["CANCELADO", "NAO_COMPARECEU"] },
    },
  });
  if (usados >= config.capacidadePorSlot) {
    return { ok: false, motivo: "Este horário acabou de ser preenchido. Escolha outro." };
  }

  return { ok: true };
}
