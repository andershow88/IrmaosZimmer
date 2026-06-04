import { prisma } from "@/lib/db";

/**
 * Consultas (somente leitura) para os relatórios da oficina.
 * Nenhuma função aqui escreve no banco.
 */

// ------------------------------------------------------------
// Helpers de período
// ------------------------------------------------------------

/** Início do mês (00:00) deslocado por `offset` meses a partir de hoje. */
function startOfMonthOffset(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0, 0);
}

const MESES_ABREV = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function rotuloMesAno(d: Date): string {
  return `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

/** Início do dia (00:00) `dias` dias antes de hoje. */
function inicioDiasAtras(dias: number): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  d.setDate(d.getDate() - dias);
  return d;
}

/** Conta dias úteis (segunda a sexta) entre `inicio` (incl.) e `fim` (incl.). */
function contarDiasUteis(inicio: Date, fim: Date): number {
  let dias = 0;
  const cursor = new Date(
    inicio.getFullYear(),
    inicio.getMonth(),
    inicio.getDate()
  );
  const limite = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  while (cursor <= limite) {
    const dow = cursor.getDay(); // 0 = domingo, 6 = sábado
    if (dow !== 0 && dow !== 6) dias++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

// ------------------------------------------------------------
// Tipos de retorno (serializáveis para Client Components)
// ------------------------------------------------------------

export type ReceitaMensal = { periodo: string; valor: number };
export type StatusDistribuicao = { status: string; label: string; total: number };
export type RankingItem = { nome: string; quantidade: number; valor: number };
export type ClienteFrequente = { nome: string; ordens: number };
export type EstoqueBaixoItem = {
  id: string;
  nome: string;
  codigoInterno: string;
  quantidade: number;
  estoqueMinimo: number;
};
export type ProdutividadeMecanico = { nome: string; ordens: number };
export type OrcamentoComparativo = { aprovados: number; rejeitados: number };

/**
 * Produtividade em horas (minutos) por mecânico no período:
 * - disponiveis: capacidade (cargaHorariaDiaria * dias úteis * 60).
 * - executadas: soma de TimeEntry.minutos no período.
 * - vendidas: soma de tempoEstimadoMin dos itens de serviço das OS
 *   concluídas/entregues atribuídas ao mecânico no período.
 */
export type ProdutividadeHoras = {
  nome: string;
  disponiveis: number;
  executadas: number;
  vendidas: number;
};

/** Leitura agregada de gargalo a partir das métricas de horas. */
export type GargaloHoras = {
  /** Eficiência = vendidas / executadas (proporção). */
  eficiencia: number;
  /** Ociosidade = (disponíveis - executadas) / disponíveis (proporção). */
  ociosidade: number;
  totalDisponiveis: number;
  totalExecutadas: number;
  totalVendidas: number;
  /** Texto curto em pt-BR explicando onde está a falha. */
  diagnostico: string;
};

/** Margem agregada por mês (receita de mão de obra + peças - custo das peças). */
export type MargemMensal = {
  periodo: string;
  receita: number;
  custo: number;
  margem: number;
};

/** Produtividade + comissão por mecânico, baseada na soma das OS atribuídas. */
export type ComissaoMecanico = {
  nome: string;
  ordens: number;
  faturamento: number;
  comissaoPercent: number;
  comissao: number;
};

export type RelatoriosData = {
  receitaPorMes: ReceitaMensal[];
  receitaTotalPeriodo: number;
  osPorStatus: StatusDistribuicao[];
  osTotal: number;
  servicosMaisVendidos: RankingItem[];
  pecasMaisUsadas: RankingItem[];
  clientesMaisFrequentes: ClienteFrequente[];
  pagamentosPendentes: { total: number; quantidade: number };
  estoqueBaixo: EstoqueBaixoItem[];
  produtividadeMecanicos: ProdutividadeMecanico[];
  orcamentos: OrcamentoComparativo;
  margemPorMes: MargemMensal[];
  margemTotalPeriodo: number;
  comissaoMecanicos: ComissaoMecanico[];
  produtividadeHoras: ProdutividadeHoras[];
  produtividadeHorasDias: number;
  gargaloHoras: GargaloHoras | null;
};

const STATUS_OS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  AGUARDANDO_DIAGNOSTICO: "Aguard. diagnóstico",
  AGUARDANDO_APROVACAO: "Aguard. aprovação",
  APROVADA: "Aprovada",
  EM_EXECUCAO: "Em execução",
  AGUARDANDO_PECAS: "Aguard. peças",
  CONCLUIDA: "Concluída",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

// ------------------------------------------------------------
// Receita por período (Payment.valorPago, status PAGO)
// ------------------------------------------------------------

/** Receita por mês nos últimos `meses` meses (default 6), considerando pagamentos PAGO. */
export async function getReceitaPorMes(meses = 6): Promise<{
  series: ReceitaMensal[];
  total: number;
}> {
  const inicio = startOfMonthOffset(-(meses - 1));

  const pagamentos = await prisma.payment.findMany({
    where: {
      status: "PAGO",
      dataPagamento: { gte: inicio },
    },
    select: { valorPago: true, dataPagamento: true },
  });

  // Inicializa todos os meses do período com zero.
  const buckets = new Map<string, { periodo: string; valor: number; ordem: number }>();
  for (let i = 0; i < meses; i++) {
    const d = startOfMonthOffset(-(meses - 1) + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, { periodo: rotuloMesAno(d), valor: 0, ordem: i });
  }

  let total = 0;
  for (const p of pagamentos) {
    if (!p.dataPagamento) continue;
    const d = new Date(p.dataPagamento);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.get(key);
    const valor = Number(p.valorPago);
    if (bucket) bucket.valor += valor;
    total += valor;
  }

  const series = [...buckets.values()]
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ periodo, valor }) => ({ periodo, valor }));

  return { series, total };
}

// ------------------------------------------------------------
// OS por status
// ------------------------------------------------------------

export async function getOsPorStatus(): Promise<{
  distribuicao: StatusDistribuicao[];
  total: number;
}> {
  const grupos = await prisma.serviceOrder.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const distribuicao = grupos
    .map((g) => ({
      status: g.status as string,
      label: STATUS_OS_LABELS[g.status] ?? (g.status as string),
      total: g._count._all,
    }))
    .sort((a, b) => b.total - a.total);

  const total = distribuicao.reduce((acc, d) => acc + d.total, 0);
  return { distribuicao, total };
}

// ------------------------------------------------------------
// Serviços mais vendidos (ServiceOrderItem tipo SERVICO)
// ------------------------------------------------------------

export async function getServicosMaisVendidos(limite = 8): Promise<RankingItem[]> {
  const itens = await prisma.serviceOrderItem.findMany({
    where: { tipo: "SERVICO" },
    select: { descricao: true, serviceId: true, quantidade: true, subtotal: true },
  });

  const mapa = new Map<string, RankingItem>();
  for (const item of itens) {
    const chave = item.serviceId ?? `desc:${item.descricao}`;
    const atual = mapa.get(chave) ?? { nome: item.descricao, quantidade: 0, valor: 0 };
    atual.quantidade += item.quantidade;
    atual.valor += Number(item.subtotal);
    mapa.set(chave, atual);
  }

  return [...mapa.values()]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limite);
}

// ------------------------------------------------------------
// Peças mais usadas (ServiceOrderItem tipo PECA)
// ------------------------------------------------------------

export async function getPecasMaisUsadas(limite = 8): Promise<RankingItem[]> {
  const itens = await prisma.serviceOrderItem.findMany({
    where: { tipo: "PECA" },
    select: { descricao: true, partId: true, quantidade: true, subtotal: true },
  });

  const mapa = new Map<string, RankingItem>();
  for (const item of itens) {
    const chave = item.partId ?? `desc:${item.descricao}`;
    const atual = mapa.get(chave) ?? { nome: item.descricao, quantidade: 0, valor: 0 };
    atual.quantidade += item.quantidade;
    atual.valor += Number(item.subtotal);
    mapa.set(chave, atual);
  }

  return [...mapa.values()]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limite);
}

// ------------------------------------------------------------
// Clientes mais frequentes (nº de ordens de serviço)
// ------------------------------------------------------------

export async function getClientesMaisFrequentes(limite = 8): Promise<ClienteFrequente[]> {
  const grupos = await prisma.serviceOrder.groupBy({
    by: ["customerId"],
    _count: { _all: true },
    orderBy: { _count: { customerId: "desc" } },
    take: limite,
  });

  if (grupos.length === 0) return [];

  const clientes = await prisma.customer.findMany({
    where: { id: { in: grupos.map((g) => g.customerId) } },
    select: { id: true, nome: true },
  });
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));

  return grupos.map((g) => ({
    nome: nomePorId.get(g.customerId) ?? "Cliente removido",
    ordens: g._count._all,
  }));
}

// ------------------------------------------------------------
// Pagamentos pendentes (PENDENTE, PARCIAL, VENCIDO)
// ------------------------------------------------------------

export async function getPagamentosPendentes(): Promise<{
  total: number;
  quantidade: number;
}> {
  const pagamentos = await prisma.payment.findMany({
    where: { status: { in: ["PENDENTE", "PARCIAL", "VENCIDO"] } },
    select: { valorTotal: true, valorPago: true },
  });

  const total = pagamentos.reduce(
    (acc, p) => acc + (Number(p.valorTotal) - Number(p.valorPago)),
    0
  );
  return { total: Math.max(total, 0), quantidade: pagamentos.length };
}

// ------------------------------------------------------------
// Estoque baixo (quantidade <= estoqueMinimo)
// ------------------------------------------------------------

export async function getEstoqueBaixo(limite = 20): Promise<EstoqueBaixoItem[]> {
  // Postgres não permite comparar duas colunas direto no Prisma; filtramos no app.
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
    .slice(0, limite);
}

// ------------------------------------------------------------
// Produtividade por mecânico (nº de OS por mecanicoId)
// ------------------------------------------------------------

export async function getProdutividadeMecanicos(limite = 10): Promise<ProdutividadeMecanico[]> {
  const grupos = await prisma.serviceOrder.groupBy({
    by: ["mecanicoId"],
    where: { mecanicoId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { mecanicoId: "desc" } },
    take: limite,
  });

  if (grupos.length === 0) return [];

  const ids = grupos
    .map((g) => g.mecanicoId)
    .filter((id): id is string => id !== null);

  const mecanicos = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nomePorId = new Map(mecanicos.map((m) => [m.id, m.name]));

  return grupos.map((g) => ({
    nome: g.mecanicoId ? nomePorId.get(g.mecanicoId) ?? "—" : "Sem mecânico",
    ordens: g._count._all,
  }));
}

// ------------------------------------------------------------
// Orçamentos: aprovados vs rejeitados
// ------------------------------------------------------------

export async function getOrcamentosComparativo(): Promise<OrcamentoComparativo> {
  const [aprovados, rejeitados] = await Promise.all([
    prisma.quote.count({ where: { status: "APROVADO" } }),
    prisma.quote.count({ where: { status: "REJEITADO" } }),
  ]);
  return { aprovados, rejeitados };
}

// ------------------------------------------------------------
// Margem por OS / por período
// Margem da OS = (valorMaoObra + Σ preço de venda das peças)
//              - Σ custoUnitario das peças.
// Agrupamos por mês de abertura da OS para o gráfico.
// ------------------------------------------------------------

export async function getMargemPorMes(meses = 6): Promise<{
  series: MargemMensal[];
  total: number;
}> {
  const inicio = startOfMonthOffset(-(meses - 1));

  const ordens = await prisma.serviceOrder.findMany({
    where: {
      dataAbertura: { gte: inicio },
      status: { notIn: ["CANCELADA"] },
    },
    select: {
      dataAbertura: true,
      valorMaoObra: true,
      items: {
        where: { tipo: "PECA" },
        select: { quantidade: true, precoUnitario: true, custoUnitario: true },
      },
    },
  });

  const buckets = new Map<
    string,
    { periodo: string; receita: number; custo: number; ordem: number }
  >();
  for (let i = 0; i < meses; i++) {
    const d = startOfMonthOffset(-(meses - 1) + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
      periodo: rotuloMesAno(d),
      receita: 0,
      custo: 0,
      ordem: i,
    });
  }

  for (const os of ordens) {
    const d = new Date(os.dataAbertura);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) continue;

    let receitaPecas = 0;
    let custoPecas = 0;
    for (const item of os.items) {
      receitaPecas += Number(item.precoUnitario) * item.quantidade;
      custoPecas += Number(item.custoUnitario ?? 0) * item.quantidade;
    }
    bucket.receita += Number(os.valorMaoObra) + receitaPecas;
    bucket.custo += custoPecas;
  }

  const series = [...buckets.values()]
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ periodo, receita, custo }) => ({
      periodo,
      receita,
      custo,
      margem: receita - custo,
    }));

  const total = series.reduce((acc, s) => acc + s.margem, 0);
  return { series, total };
}

// ------------------------------------------------------------
// Comissão por mecânico
// Faturamento por mecânico = soma do `total` das OS atribuídas (exceto canceladas).
// Comissão = faturamento * (User.comissaoPercent / 100).
// ------------------------------------------------------------

export async function getComissaoMecanicos(limite = 10): Promise<ComissaoMecanico[]> {
  const grupos = await prisma.serviceOrder.groupBy({
    by: ["mecanicoId"],
    where: { mecanicoId: { not: null }, status: { notIn: ["CANCELADA"] } },
    _count: { _all: true },
    _sum: { total: true },
  });

  if (grupos.length === 0) return [];

  const ids = grupos
    .map((g) => g.mecanicoId)
    .filter((id): id is string => id !== null);

  const mecanicos = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, comissaoPercent: true },
  });
  const porId = new Map(mecanicos.map((m) => [m.id, m]));

  return grupos
    .map((g) => {
      const m = g.mecanicoId ? porId.get(g.mecanicoId) : undefined;
      const faturamento = Number(g._sum.total ?? 0);
      const comissaoPercent = Number(m?.comissaoPercent ?? 0);
      return {
        nome: m?.name ?? "Sem mecânico",
        ordens: g._count._all,
        faturamento,
        comissaoPercent,
        comissao: faturamento * (comissaoPercent / 100),
      };
    })
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, limite);
}

// ------------------------------------------------------------
// Produtividade em horas: disponíveis x executadas x vendidas
// Período em dias (default 30). Só mecânicos (role MECANICO).
// DISPONÍVEIS = cargaHorariaDiaria(h) * dias úteis(seg-sex) * 60.
// EXECUTADAS  = Σ TimeEntry.minutos no período.
// VENDIDAS    = Σ tempoEstimadoMin dos itens SERVICO das OS
//               concluídas/entregues atribuídas ao mecânico no período.
// ------------------------------------------------------------

export async function getProdutividadeHoras(dias = 30): Promise<{
  porMecanico: ProdutividadeHoras[];
  gargalo: GargaloHoras | null;
}> {
  const inicio = inicioDiasAtras(dias);
  const fim = new Date();
  const diasUteis = contarDiasUteis(inicio, fim);

  // Mecânicos ativos — aparecem mesmo sem atividade no período.
  const mecanicos = await prisma.user.findMany({
    where: { role: "MECANICO", ativo: true },
    select: { id: true, name: true, cargaHorariaDiaria: true },
    orderBy: { name: "asc" },
  });

  if (mecanicos.length === 0) {
    return { porMecanico: [], gargalo: null };
  }

  const ids = mecanicos.map((m) => m.id);

  const [tempos, itensServico] = await Promise.all([
    // Horas executadas: TimeEntry com início no período.
    prisma.timeEntry.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, inicio: { gte: inicio } },
      _sum: { minutos: true },
    }),
    // Horas vendidas: itens de serviço das OS concluídas/entregues do mecânico.
    prisma.serviceOrderItem.findMany({
      where: {
        tipo: "SERVICO",
        tempoEstimadoMin: { not: null },
        serviceOrder: {
          mecanicoId: { in: ids },
          status: { in: ["CONCLUIDA", "ENTREGUE"] },
          dataAbertura: { gte: inicio },
        },
      },
      select: {
        tempoEstimadoMin: true,
        serviceOrder: { select: { mecanicoId: true } },
      },
    }),
  ]);

  const executadasPorId = new Map<string, number>();
  for (const t of tempos) {
    executadasPorId.set(t.userId, t._sum.minutos ?? 0);
  }

  const vendidasPorId = new Map<string, number>();
  for (const item of itensServico) {
    const mid = item.serviceOrder.mecanicoId;
    if (!mid) continue;
    vendidasPorId.set(
      mid,
      (vendidasPorId.get(mid) ?? 0) + (item.tempoEstimadoMin ?? 0)
    );
  }

  const porMecanico: ProdutividadeHoras[] = mecanicos.map((m) => ({
    nome: m.name,
    disponiveis: m.cargaHorariaDiaria * diasUteis * 60,
    executadas: executadasPorId.get(m.id) ?? 0,
    vendidas: vendidasPorId.get(m.id) ?? 0,
  }));

  const totalDisponiveis = porMecanico.reduce((a, m) => a + m.disponiveis, 0);
  const totalExecutadas = porMecanico.reduce((a, m) => a + m.executadas, 0);
  const totalVendidas = porMecanico.reduce((a, m) => a + m.vendidas, 0);

  const eficiencia = totalExecutadas > 0 ? totalVendidas / totalExecutadas : 0;
  const ociosidade =
    totalDisponiveis > 0
      ? Math.max(0, (totalDisponiveis - totalExecutadas) / totalDisponiveis)
      : 0;

  const diagnostico = montarDiagnosticoGargalo({
    totalDisponiveis,
    totalExecutadas,
    totalVendidas,
    eficiencia,
    ociosidade,
  });

  return {
    porMecanico,
    gargalo: {
      eficiencia,
      ociosidade,
      totalDisponiveis,
      totalExecutadas,
      totalVendidas,
      diagnostico,
    },
  };
}

/** Gera um texto curto (pt-BR) indicando onde está o principal gargalo. */
function montarDiagnosticoGargalo(m: {
  totalDisponiveis: number;
  totalExecutadas: number;
  totalVendidas: number;
  eficiencia: number;
  ociosidade: number;
}): string {
  if (m.totalDisponiveis === 0) {
    return "Sem capacidade cadastrada para os mecânicos no período.";
  }
  if (m.totalExecutadas === 0) {
    return "Nenhuma hora foi apontada no período: registre os tempos de execução para medir a produtividade.";
  }

  const efPct = Math.round(m.eficiencia * 100);
  const ocPct = Math.round(m.ociosidade * 100);

  // Ociosidade alta = tempo disponível mal aproveitado (gargalo na ocupação).
  // Eficiência baixa = executa mais do que vende (gargalo na execução/orçamento).
  const ociosidadeAlta = m.ociosidade >= 0.25;
  const eficienciaBaixa = m.eficiencia < 0.85;

  if (ociosidadeAlta && eficienciaBaixa) {
    return `Gargalo duplo: ociosidade de ${ocPct}% (capacidade subutilizada) e eficiência de apenas ${efPct}% (executa mais do que vende). Reveja a ocupação e o tempo estimado dos serviços.`;
  }
  if (ociosidadeAlta) {
    return `Principal gargalo: ociosidade de ${ocPct}% — boa parte das horas disponíveis não é apontada em execução. Foco em ocupar melhor a equipe.`;
  }
  if (eficienciaBaixa) {
    return `Principal gargalo: eficiência de ${efPct}% — os serviços levam mais tempo do que o vendido/estimado. Revise os tempos estimados ou a produtividade na execução.`;
  }
  return `Operação saudável: eficiência de ${efPct}% e ociosidade de ${ocPct}%. Capacidade bem aproveitada e execução alinhada ao vendido.`;
}

// ------------------------------------------------------------
// Agregador único usado pela página
// ------------------------------------------------------------

const PRODUTIVIDADE_HORAS_DIAS = 30;

export async function getRelatoriosData(meses = 6): Promise<RelatoriosData> {
  const [
    receita,
    os,
    servicosMaisVendidos,
    pecasMaisUsadas,
    clientesMaisFrequentes,
    pagamentosPendentes,
    estoqueBaixo,
    produtividadeMecanicos,
    orcamentos,
    margem,
    comissaoMecanicos,
    produtividadeHoras,
  ] = await Promise.all([
    getReceitaPorMes(meses),
    getOsPorStatus(),
    getServicosMaisVendidos(),
    getPecasMaisUsadas(),
    getClientesMaisFrequentes(),
    getPagamentosPendentes(),
    getEstoqueBaixo(),
    getProdutividadeMecanicos(),
    getOrcamentosComparativo(),
    getMargemPorMes(meses),
    getComissaoMecanicos(),
    getProdutividadeHoras(PRODUTIVIDADE_HORAS_DIAS),
  ]);

  return {
    receitaPorMes: receita.series,
    receitaTotalPeriodo: receita.total,
    osPorStatus: os.distribuicao,
    osTotal: os.total,
    servicosMaisVendidos,
    pecasMaisUsadas,
    clientesMaisFrequentes,
    pagamentosPendentes,
    estoqueBaixo,
    produtividadeMecanicos,
    orcamentos,
    margemPorMes: margem.series,
    margemTotalPeriodo: margem.total,
    comissaoMecanicos,
    produtividadeHoras: produtividadeHoras.porMecanico,
    produtividadeHorasDias: PRODUTIVIDADE_HORAS_DIAS,
    gargaloHoras: produtividadeHoras.gargalo,
  };
}
