import "server-only";
import { prisma } from "@/lib/db";
import { formatBRL, formatDateBR } from "@/lib/utils";

/**
 * Reúne um contexto resumido e atual da oficina a partir do banco de dados,
 * para alimentar o assistente de IA (ou montar respostas no modo mock).
 *
 * Mantém os volumes pequenos (limites e contagens) para não estourar o
 * contexto do modelo nem sobrecarregar o banco.
 */
export type WorkshopContext = {
  totals: {
    clientes: number;
    veiculos: number;
    osAbertas: number;
    osTotal: number;
    pecas: number;
    pecasBaixoEstoque: number;
    pagamentosPendentes: number;
  };
  valorAReceber: number;
  osRecentes: {
    numero: string;
    status: string;
    cliente: string;
    veiculo: string;
    total: number;
    data: string;
  }[];
  pecasCriticas: {
    nome: string;
    codigo: string;
    quantidade: number;
    estoqueMinimo: number;
  }[];
};

export async function getWorkshopContext(): Promise<WorkshopContext> {
  const [
    clientes,
    veiculos,
    osAbertas,
    osTotal,
    pecas,
    pagamentosPendentes,
    osRecentesRaw,
    pecasCriticasRaw,
    pagamentosPendentesAgg,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.serviceOrder.count({
      where: {
        status: {
          notIn: ["ENTREGUE", "CANCELADA", "CONCLUIDA"],
        },
      },
    }),
    prisma.serviceOrder.count(),
    prisma.part.count(),
    prisma.payment.count({
      where: { status: { in: ["PENDENTE", "PARCIAL", "VENCIDO"] } },
    }),
    prisma.serviceOrder.findMany({
      orderBy: { dataAbertura: "desc" },
      take: 8,
      select: {
        numero: true,
        status: true,
        total: true,
        dataAbertura: true,
        customer: { select: { nome: true } },
        vehicle: { select: { marca: true, modelo: true, placa: true } },
      },
    }),
    prisma.part.findMany({
      where: { estoqueMinimo: { gt: 0 } },
      orderBy: { quantidade: "asc" },
      take: 200,
      select: {
        nome: true,
        codigoInterno: true,
        quantidade: true,
        estoqueMinimo: true,
      },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ["PENDENTE", "PARCIAL", "VENCIDO"] } },
      _sum: { valorTotal: true, valorPago: true },
    }),
  ]);

  const criticas = pecasCriticasRaw.filter(
    (p) => p.quantidade <= p.estoqueMinimo
  );

  const somaTotal = Number(pagamentosPendentesAgg._sum.valorTotal ?? 0);
  const somaPago = Number(pagamentosPendentesAgg._sum.valorPago ?? 0);

  return {
    totals: {
      clientes,
      veiculos,
      osAbertas,
      osTotal,
      pecas,
      pecasBaixoEstoque: criticas.length,
      pagamentosPendentes,
    },
    valorAReceber: Math.max(0, somaTotal - somaPago),
    osRecentes: osRecentesRaw.map((os) => ({
      numero: os.numero,
      status: os.status,
      cliente: os.customer.nome,
      veiculo: `${os.vehicle.marca} ${os.vehicle.modelo} (${os.vehicle.placa})`,
      total: Number(os.total),
      data: formatDateBR(os.dataAbertura),
    })),
    pecasCriticas: criticas.slice(0, 10).map((p) => ({
      nome: p.nome,
      codigo: p.codigoInterno,
      quantidade: p.quantidade,
      estoqueMinimo: p.estoqueMinimo,
    })),
  };
}

/**
 * Busca livre nos dados da oficina (clientes, veículos, OS, peças) a partir
 * de um termo digitado pelo usuário. Usada pela ação rápida "Buscar em dados".
 */
export type SearchHit = {
  tipo: "Cliente" | "Veículo" | "Ordem de serviço" | "Peça";
  titulo: string;
  detalhe: string;
};

export async function searchWorkshopData(term: string): Promise<SearchHit[]> {
  const q = term.trim();
  if (!q) return [];

  const insensitive = { contains: q, mode: "insensitive" as const };

  const [clientes, veiculos, ordens, pecas] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [{ nome: insensitive }, { cpfCnpj: insensitive }, { telefone: insensitive }],
      },
      take: 5,
      select: { nome: true, telefone: true, cidade: true, cpfCnpj: true },
    }),
    prisma.vehicle.findMany({
      where: {
        OR: [{ placa: insensitive }, { marca: insensitive }, { modelo: insensitive }],
      },
      take: 5,
      select: {
        placa: true,
        marca: true,
        modelo: true,
        ano: true,
        customer: { select: { nome: true } },
      },
    }),
    prisma.serviceOrder.findMany({
      where: {
        OR: [
          { numero: insensitive },
          { customer: { nome: insensitive } },
          { vehicle: { placa: insensitive } },
        ],
      },
      take: 5,
      orderBy: { dataAbertura: "desc" },
      select: {
        numero: true,
        status: true,
        total: true,
        customer: { select: { nome: true } },
        vehicle: { select: { marca: true, modelo: true, placa: true } },
      },
    }),
    prisma.part.findMany({
      where: {
        OR: [{ nome: insensitive }, { codigoInterno: insensitive }, { categoria: insensitive }],
      },
      take: 5,
      select: {
        nome: true,
        codigoInterno: true,
        quantidade: true,
        precoVenda: true,
      },
    }),
  ]);

  const hits: SearchHit[] = [];

  for (const c of clientes) {
    hits.push({
      tipo: "Cliente",
      titulo: c.nome,
      detalhe: [c.telefone, c.cidade, c.cpfCnpj].filter(Boolean).join(" · ") || "Sem dados adicionais",
    });
  }
  for (const v of veiculos) {
    hits.push({
      tipo: "Veículo",
      titulo: `${v.marca} ${v.modelo}${v.ano ? ` ${v.ano}` : ""} — ${v.placa}`,
      detalhe: `Cliente: ${v.customer.nome}`,
    });
  }
  for (const o of ordens) {
    hits.push({
      tipo: "Ordem de serviço",
      titulo: `OS ${o.numero} — ${o.customer.nome}`,
      detalhe: `${o.vehicle.marca} ${o.vehicle.modelo} (${o.vehicle.placa}) · ${o.status} · ${formatBRL(
        o.total
      )}`,
    });
  }
  for (const p of pecas) {
    hits.push({
      tipo: "Peça",
      titulo: `${p.nome} (${p.codigoInterno})`,
      detalhe: `Estoque: ${p.quantidade} un · ${formatBRL(p.precoVenda)}`,
    });
  }

  return hits;
}
