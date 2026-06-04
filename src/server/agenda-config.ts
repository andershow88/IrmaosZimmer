"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRoleForAction } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { horaParaMinutos } from "@/lib/agenda-slots";

// Server actions de PARAMETRIZAÇÃO da agenda (config + expediente + bloqueios).
// Acesso restrito a ADMINISTRADOR. Toda a lógica de disponibilidade vive na
// engine @/server/agenda-disponibilidade; aqui só editamos os parâmetros.

const ROUTE = "/painel/configuracoes";

export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

// ---------------------------------------------------------------------------
// Tipos serializáveis (Server Component -> Client Component)
// ---------------------------------------------------------------------------

export type AgendaConfigData = {
  slotMinutos: number;
  capacidadePorSlot: number;
  antecedenciaMinHoras: number;
  maxDiasAntecedencia: number;
};

export type ExpedienteDiaData = {
  diaSemana: number; // 0=Dom..6=Sáb
  aberto: boolean;
  abre: string; // "HH:MM"
  fecha: string; // "HH:MM"
  pausaInicio: string | null;
  pausaFim: string | null;
};

export type DiaBloqueadoData = {
  id: string;
  data: string; // "YYYY-MM-DD"
  motivo: string | null;
};

export type AgendaConfigCompleta = {
  config: AgendaConfigData;
  expediente: ExpedienteDiaData[];
  diasBloqueados: DiaBloqueadoData[];
  resumo: string;
};

// Rótulos dos dias da semana (0=Dom..6=Sáb). Privados ao módulo — arquivos
// "use server" só podem exportar funções async (o front tem sua própria cópia).
const DIAS_SEMANA_LABEL: readonly string[] = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const DIAS_SEMANA_CURTO: readonly string[] = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

// Defaults usados ao materializar um dia ainda inexistente.
const EXPEDIENTE_DEFAULT: Omit<ExpedienteDiaData, "diaSemana"> = {
  aberto: true,
  abre: "08:00",
  fecha: "18:00",
  pausaInicio: null,
  pausaFim: null,
};

// ---------------------------------------------------------------------------
// Helpers de data (somente data, sem fuso — DiaBloqueado é @db.Date)
// ---------------------------------------------------------------------------

/** "YYYY-MM-DD" -> Date em UTC à meia-noite (para colunas @db.Date). */
function dataISOParaDateUTC(dataISO: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO.trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const d = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
  // Valida (ex.: 31/02 não existe).
  if (
    d.getUTCFullYear() !== ano ||
    d.getUTCMonth() !== mes - 1 ||
    d.getUTCDate() !== dia
  ) {
    return null;
  }
  return d;
}

/** Date (@db.Date, UTC) -> "YYYY-MM-DD". */
function dateUTCParaISO(d: Date): string {
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Date (@db.Date, UTC) -> "dd/MM/yyyy" (sem armadilha de fuso). */
function dateUTCParaBR(d: Date): string {
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${dia}/${mes}/${ano}`;
}

// ---------------------------------------------------------------------------
// Resumo legível
// ---------------------------------------------------------------------------

/**
 * Monta um resumo legível do expediente + parâmetros, ex.:
 * "Seg–Sex 08:00–18:00 (almoço 12:00–13:00); Sáb 08:00–12:00; capacidade
 *  2/slot; slots de 30min."
 * Agrupa dias consecutivos com o mesmo horário.
 * (Interno: arquivos "use server" só podem exportar funções async.)
 */
function montarResumo(
  config: AgendaConfigData,
  expediente: ExpedienteDiaData[]
): string {
  // Ordena Seg..Dom para um resumo mais natural (semana começa na segunda).
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const dias = ordem
    .map((d) => expediente.find((e) => e.diaSemana === d))
    .filter((e): e is ExpedienteDiaData => Boolean(e));

  type Grupo = {
    inicio: number; // índice em `ordem`
    fim: number;
    assinatura: string;
    texto: string;
  };

  const assinaturaDe = (e: ExpedienteDiaData) =>
    e.aberto
      ? `${e.abre}-${e.fecha}-${e.pausaInicio ?? ""}-${e.pausaFim ?? ""}`
      : "FECHADO";

  const textoDe = (e: ExpedienteDiaData) => {
    if (!e.aberto) return "fechado";
    const pausa =
      e.pausaInicio && e.pausaFim
        ? ` (almoço ${e.pausaInicio}–${e.pausaFim})`
        : "";
    return `${e.abre}–${e.fecha}${pausa}`;
  };

  const grupos: Grupo[] = [];
  dias.forEach((e, idx) => {
    const assinatura = assinaturaDe(e);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.assinatura === assinatura) {
      ultimo.fim = idx;
    } else {
      grupos.push({ inicio: idx, fim: idx, assinatura, texto: textoDe(e) });
    }
  });

  const partes = grupos.map((g) => {
    const diaIni = DIAS_SEMANA_CURTO[ordem[g.inicio]];
    const diaFim = DIAS_SEMANA_CURTO[ordem[g.fim]];
    const rotulo = g.inicio === g.fim ? diaIni : `${diaIni}–${diaFim}`;
    return `${rotulo} ${g.texto}`;
  });

  const expedienteTxt =
    partes.length > 0 ? partes.join("; ") : "expediente não configurado";

  return (
    `${expedienteTxt}; capacidade ${config.capacidadePorSlot}/slot; ` +
    `slots de ${config.slotMinutos}min; antecedência mín. ` +
    `${config.antecedenciaMinHoras}h; até ${config.maxDiasAntecedencia} ` +
    `dias à frente.`
  );
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

/**
 * Retorna a configuração completa da agenda para a tela de parametrização:
 * config (singleton, criada com defaults se faltar), expediente dos 7 dias
 * (materializa dias ausentes com defaults, sem gravar) e dias bloqueados.
 */
export async function getAgendaConfigCompleta(): Promise<AgendaConfigCompleta> {
  let config = await prisma.agendaConfig.findFirst();
  if (!config) {
    config = await prisma.agendaConfig.create({ data: {} });
  }

  const [expedienteDb, bloqueadosDb] = await Promise.all([
    prisma.horarioExpediente.findMany({ orderBy: { diaSemana: "asc" } }),
    prisma.diaBloqueado.findMany({ orderBy: { data: "asc" } }),
  ]);

  // Garante os 7 dias na ordem 0..6 (ausentes -> defaults, não persistidos).
  const expediente: ExpedienteDiaData[] = Array.from({ length: 7 }, (_, d) => {
    const row = expedienteDb.find((e) => e.diaSemana === d);
    if (!row) return { diaSemana: d, ...EXPEDIENTE_DEFAULT };
    return {
      diaSemana: row.diaSemana,
      aberto: row.aberto,
      abre: row.abre,
      fecha: row.fecha,
      pausaInicio: row.pausaInicio,
      pausaFim: row.pausaFim,
    };
  });

  const configData: AgendaConfigData = {
    slotMinutos: config.slotMinutos,
    capacidadePorSlot: config.capacidadePorSlot,
    antecedenciaMinHoras: config.antecedenciaMinHoras,
    maxDiasAntecedencia: config.maxDiasAntecedencia,
  };

  const diasBloqueados: DiaBloqueadoData[] = bloqueadosDb.map((b) => ({
    id: b.id,
    data: dateUTCParaISO(b.data),
    motivo: b.motivo,
  }));

  return {
    config: configData,
    expediente,
    diasBloqueados,
    resumo: montarResumo(configData, expediente),
  };
}

// ---------------------------------------------------------------------------
// AgendaConfig (parâmetros gerais)
// ---------------------------------------------------------------------------

const configSchema = z.object({
  slotMinutos: z
    .number({ message: "Informe a duração do slot." })
    .int("Use um número inteiro de minutos.")
    .min(5, "O slot deve ter ao menos 5 minutos.")
    .max(240, "O slot não pode passar de 240 minutos."),
  capacidadePorSlot: z
    .number({ message: "Informe a capacidade por slot." })
    .int("Use um número inteiro.")
    .min(1, "A capacidade deve ser de pelo menos 1.")
    .max(50, "Capacidade máxima de 50 por slot."),
  antecedenciaMinHoras: z
    .number({ message: "Informe a antecedência mínima." })
    .int("Use um número inteiro de horas.")
    .min(0, "A antecedência não pode ser negativa.")
    .max(720, "Antecedência máxima de 720h (30 dias)."),
  maxDiasAntecedencia: z
    .number({ message: "Informe a janela máxima." })
    .int("Use um número inteiro de dias.")
    .min(1, "A janela deve ser de pelo menos 1 dia.")
    .max(365, "Janela máxima de 365 dias."),
});

/** Atualiza (ou cria) o singleton de parâmetros da agenda. */
export async function saveAgendaConfig(
  input: AgendaConfigData
): Promise<ActionResult> {
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }
  const data = parsed.data;

  const existing = await prisma.agendaConfig.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.agendaConfig.update({ where: { id: existing.id }, data });
  } else {
    await prisma.agendaConfig.create({ data });
  }

  await logAudit(
    actor.id,
    "ATUALIZAR",
    "AgendaConfig",
    existing?.id,
    `Parâmetros da agenda: slot ${data.slotMinutos}min, capacidade ` +
      `${data.capacidadePorSlot}/slot, antecedência ${data.antecedenciaMinHoras}h, ` +
      `janela ${data.maxDiasAntecedencia} dias.`
  );

  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// HorarioExpediente (por dia da semana)
// ---------------------------------------------------------------------------

const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const horaSchema = z
  .string()
  .trim()
  .regex(horaRegex, "Use o formato HH:MM (24h).");

const expedienteDiaSchema = z
  .object({
    diaSemana: z
      .number()
      .int()
      .min(0, "Dia da semana inválido.")
      .max(6, "Dia da semana inválido."),
    aberto: z.boolean(),
    abre: horaSchema,
    fecha: horaSchema,
    pausaInicio: horaSchema.optional().or(z.literal("")).nullable(),
    pausaFim: horaSchema.optional().or(z.literal("")).nullable(),
  })
  .superRefine((d, ctx) => {
    if (!d.aberto) return; // Dia fechado: não valida horários.
    const abre = horaParaMinutos(d.abre);
    const fecha = horaParaMinutos(d.fecha);
    if (fecha <= abre) {
      ctx.addIssue({
        code: "custom",
        message: "O horário de fechamento deve ser depois da abertura.",
        path: ["fecha"],
      });
    }
    const pi = d.pausaInicio ? d.pausaInicio : "";
    const pf = d.pausaFim ? d.pausaFim : "";
    const temUm = Boolean(pi) !== Boolean(pf);
    if (temUm) {
      ctx.addIssue({
        code: "custom",
        message: "Preencha início e fim da pausa, ou deixe ambos em branco.",
        path: ["pausaInicio"],
      });
      return;
    }
    if (pi && pf) {
      const mi = horaParaMinutos(pi);
      const mf = horaParaMinutos(pf);
      if (mf <= mi) {
        ctx.addIssue({
          code: "custom",
          message: "O fim da pausa deve ser depois do início.",
          path: ["pausaFim"],
        });
      } else if (mi < abre || mf > fecha) {
        ctx.addIssue({
          code: "custom",
          message: "A pausa deve estar dentro do expediente.",
          path: ["pausaInicio"],
        });
      }
    }
  });

/**
 * Salva o expediente dos 7 dias de uma vez (upsert por diaSemana). Recebe a
 * grade completa; dias fechados zeram a pausa.
 */
export async function saveExpediente(
  dias: ExpedienteDiaData[]
): Promise<ActionResult> {
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

  if (!Array.isArray(dias) || dias.length === 0) {
    return { ok: false, error: "Nenhum dia informado." };
  }

  const validos: ExpedienteDiaData[] = [];
  const vistos = new Set<number>();
  for (const dia of dias) {
    const parsed = expedienteDiaSchema.safeParse(dia);
    if (!parsed.success) {
      const label = DIAS_SEMANA_LABEL[dia?.diaSemana] ?? "dia";
      return { ok: false, error: `${label}: ${firstError(parsed.error)}` };
    }
    if (vistos.has(parsed.data.diaSemana)) {
      return { ok: false, error: "Dia da semana duplicado." };
    }
    vistos.add(parsed.data.diaSemana);
    const d = parsed.data;
    const fechado = !d.aberto;
    validos.push({
      diaSemana: d.diaSemana,
      aberto: d.aberto,
      abre: d.abre,
      fecha: d.fecha,
      pausaInicio: fechado || !d.pausaInicio ? null : d.pausaInicio,
      pausaFim: fechado || !d.pausaFim ? null : d.pausaFim,
    });
  }

  await prisma.$transaction(
    validos.map((d) =>
      prisma.horarioExpediente.upsert({
        where: { diaSemana: d.diaSemana },
        create: {
          diaSemana: d.diaSemana,
          aberto: d.aberto,
          abre: d.abre,
          fecha: d.fecha,
          pausaInicio: d.pausaInicio,
          pausaFim: d.pausaFim,
        },
        update: {
          aberto: d.aberto,
          abre: d.abre,
          fecha: d.fecha,
          pausaInicio: d.pausaInicio,
          pausaFim: d.pausaFim,
        },
      })
    )
  );

  await logAudit(
    actor.id,
    "ATUALIZAR",
    "HorarioExpediente",
    null,
    "Expediente semanal da agenda atualizado."
  );

  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// DiaBloqueado (feriados / férias)
// ---------------------------------------------------------------------------

const bloqueioSchema = z.object({
  data: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  motivo: z
    .string()
    .trim()
    .max(120, "Motivo muito longo (máx. 120).")
    .optional()
    .or(z.literal("")),
});

/** Adiciona um dia bloqueado (feriado/férias). Não permite datas duplicadas. */
export async function addDiaBloqueado(input: {
  data: string;
  motivo?: string;
}): Promise<ActionResult> {
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

  const parsed = bloqueioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const dataUTC = dataISOParaDateUTC(parsed.data.data);
  if (!dataUTC) {
    return { ok: false, error: "Data inválida." };
  }

  const existing = await prisma.diaBloqueado.findUnique({
    where: { data: dataUTC },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Esta data já está bloqueada." };
  }

  const motivo = parsed.data.motivo ? parsed.data.motivo.trim() : null;
  const criado = await prisma.diaBloqueado.create({
    data: { data: dataUTC, motivo },
  });

  await logAudit(
    actor.id,
    "CRIAR",
    "DiaBloqueado",
    criado.id,
    `Dia bloqueado ${dateUTCParaBR(dataUTC)}${motivo ? ` (${motivo})` : ""}.`
  );

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Remove um dia bloqueado pelo id. */
export async function removeDiaBloqueado(input: {
  id: string;
}): Promise<ActionResult> {
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

  if (!input.id) {
    return { ok: false, error: "Registro inválido." };
  }

  const registro = await prisma.diaBloqueado.findUnique({
    where: { id: input.id },
    select: { id: true, data: true },
  });
  if (!registro) {
    return { ok: false, error: "Dia bloqueado não encontrado." };
  }

  await prisma.diaBloqueado.delete({ where: { id: input.id } });

  await logAudit(
    actor.id,
    "EXCLUIR",
    "DiaBloqueado",
    input.id,
    `Bloqueio de ${dateUTCParaBR(registro.data)} removido.`
  );

  revalidatePath(ROUTE);
  return { ok: true };
}
