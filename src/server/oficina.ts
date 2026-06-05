import "server-only";

import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import type { Prisma, StatusOS } from "@prisma/client";

// ---------------------------------------------------------------------------
// Modo Mecânico — APENAS leitura.
//
// Toda mutação (status, apontamento, checklist, anexo, campos) é feita pelas
// Server Actions já existentes em @/server/{ordens,horas,checklists,anexos}.
// Este módulo expõe somente queries de leitura usadas pelas páginas /painel/oficina.
// ---------------------------------------------------------------------------

/**
 * Ordem de prioridade dos status na lista do mecânico: o que está "na bancada"
 * primeiro (em execução / aguardando), depois aprovadas, depois o restante.
 * Status finalizados (ENTREGUE/CANCELADA) são excluídos da listagem por padrão.
 */
const PESO_STATUS: Record<string, number> = {
  EM_EXECUCAO: 0,
  AGUARDANDO_PECAS: 1,
  APROVADA: 2,
  AGUARDANDO_DIAGNOSTICO: 3,
  AGUARDANDO_APROVACAO: 4,
  ABERTA: 5,
  CONCLUIDA: 6,
};

const PESO_PRIORIDADE: Record<string, number> = {
  URGENTE: 0,
  ALTA: 1,
  NORMAL: 2,
  BAIXA: 3,
};

export type OficinaCard = {
  id: string;
  numero: string;
  status: StatusOS;
  prioridade: string;
  cliente: string;
  veiculo: string;
  placa: string;
  queixa: string | null;
  emExecucaoPorMim: boolean;
};

/**
 * Lista enxuta das OS atribuídas ao mecânico logado, ordenada para a bancada.
 * Por padrão esconde OS finalizadas (ENTREGUE/CANCELADA).
 */
export async function listarMinhasOS(
  user: SessionUser,
  opts: { q?: string; incluirFinalizadas?: boolean } = {}
): Promise<OficinaCard[]> {
  const q = (opts.q ?? "").trim();

  const where: Prisma.ServiceOrderWhereInput = { mecanicoId: user.id };

  if (!opts.incluirFinalizadas) {
    where.status = { notIn: ["ENTREGUE", "CANCELADA"] };
  }

  if (q) {
    where.OR = [
      { numero: { contains: q, mode: "insensitive" } },
      { customer: { nome: { contains: q, mode: "insensitive" } } },
      { vehicle: { placa: { contains: q, mode: "insensitive" } } },
      { vehicle: { modelo: { contains: q, mode: "insensitive" } } },
    ];
  }

  const ordens = await prisma.serviceOrder.findMany({
    where,
    select: {
      id: true,
      numero: true,
      status: true,
      prioridade: true,
      problemaRelatado: true,
      customer: { select: { nome: true } },
      vehicle: { select: { marca: true, modelo: true, placa: true } },
      timeEntries: {
        where: { userId: user.id, fim: null },
        select: { id: true },
        take: 1,
      },
    },
    take: 200,
  });

  const cards: OficinaCard[] = ordens.map((os) => ({
    id: os.id,
    numero: os.numero,
    status: os.status,
    prioridade: os.prioridade,
    cliente: os.customer.nome,
    veiculo: `${os.vehicle.marca} ${os.vehicle.modelo}`.trim(),
    placa: os.vehicle.placa,
    queixa: os.problemaRelatado,
    emExecucaoPorMim: os.timeEntries.length > 0,
  }));

  // Ordena: apontamento aberto do mecânico > peso de status > prioridade > número.
  return cards.sort((a, b) => {
    if (a.emExecucaoPorMim !== b.emExecucaoPorMim) {
      return a.emExecucaoPorMim ? -1 : 1;
    }
    const ps = (PESO_STATUS[a.status] ?? 9) - (PESO_STATUS[b.status] ?? 9);
    if (ps !== 0) return ps;
    const pp =
      (PESO_PRIORIDADE[a.prioridade] ?? 9) - (PESO_PRIORIDADE[b.prioridade] ?? 9);
    if (pp !== 0) return pp;
    return b.numero.localeCompare(a.numero);
  });
}

export type OficinaDetalheItem = {
  id: string;
  tipo: "SERVICO" | "PECA";
  descricao: string;
  quantidade: number;
};

export type OficinaApontamento = {
  id: string;
  mecanico: string;
  inicio: Date;
  fim: Date | null;
  minutos: number | null;
  emAndamento: boolean;
};

export type OficinaChecklistItem = {
  id: string;
  item: string;
  status: string;
  observacao: string | null;
};

export type OficinaChecklist = {
  id: string;
  data: Date;
  items: OficinaChecklistItem[];
};

export type OficinaAnexo = {
  id: string;
  url: string;
  nome: string | null;
  tipo: string | null;
  createdAt: Date;
};

export type OficinaDetalhe = {
  id: string;
  numero: string;
  status: StatusOS;
  prioridade: string;
  cliente: string;
  veiculo: string;
  placa: string;
  ano: number | null;
  quilometragem: number | null;
  queixa: string | null;
  diagnostico: string | null;
  obsInternas: string | null;
  previsaoEntrega: Date | null;
  tempoPrevistoMin: number;
  finalizada: boolean;
  /** Itens da OS divididos: serviços a executar e peças necessárias. */
  servicos: OficinaDetalheItem[];
  pecas: OficinaDetalheItem[];
  apontamentos: OficinaApontamento[];
  /** ID do apontamento aberto do mecânico logado (controla o timer). */
  apontamentoAbertoId: string | null;
  checklists: OficinaChecklist[];
  anexos: OficinaAnexo[];
};

/**
 * Detalhe enxuto de uma OS para a tela do mecânico. Carrega apenas o que a
 * bancada precisa (queixa, diagnóstico, itens, checklist, horas, anexos).
 * Retorna null se a OS não existir.
 */
export async function obterDetalheOficina(
  serviceOrderId: string,
  user: SessionUser
): Promise<OficinaDetalhe | null> {
  const os = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      customer: { select: { nome: true } },
      vehicle: {
        select: { marca: true, modelo: true, placa: true, ano: true },
      },
      items: {
        select: { id: true, tipo: true, descricao: true, quantidade: true },
        orderBy: { tipo: "asc" },
      },
      timeEntries: {
        orderBy: { inicio: "desc" },
        include: { user: { select: { name: true } } },
      },
      inspections: {
        orderBy: { data: "desc" },
        include: {
          items: {
            select: { id: true, item: true, status: true, observacao: true },
          },
        },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!os) return null;

  // Isolamento de acesso: um MECANICO só enxerga as OS atribuídas a ele.
  // ADMINISTRADOR (e demais papéis liberados na rota) podem ver qualquer OS.
  if (user.role !== "ADMINISTRADOR" && os.mecanicoId !== user.id) return null;

  const finalizada = os.status === "ENTREGUE" || os.status === "CANCELADA";

  return {
    id: os.id,
    numero: os.numero,
    status: os.status,
    prioridade: os.prioridade,
    cliente: os.customer.nome,
    veiculo: `${os.vehicle.marca} ${os.vehicle.modelo}`.trim(),
    placa: os.vehicle.placa,
    ano: os.vehicle.ano,
    quilometragem: os.quilometragem,
    queixa: os.problemaRelatado,
    diagnostico: os.diagnostico,
    obsInternas: os.obsInternas,
    previsaoEntrega: os.previsaoEntrega,
    tempoPrevistoMin: os.tempoPrevistoMin,
    finalizada,
    servicos: os.items
      .filter((i) => i.tipo === "SERVICO")
      .map((i) => ({
        id: i.id,
        tipo: "SERVICO" as const,
        descricao: i.descricao,
        quantidade: i.quantidade,
      })),
    pecas: os.items
      .filter((i) => i.tipo === "PECA")
      .map((i) => ({
        id: i.id,
        tipo: "PECA" as const,
        descricao: i.descricao,
        quantidade: i.quantidade,
      })),
    apontamentos: os.timeEntries.map((t) => ({
      id: t.id,
      mecanico: t.user?.name ?? "—",
      inicio: t.inicio,
      fim: t.fim,
      minutos: t.minutos,
      emAndamento: t.fim == null,
    })),
    apontamentoAbertoId:
      os.timeEntries.find((t) => t.fim == null && t.userId === user.id)?.id ??
      null,
    checklists: os.inspections.map((insp) => ({
      id: insp.id,
      data: insp.data,
      items: insp.items.map((it) => ({
        id: it.id,
        item: it.item,
        status: it.status,
        observacao: it.observacao,
      })),
    })),
    anexos: os.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      nome: a.nome,
      tipo: a.tipo,
      createdAt: a.createdAt,
    })),
  };
}

/** Soma de minutos executados (apontamentos fechados + decorrido dos abertos). */
export function minutosExecutados(apontamentos: OficinaApontamento[]): number {
  const agora = Date.now();
  return apontamentos.reduce((acc, a) => {
    if (a.fim && a.minutos != null) return acc + a.minutos;
    if (a.emAndamento) {
      return acc + Math.max(0, Math.round((agora - a.inicio.getTime()) / 60000));
    }
    return acc;
  }, 0);
}
