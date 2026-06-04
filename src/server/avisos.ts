"use server";

import { revalidatePath } from "next/cache";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  subMonths,
  setMonth,
  setDate,
} from "date-fns";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";

/**
 * Tipos de aviso suportados (string livre no model Reminder).
 * Mantido interno: arquivos "use server" só podem exportar funções async.
 */
const TIPO_AVISO = {
  ANIVERSARIO: "ANIVERSARIO",
  REVISAO: "REVISAO",
} as const;

/** Status de Reminder pendente. */
const STATUS_PENDENTE = "PENDENTE";

/** Status de OS considerada "entregue" (gera período de revisão). */
const STATUS_OS_ENTREGUE = "ENTREGUE" as const;

/** Meses sem nova OS após a última entrega para sugerir revisão. */
const MESES_REVISAO = 6;

export type ResultadoGerarAvisos = {
  aniversarios: number;
  revisoes: number;
  total: number;
};

/**
 * Gera Reminders PENDENTES para aniversariantes do mês e revisões devidas,
 * sem duplicar (checa existência por cliente + tipo dentro do período).
 *
 * Pode ser chamado a partir de Server Actions, da página ou do cron.
 * NÃO exige sessão (o cron usa segredo próprio); a página o protege via requireUser.
 */
export async function gerarAvisos(): Promise<ResultadoGerarAvisos> {
  const aniversarios = await gerarAvisosAniversario();
  const revisoes = await gerarAvisosRevisao();
  return { aniversarios, revisoes, total: aniversarios + revisoes };
}

/** Cria avisos de aniversário para clientes que fazem aniversário no mês atual. */
async function gerarAvisosAniversario(): Promise<number> {
  const agora = new Date();
  const mesAtual = agora.getMonth(); // 0-11
  const inicioMes = startOfMonth(agora);
  const fimMes = endOfMonth(agora);

  // Clientes com data de nascimento cadastrada. Filtramos o mês em memória,
  // pois o ano de nascimento varia (não dá pra usar range simples de datas).
  const clientes = await prisma.customer.findMany({
    where: { dataNascimento: { not: null } },
    select: { id: true, dataNascimento: true },
  });

  const aniversariantes = clientes.filter(
    (c) => c.dataNascimento != null && c.dataNascimento.getUTCMonth() === mesAtual
  );
  if (aniversariantes.length === 0) return 0;

  // Avisos de aniversário já existentes neste mês (qualquer status).
  const existentes = await prisma.reminder.findMany({
    where: {
      tipo: TIPO_AVISO.ANIVERSARIO,
      customerId: { in: aniversariantes.map((c) => c.id) },
      dueDate: { gte: inicioMes, lte: fimMes },
    },
    select: { customerId: true },
  });
  const jaTemAviso = new Set(existentes.map((r) => r.customerId));

  let criados = 0;
  for (const c of aniversariantes) {
    if (jaTemAviso.has(c.id)) continue;
    // Data de vencimento = aniversário deste ano (dia/mês do nascimento).
    const nasc = c.dataNascimento!;
    const due = setDate(
      setMonth(startOfDay(agora), nasc.getUTCMonth()),
      nasc.getUTCDate()
    );
    await prisma.reminder.create({
      data: {
        tipo: TIPO_AVISO.ANIVERSARIO,
        customerId: c.id,
        dueDate: due,
        status: STATUS_PENDENTE,
        canal: "WHATSAPP",
      },
    });
    criados++;
  }
  return criados;
}

/**
 * Cria avisos de revisão para clientes cuja última OS ENTREGUE foi há >= 6 meses
 * e que não possuem OS mais recente (em qualquer status).
 */
async function gerarAvisosRevisao(): Promise<number> {
  const agora = new Date();
  const limite = subMonths(agora, MESES_REVISAO);

  // Última OS ENTREGUE por cliente, anterior ao limite.
  const ultimasEntregues = await prisma.serviceOrder.findMany({
    where: {
      status: STATUS_OS_ENTREGUE,
      updatedAt: { lte: limite },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      customerId: true,
      vehicleId: true,
      updatedAt: true,
    },
  });

  // Mantém apenas a OS entregue mais recente de cada cliente.
  const porCliente = new Map<string, (typeof ultimasEntregues)[number]>();
  for (const os of ultimasEntregues) {
    if (!porCliente.has(os.customerId)) porCliente.set(os.customerId, os);
  }
  if (porCliente.size === 0) return 0;

  const customerIds = [...porCliente.keys()];

  // Clientes que possuem alguma OS mais recente que o limite são removidos
  // (já voltaram à oficina recentemente).
  const recentes = await prisma.serviceOrder.findMany({
    where: {
      customerId: { in: customerIds },
      updatedAt: { gt: limite },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const voltaramRecentemente = new Set(recentes.map((r) => r.customerId));

  // Avisos de revisão PENDENTES já existentes para esses clientes (evita duplicar).
  const existentes = await prisma.reminder.findMany({
    where: {
      tipo: TIPO_AVISO.REVISAO,
      customerId: { in: customerIds },
      status: STATUS_PENDENTE,
    },
    select: { customerId: true },
  });
  const jaTemAviso = new Set(existentes.map((r) => r.customerId));

  let criados = 0;
  for (const [customerId, os] of porCliente) {
    if (voltaramRecentemente.has(customerId)) continue;
    if (jaTemAviso.has(customerId)) continue;
    await prisma.reminder.create({
      data: {
        tipo: TIPO_AVISO.REVISAO,
        customerId,
        vehicleId: os.vehicleId,
        serviceOrderId: os.id,
        dueDate: startOfDay(agora),
        status: STATUS_PENDENTE,
        canal: "WHATSAPP",
      },
    });
    criados++;
  }
  return criados;
}

/** Marca um aviso como enviado (status ENVIADO + sentAt). */
export async function marcarEnviado(
  reminderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUserForAction();
  if (!reminderId) return { ok: false, error: "Aviso não encontrado." };

  const existing = await prisma.reminder.findUnique({
    where: { id: reminderId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Aviso não encontrado." };

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: "ENVIADO", sentAt: new Date() },
  });

  revalidatePath("/painel/avisos");
  revalidatePath("/painel");
  return { ok: true };
}

/** Server Action: gera avisos a partir da UI (botão "Gerar avisos agora"). */
export async function gerarAvisosAction(): Promise<ResultadoGerarAvisos> {
  await requireUserForAction();
  const res = await gerarAvisos();
  revalidatePath("/painel/avisos");
  revalidatePath("/painel");
  return res;
}

export type AvisoPendente = {
  id: string;
  tipo: string;
  dueDate: Date;
  clienteId: string | null;
  clienteNome: string;
  whatsapp: string | null;
  telefone: string | null;
  veiculo: string | null;
  numeroOS: string | null;
};

/**
 * Lista os avisos PENDENTES (inbox), opcionalmente filtrados por tipo,
 * já com os dados de cliente/veículo necessários para a UI.
 */
export async function listarAvisosPendentes(
  tipo?: string
): Promise<AvisoPendente[]> {
  const reminders = await prisma.reminder.findMany({
    where: {
      status: STATUS_PENDENTE,
      ...(tipo ? { tipo } : {}),
    },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      tipo: true,
      dueDate: true,
      customer: {
        select: { id: true, nome: true, whatsapp: true, telefone: true },
      },
      serviceOrder: {
        select: {
          numero: true,
          vehicle: { select: { marca: true, modelo: true, placa: true } },
        },
      },
    },
  });

  return reminders.map((r) => {
    const v = r.serviceOrder?.vehicle;
    const veiculo = v
      ? `${v.marca} ${v.modelo}`.trim() + (v.placa ? ` (${v.placa})` : "")
      : null;
    return {
      id: r.id,
      tipo: r.tipo,
      dueDate: r.dueDate,
      clienteId: r.customer?.id ?? null,
      clienteNome: r.customer?.nome ?? "Cliente",
      whatsapp: r.customer?.whatsapp ?? null,
      telefone: r.customer?.telefone ?? null,
      veiculo,
      numeroOS: r.serviceOrder?.numero ?? null,
    };
  });
}

export type ContagemAvisos = {
  ANIVERSARIO: number;
  REVISAO: number;
  total: number;
};

/** Contagem de avisos pendentes por tipo (para abas/filtros). */
export async function contarAvisosPendentes(): Promise<ContagemAvisos> {
  const grupos = await prisma.reminder.groupBy({
    by: ["tipo"],
    where: { status: STATUS_PENDENTE },
    _count: { _all: true },
  });

  let aniversario = 0;
  let revisao = 0;
  for (const g of grupos) {
    if (g.tipo === TIPO_AVISO.ANIVERSARIO) aniversario = g._count._all;
    else if (g.tipo === TIPO_AVISO.REVISAO) revisao = g._count._all;
  }
  return {
    ANIVERSARIO: aniversario,
    REVISAO: revisao,
    total: aniversario + revisao,
  };
}
