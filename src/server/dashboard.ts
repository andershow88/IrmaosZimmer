import { prisma } from "@/lib/db";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { StatusOS } from "@prisma/client";

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
    take: 5,
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

/** Peças com estoque igual ou abaixo do mínimo. */
export async function getAlertasEstoqueBaixo(): Promise<AlertaEstoque[]> {
  // Prisma não compara dois campos em where; filtramos em memória sobre peças com mínimo definido.
  const pecas = await prisma.part.findMany({
    where: { estoqueMinimo: { gt: 0 } },
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
    .filter((p) => p.quantidade <= p.estoqueMinimo)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      codigoInterno: p.codigoInterno,
      quantidade: p.quantidade,
      estoqueMinimo: p.estoqueMinimo,
    }));
}
