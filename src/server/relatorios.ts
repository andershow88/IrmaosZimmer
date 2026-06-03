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
// Agregador único usado pela página
// ------------------------------------------------------------

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
  };
}
