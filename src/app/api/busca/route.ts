import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Quantidade máxima de itens devolvidos por grupo. */
const LIMITE = 5;

type ItemBusca = {
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

type GrupoBusca = {
  tipo: string;
  label: string;
  itens: ItemBusca[];
};

/**
 * Busca global interna do painel (Command Palette / busca rápida).
 *
 * GET /api/busca?q=<termo>
 *
 * Protegida por sessão. Procura, em paralelo, por:
 *  - clientes (nome / cpfCnpj / telefone)
 *  - veículos (placa / modelo)
 *  - ordens de serviço (número)
 *  - orçamentos (número)
 *  - peças (código interno / nome)
 *  - fornecedores (nome)
 *
 * Devolve { grupos: [{ tipo, label, itens:[{ id, titulo, subtitulo, href }] }] }.
 * Apenas grupos com resultados são incluídos. Com q vazio, devolve grupos: [].
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return Response.json({ grupos: [] });
  }

  // "insensitive" cobre maiúsculas/minúsculas; placas/códigos costumam ser
  // armazenados em caixa alta, mas o contains insensível resolve ambos.
  const contains = { contains: q, mode: "insensitive" as const };

  try {
    const [clientes, veiculos, ordens, orcamentos, pecas, fornecedores] =
      await Promise.all([
        prisma.customer.findMany({
          where: {
            OR: [
              { nome: contains },
              { cpfCnpj: contains },
              { telefone: contains },
            ],
          },
          select: { id: true, nome: true, cpfCnpj: true, telefone: true },
          orderBy: { nome: "asc" },
          take: LIMITE,
        }),
        prisma.vehicle.findMany({
          where: {
            OR: [{ placa: contains }, { modelo: contains }],
          },
          select: {
            id: true,
            placa: true,
            marca: true,
            modelo: true,
            customer: { select: { nome: true } },
          },
          orderBy: { placa: "asc" },
          take: LIMITE,
        }),
        prisma.serviceOrder.findMany({
          where: { numero: contains },
          select: {
            id: true,
            numero: true,
            status: true,
            customer: { select: { nome: true } },
          },
          orderBy: { dataAbertura: "desc" },
          take: LIMITE,
        }),
        prisma.quote.findMany({
          where: { numero: contains },
          select: {
            id: true,
            numero: true,
            status: true,
            customer: { select: { nome: true } },
          },
          orderBy: { createdAt: "desc" },
          take: LIMITE,
        }),
        prisma.part.findMany({
          where: {
            OR: [{ codigoInterno: contains }, { nome: contains }],
          },
          select: {
            id: true,
            nome: true,
            codigoInterno: true,
            quantidade: true,
          },
          orderBy: { nome: "asc" },
          take: LIMITE,
        }),
        prisma.supplier.findMany({
          where: { nome: contains },
          select: { id: true, nome: true, contato: true, telefone: true },
          orderBy: { nome: "asc" },
          take: LIMITE,
        }),
      ]);

    const grupos: GrupoBusca[] = [];

    if (clientes.length) {
      grupos.push({
        tipo: "cliente",
        label: "Clientes",
        itens: clientes.map((c) => ({
          id: c.id,
          titulo: c.nome,
          subtitulo:
            [c.cpfCnpj, c.telefone].filter(Boolean).join(" · ") || "Cliente",
          href: `/painel/clientes/${c.id}`,
        })),
      });
    }

    if (veiculos.length) {
      grupos.push({
        tipo: "veiculo",
        label: "Veículos",
        itens: veiculos.map((v) => ({
          id: v.id,
          titulo: `${v.placa} — ${[v.marca, v.modelo].filter(Boolean).join(" ")}`.trim(),
          subtitulo: v.customer?.nome ?? "Veículo",
          href: `/painel/veiculos/${v.id}`,
        })),
      });
    }

    if (ordens.length) {
      grupos.push({
        tipo: "os",
        label: "Ordens de Serviço",
        itens: ordens.map((o) => ({
          id: o.id,
          titulo: `OS ${o.numero}`,
          subtitulo:
            [o.customer?.nome, o.status].filter(Boolean).join(" · ") || "OS",
          href: `/painel/ordens-servico/${o.id}`,
        })),
      });
    }

    if (orcamentos.length) {
      grupos.push({
        tipo: "orcamento",
        label: "Orçamentos",
        itens: orcamentos.map((o) => ({
          id: o.id,
          titulo: `Orçamento ${o.numero}`,
          subtitulo:
            [o.customer?.nome, o.status].filter(Boolean).join(" · ") ||
            "Orçamento",
          href: `/painel/orcamentos/${o.id}`,
        })),
      });
    }

    if (pecas.length) {
      grupos.push({
        tipo: "peca",
        label: "Peças e Estoque",
        itens: pecas.map((p) => ({
          id: p.id,
          titulo: p.nome,
          subtitulo:
            [p.codigoInterno, `${p.quantidade} em estoque`]
              .filter(Boolean)
              .join(" · ") || "Peça",
          href: `/painel/estoque/${p.id}`,
        })),
      });
    }

    if (fornecedores.length) {
      grupos.push({
        tipo: "fornecedor",
        label: "Fornecedores",
        itens: fornecedores.map((f) => ({
          id: f.id,
          titulo: f.nome,
          subtitulo:
            [f.contato, f.telefone].filter(Boolean).join(" · ") || "Fornecedor",
          href: `/painel/fornecedores/${f.id}`,
        })),
      });
    }

    return Response.json({ grupos });
  } catch {
    return Response.json(
      { error: "Falha na busca. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
