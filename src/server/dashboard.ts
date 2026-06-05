import { prisma } from "@/lib/db";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  subMonths,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { StatusOS } from "@prisma/client";
import type { Role } from "@/lib/roles";

// Limites de itens exibidos nos blocos do dashboard (parametrizados para
// permitir ajuste de UX sem caçar números mágicos pelas queries).
/** Listas padrão (OS, pagamentos, revisões, atividade). */
const DASH_LIMIT = 8;
/** Blocos compactos (poucas linhas). */
const DASH_LIMIT_COMPACT = 5;
/** Blocos com mais espaço (ex.: últimas movimentações/atividade). */
const DASH_LIMIT_WIDE = 10;
/** Blocos pequenos (ex.: pagamentos pendentes em destaque). */
const DASH_LIMIT_SMALL = 6;

/** Status de OS considerados "encerrados" (não estão mais em andamento). */
const STATUS_OS_ENCERRADOS: StatusOS[] = ["ENTREGUE", "CANCELADA"];

/** Status de OS considerados concluídos para cálculo de ticket médio. */
const STATUS_OS_CONCLUIDOS: StatusOS[] = ["CONCLUIDA", "ENTREGUE"];

export type DashboardStats = {
  osAbertas: number;
  veiculosAguardandoDiagnostico: number;
  orcamentosAguardandoAprovacao: number;
  servicosEmExecucao: number;
  agendamentosHoje: number;
  pagamentosPendentesCount: number;
  pagamentosPendentesSaldo: number;
  receitaMes: number;
  ticketMedio: number;
};

/** Ponto do gráfico de faturamento mensal. */
export type FaturamentoMensal = {
  mes: string;
  total: number;
};

export type ProximaEntrega = {
  id: string;
  numero: string;
  status: StatusOS;
  previsaoEntrega: Date | null;
  clienteNome: string;
  veiculo: string;
  placa: string;
};

export type AlertaEstoque = {
  id: string;
  nome: string;
  codigoInterno: string;
  quantidade: number;
  estoqueMinimo: number;
};

/** Carrega todos os indicadores numéricos do dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const agora = new Date();
  const inicioDia = startOfDay(agora);
  const fimDia = endOfDay(agora);
  const inicioMes = startOfMonth(agora);
  const fimMes = endOfMonth(agora);

  const [
    osAbertas,
    veiculosAguardandoDiagnostico,
    orcamentosAguardandoAprovacao,
    servicosEmExecucao,
    agendamentosHoje,
    pagamentosPendentes,
    receitaAgg,
    ticketAgg,
  ] = await Promise.all([
    prisma.serviceOrder.count({
      where: { status: { notIn: STATUS_OS_ENCERRADOS } },
    }),
    prisma.serviceOrder.count({
      where: { status: "AGUARDANDO_DIAGNOSTICO" },
    }),
    prisma.quote.count({
      where: { status: "ENVIADO" },
    }),
    prisma.serviceOrder.count({
      where: { status: "EM_EXECUCAO" },
    }),
    prisma.appointment.count({
      where: { dataHora: { gte: inicioDia, lte: fimDia } },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PENDENTE", "PARCIAL"] } },
      select: { valorTotal: true, valorPago: true },
    }),
    prisma.payment.aggregate({
      _sum: { valorPago: true },
      where: {
        status: "PAGO",
        dataPagamento: { gte: inicioMes, lte: fimMes },
      },
    }),
    prisma.serviceOrder.aggregate({
      _avg: { total: true },
      where: { status: { in: STATUS_OS_CONCLUIDOS } },
    }),
  ]);

  const pagamentosPendentesSaldo = pagamentosPendentes.reduce(
    (acc, p) => acc + (Number(p.valorTotal) - Number(p.valorPago)),
    0
  );

  return {
    osAbertas,
    veiculosAguardandoDiagnostico,
    orcamentosAguardandoAprovacao,
    servicosEmExecucao,
    agendamentosHoje,
    pagamentosPendentesCount: pagamentosPendentes.length,
    pagamentosPendentesSaldo,
    receitaMes: Number(receitaAgg._sum.valorPago ?? 0),
    ticketMedio: Number(ticketAgg._avg.total ?? 0),
  };
}

/** Faturamento (pagamentos PAGO) dos últimos 6 meses, do mais antigo ao atual. */
export async function getFaturamentoUltimos6Meses(): Promise<FaturamentoMensal[]> {
  const agora = new Date();
  const inicioPeriodo = startOfMonth(subMonths(agora, 5));

  const pagamentos = await prisma.payment.findMany({
    where: {
      status: "PAGO",
      dataPagamento: { gte: inicioPeriodo, lte: endOfMonth(agora) },
    },
    select: { valorPago: true, dataPagamento: true },
  });

  // Inicializa os 6 meses (do mais antigo ao atual) com total zero.
  const buckets: FaturamentoMensal[] = [];
  const chaves: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(agora, i);
    chaves.push(format(ref, "yyyy-MM"));
    buckets.push({ mes: format(ref, "MMM/yy", { locale: ptBR }), total: 0 });
  }

  for (const p of pagamentos) {
    if (!p.dataPagamento) continue;
    const chave = format(p.dataPagamento, "yyyy-MM");
    const idx = chaves.indexOf(chave);
    if (idx >= 0) buckets[idx].total += Number(p.valorPago);
  }

  return buckets;
}

/** Próximas entregas: OS com previsão a partir de hoje, ordenadas, top 5. */
export async function getProximasEntregas(): Promise<ProximaEntrega[]> {
  const inicioDia = startOfDay(new Date());

  const ordens = await prisma.serviceOrder.findMany({
    where: {
      previsaoEntrega: { gte: inicioDia },
      status: { notIn: STATUS_OS_ENCERRADOS },
    },
    orderBy: { previsaoEntrega: "asc" },
    take: DASH_LIMIT_COMPACT,
    select: {
      id: true,
      numero: true,
      status: true,
      previsaoEntrega: true,
      customer: { select: { nome: true } },
      vehicle: { select: { marca: true, modelo: true, placa: true } },
    },
  });

  return ordens.map((o) => ({
    id: o.id,
    numero: o.numero,
    status: o.status,
    previsaoEntrega: o.previsaoEntrega,
    clienteNome: o.customer.nome,
    veiculo: `${o.vehicle.marca} ${o.vehicle.modelo}`.trim(),
    placa: o.vehicle.placa,
  }));
}

export type Aniversariante = {
  id: string;
  nome: string;
  dia: number;
  whatsapp: string | null;
  telefone: string | null;
};

/**
 * Clientes que fazem aniversário no mês atual (ordenados por dia).
 * O ano de nascimento varia, então filtramos o mês em memória.
 */
export async function getAniversariantesDoMes(): Promise<Aniversariante[]> {
  const mesAtual = new Date().getMonth(); // 0-11

  const clientes = await prisma.customer.findMany({
    where: { dataNascimento: { not: null } },
    select: {
      id: true,
      nome: true,
      dataNascimento: true,
      whatsapp: true,
      telefone: true,
    },
  });

  return clientes
    .filter(
      (c) =>
        c.dataNascimento != null &&
        c.dataNascimento.getUTCMonth() === mesAtual
    )
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      dia: c.dataNascimento!.getUTCDate(),
      whatsapp: c.whatsapp,
      telefone: c.telefone,
    }))
    .sort((a, b) => a.dia - b.dia);
}

/** Quantidade de avisos de revisão pendentes (inbox de avisos). */
export async function getRevisoesPendentesCount(): Promise<number> {
  return prisma.reminder.count({
    where: { tipo: "REVISAO", status: "PENDENTE" },
  });
}

/**
 * Peças com estoque crítico: abaixo/igual ao mínimo (quando há mínimo) OU
 * zeradas mesmo sem mínimo definido. Zeradas são priorizadas no topo.
 */
export async function getAlertasEstoqueBaixo(limite = DASH_LIMIT): Promise<AlertaEstoque[]> {
  // Prisma não compara dois campos em where; filtramos em memória.
  // Buscamos peças com mínimo definido OU sem estoque, para não esconder
  // itens zerados que não têm estoqueMinimo configurado (audit 7.10).
  const pecas = await prisma.part.findMany({
    where: {
      OR: [{ estoqueMinimo: { gt: 0 } }, { quantidade: { lte: 0 } }],
    },
    select: {
      id: true,
      nome: true,
      codigoInterno: true,
      quantidade: true,
      estoqueMinimo: true,
    },
    orderBy: { quantidade: "asc" },
  });

  return pecas
    .filter((p) => p.quantidade <= 0 || p.quantidade <= p.estoqueMinimo)
    .sort((a, b) => {
      // Zerados primeiro; depois pelo "déficit" relativo (mais crítico antes).
      const aZero = a.quantidade <= 0 ? 0 : 1;
      const bZero = b.quantidade <= 0 ? 0 : 1;
      if (aZero !== bZero) return aZero - bZero;
      return a.quantidade - b.quantidade;
    })
    .slice(0, limite)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      codigoInterno: p.codigoInterno,
      quantidade: p.quantidade,
      estoqueMinimo: p.estoqueMinimo,
    }));
}

// ============================================================
// WIDGETS ACIONÁVEIS (Fase 3) — todas as funções abaixo são leituras
// aditivas, sem alterar nenhuma lógica de negócio existente.
// ============================================================

/** Faturamento (pagamentos PAGO) de N meses, do mais antigo ao atual. */
export async function getFaturamentoPorMeses(
  meses: 3 | 6 | 12 = 6
): Promise<FaturamentoMensal[]> {
  const agora = new Date();
  const inicioPeriodo = startOfMonth(subMonths(agora, meses - 1));

  const pagamentos = await prisma.payment.findMany({
    where: {
      status: "PAGO",
      dataPagamento: { gte: inicioPeriodo, lte: endOfMonth(agora) },
    },
    select: { valorPago: true, dataPagamento: true },
  });

  const buckets: FaturamentoMensal[] = [];
  const chaves: string[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const ref = subMonths(agora, i);
    chaves.push(format(ref, "yyyy-MM"));
    buckets.push({ mes: format(ref, "MMM/yy", { locale: ptBR }), total: 0 });
  }

  for (const p of pagamentos) {
    if (!p.dataPagamento) continue;
    const chave = format(p.dataPagamento, "yyyy-MM");
    const idx = chaves.indexOf(chave);
    if (idx >= 0) buckets[idx].total += Number(p.valorPago);
  }

  return buckets;
}

export type AgendaItem = {
  id: string;
  hora: string;
  clienteNome: string;
  veiculo: string | null;
  servicoDesejado: string | null;
  status: string;
};

/** Agenda do dia: agendamentos de hoje, ordenados por horário. */
export async function getAgendaHoje(): Promise<AgendaItem[]> {
  const agora = new Date();
  const ags = await prisma.appointment.findMany({
    where: {
      dataHora: { gte: startOfDay(agora), lte: endOfDay(agora) },
      status: { notIn: ["CANCELADO", "NAO_COMPARECEU"] },
    },
    orderBy: { dataHora: "asc" },
    take: DASH_LIMIT,
    select: {
      id: true,
      dataHora: true,
      servicoDesejado: true,
      status: true,
      customer: { select: { nome: true } },
      vehicle: { select: { marca: true, modelo: true, placa: true } },
    },
  });

  return ags.map((a) => ({
    id: a.id,
    hora: format(a.dataHora, "HH:mm"),
    clienteNome: a.customer.nome,
    veiculo: a.vehicle
      ? `${a.vehicle.marca} ${a.vehicle.modelo} · ${a.vehicle.placa}`.trim()
      : null,
    servicoDesejado: a.servicoDesejado,
    status: a.status,
  }));
}

export type OSResumo = {
  id: string;
  numero: string;
  status: StatusOS;
  clienteNome: string;
  veiculo: string;
  placa: string;
  previsaoEntrega: Date | null;
  /** Dias em relação a hoje (negativo = atrasada, 0 = hoje). */
  diasParaPrevisao: number | null;
};

function mapOS(o: {
  id: string;
  numero: string;
  status: StatusOS;
  previsaoEntrega: Date | null;
  customer: { nome: string };
  vehicle: { marca: string; modelo: string; placa: string };
}): OSResumo {
  const hoje = startOfDay(new Date());
  let dias: number | null = null;
  if (o.previsaoEntrega) {
    const prev = startOfDay(o.previsaoEntrega);
    dias = Math.round((prev.getTime() - hoje.getTime()) / 86_400_000);
  }
  return {
    id: o.id,
    numero: o.numero,
    status: o.status,
    clienteNome: o.customer.nome,
    veiculo: `${o.vehicle.marca} ${o.vehicle.modelo}`.trim(),
    placa: o.vehicle.placa,
    previsaoEntrega: o.previsaoEntrega,
    diasParaPrevisao: dias,
  };
}

const OS_SELECT = {
  id: true,
  numero: true,
  status: true,
  previsaoEntrega: true,
  customer: { select: { nome: true } },
  vehicle: { select: { marca: true, modelo: true, placa: true } },
} as const;

/** OS com previsão de entrega vencida (atrasadas) e ainda em andamento. */
export async function getOSAtrasadas(mecanicoId?: string): Promise<OSResumo[]> {
  const inicioDia = startOfDay(new Date());
  const ordens = await prisma.serviceOrder.findMany({
    where: {
      previsaoEntrega: { lt: inicioDia, not: null },
      status: { notIn: STATUS_OS_ENCERRADOS },
      ...(mecanicoId ? { mecanicoId } : {}),
    },
    orderBy: { previsaoEntrega: "asc" },
    take: DASH_LIMIT,
    select: OS_SELECT,
  });
  return ordens.map(mapOS);
}

/** Veículos recebidos: agendamentos com status VEICULO_RECEBIDO (a abrir OS). */
export async function getVeiculosRecebidos(): Promise<AgendaItem[]> {
  const ags = await prisma.appointment.findMany({
    where: { status: "VEICULO_RECEBIDO" },
    orderBy: { dataHora: "asc" },
    take: DASH_LIMIT,
    select: {
      id: true,
      dataHora: true,
      servicoDesejado: true,
      status: true,
      customer: { select: { nome: true } },
      vehicle: { select: { marca: true, modelo: true, placa: true } },
    },
  });
  return ags.map((a) => ({
    id: a.id,
    hora: format(a.dataHora, "HH:mm"),
    clienteNome: a.customer.nome,
    veiculo: a.vehicle
      ? `${a.vehicle.marca} ${a.vehicle.modelo} · ${a.vehicle.placa}`.trim()
      : null,
    servicoDesejado: a.servicoDesejado,
    status: a.status,
  }));
}

/** OS aguardando aprovação do cliente. */
export async function getOSAguardandoAprovacao(): Promise<OSResumo[]> {
  const ordens = await prisma.serviceOrder.findMany({
    where: { status: "AGUARDANDO_APROVACAO" },
    orderBy: { updatedAt: "asc" },
    take: DASH_LIMIT,
    select: OS_SELECT,
  });
  return ordens.map(mapOS);
}

/** OS aguardando peças. */
export async function getOSAguardandoPecas(): Promise<OSResumo[]> {
  const ordens = await prisma.serviceOrder.findMany({
    where: { status: "AGUARDANDO_PECAS" },
    orderBy: { updatedAt: "asc" },
    take: DASH_LIMIT,
    select: OS_SELECT,
  });
  return ordens.map(mapOS);
}

/** Entregas previstas para hoje (OS em andamento com previsão hoje). */
export async function getEntregasHoje(): Promise<OSResumo[]> {
  const agora = new Date();
  const ordens = await prisma.serviceOrder.findMany({
    where: {
      previsaoEntrega: { gte: startOfDay(agora), lte: endOfDay(agora) },
      status: { notIn: STATUS_OS_ENCERRADOS },
    },
    orderBy: { previsaoEntrega: "asc" },
    take: DASH_LIMIT,
    select: OS_SELECT,
  });
  return ordens.map(mapOS);
}

export type PagamentoPendente = {
  id: string;
  clienteNome: string;
  osNumero: string | null;
  status: string;
  saldo: number;
};

/** Pagamentos pendentes/parciais com maior saldo em aberto. */
export async function getPagamentosPendentes(): Promise<PagamentoPendente[]> {
  const pagamentos = await prisma.payment.findMany({
    where: { status: { in: ["PENDENTE", "PARCIAL", "VENCIDO"] } },
    select: {
      id: true,
      status: true,
      valorTotal: true,
      valorPago: true,
      serviceOrder: {
        select: { numero: true, customer: { select: { nome: true } } },
      },
    },
  });

  return pagamentos
    .map((p) => ({
      id: p.id,
      clienteNome: p.serviceOrder?.customer.nome ?? "—",
      osNumero: p.serviceOrder?.numero ?? null,
      status: p.status,
      saldo: Number(p.valorTotal) - Number(p.valorPago),
    }))
    .filter((p) => p.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, DASH_LIMIT_SMALL);
}

export type ContaPagarItem = {
  id: string;
  descricao: string;
  fornecedor: string | null;
  valor: number;
  vencimento: Date;
  vencida: boolean;
};

/** Contas a pagar em aberto a vencer nos próximos 7 dias (e vencidas). */
export async function getContasAPagarProximas(): Promise<ContaPagarItem[]> {
  const agora = new Date();
  const limite = endOfDay(addDays(agora, 7));
  const contas = await prisma.accountPayable.findMany({
    where: { pago: false, vencimento: { lte: limite } },
    orderBy: { vencimento: "asc" },
    take: DASH_LIMIT,
    select: {
      id: true,
      descricao: true,
      valor: true,
      vencimento: true,
      supplier: { select: { nome: true } },
    },
  });
  const inicioDia = startOfDay(agora);
  return contas.map((c) => ({
    id: c.id,
    descricao: c.descricao,
    fornecedor: c.supplier?.nome ?? null,
    valor: Number(c.valor),
    vencimento: c.vencimento,
    vencida: startOfDay(c.vencimento) < inicioDia,
  }));
}

export type RevisaoAVencer = {
  id: string;
  clienteNome: string;
  dueDate: Date;
  diasParaVencer: number;
};

/** Avisos de revisão pendentes com vencimento próximo (próximos 30 dias). */
export async function getRevisoesAVencer(): Promise<RevisaoAVencer[]> {
  const agora = new Date();
  const limite = endOfDay(addDays(agora, 30));
  const lembretes = await prisma.reminder.findMany({
    where: {
      tipo: "REVISAO",
      status: "PENDENTE",
      dueDate: { lte: limite },
    },
    orderBy: { dueDate: "asc" },
    take: DASH_LIMIT,
    select: {
      id: true,
      dueDate: true,
      customer: { select: { nome: true } },
    },
  });
  const inicioDia = startOfDay(agora);
  return lembretes.map((r) => ({
    id: r.id,
    clienteNome: r.customer?.nome ?? "—",
    dueDate: r.dueDate,
    diasParaVencer: Math.round(
      (startOfDay(r.dueDate).getTime() - inicioDia.getTime()) / 86_400_000
    ),
  }));
}

export type AtividadeItem = {
  id: string;
  acao: string;
  entidade: string;
  detalhe: string | null;
  usuario: string | null;
  quando: Date;
};

/** Atividade recente do sistema (audit log), mais novos primeiro. */
export async function getAtividadeRecente(): Promise<AtividadeItem[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: DASH_LIMIT,
    select: {
      id: true,
      acao: true,
      entidade: true,
      detalhe: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
  return logs.map((l) => ({
    id: l.id,
    acao: l.acao,
    entidade: l.entidade,
    detalhe: l.detalhe,
    usuario: l.user?.name ?? null,
    quando: l.createdAt,
  }));
}

/** OS atribuídas ao mecânico atual e ainda em andamento. */
export async function getMinhasOS(mecanicoId: string): Promise<OSResumo[]> {
  const ordens = await prisma.serviceOrder.findMany({
    where: {
      mecanicoId,
      status: { notIn: STATUS_OS_ENCERRADOS },
    },
    orderBy: [{ previsaoEntrega: "asc" }, { dataAbertura: "asc" }],
    take: DASH_LIMIT_WIDE,
    select: OS_SELECT,
  });
  return ordens.map(mapOS);
}

export type HorasMecanico = {
  emAberto: number;
  minutosHoje: number;
};

/**
 * Horas do mecânico: apontamentos em aberto (sem fim) e minutos lançados hoje.
 * Leitura agregada simples — não altera nenhum cálculo de horas existente.
 */
export async function getHorasMecanico(
  mecanicoId: string
): Promise<HorasMecanico> {
  const agora = new Date();
  const [emAberto, hoje] = await Promise.all([
    prisma.timeEntry.count({ where: { userId: mecanicoId, fim: null } }),
    prisma.timeEntry.findMany({
      where: {
        userId: mecanicoId,
        inicio: { gte: startOfDay(agora), lte: endOfDay(agora) },
        minutos: { not: null },
      },
      select: { minutos: true },
    }),
  ]);
  return {
    emAberto,
    minutosHoje: hoje.reduce((acc, t) => acc + (t.minutos ?? 0), 0),
  };
}

// ============================================================
// ORQUESTRADOR POR PAPEL
// ============================================================

/** Blocos do dashboard, na ordem de relevância por papel. */
export type DashboardBloco =
  | "agendaHoje"
  | "veiculosRecebidos"
  | "osAtrasadas"
  | "aguardandoAprovacao"
  | "aguardandoPecas"
  | "entregasHoje"
  | "pagamentosPendentes"
  | "contasAPagar"
  | "estoqueCritico"
  | "revisoesAVencer"
  | "faturamento"
  | "atividadeRecente"
  | "minhasOS"
  | "minhasHoras";

/**
 * Define quais blocos cada papel vê e em que ordem (mais relevante primeiro).
 * Administrador vê tudo; os demais veem o subconjunto pertinente à função.
 */
export const BLOCOS_POR_PAPEL: Record<Role, DashboardBloco[]> = {
  ADMINISTRADOR: [
    "agendaHoje",
    "veiculosRecebidos",
    "osAtrasadas",
    "aguardandoAprovacao",
    "aguardandoPecas",
    "entregasHoje",
    "pagamentosPendentes",
    "estoqueCritico",
    "revisoesAVencer",
    "faturamento",
    "atividadeRecente",
  ],
  ATENDENTE: [
    "agendaHoje",
    "veiculosRecebidos",
    "aguardandoAprovacao",
    "osAtrasadas",
    "entregasHoje",
    "revisoesAVencer",
  ],
  MECANICO: ["minhasOS", "minhasHoras", "aguardandoPecas", "osAtrasadas"],
  FINANCEIRO: [
    "pagamentosPendentes",
    "contasAPagar",
    "faturamento",
    "entregasHoje",
  ],
  ESTOQUE: ["estoqueCritico", "aguardandoPecas", "atividadeRecente"],
};
