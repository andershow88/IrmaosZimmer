import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import type { CategoriaServico, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions-server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  ServicosTable,
  type ServicoRow,
} from "@/components/servicos/servicos-table";
import { CATEGORIA_LABELS } from "@/components/servicos/categorias";

export const dynamic = "force-dynamic";

const CATEGORIA_KEYS = Object.keys(CATEGORIA_LABELS) as CategoriaServico[];

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; ativo?: string }>;
}) {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const categoria = CATEGORIA_KEYS.includes(sp.categoria as CategoriaServico)
    ? (sp.categoria as CategoriaServico)
    : undefined;
  const ativo =
    sp.ativo === "true" ? true : sp.ativo === "false" ? false : undefined;

  const where: Prisma.ServiceWhereInput = {
    ...(q ? { nome: { contains: q, mode: "insensitive" } } : {}),
    ...(categoria ? { categoria } : {}),
    ...(ativo !== undefined ? { ativo } : {}),
  };

  const servicos = await prisma.service.findMany({
    where,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      descricao: true,
      categoria: true,
      precoPadrao: true,
      tempoEstimadoMin: true,
      ativo: true,
      _count: { select: { osItems: true, quoteItems: true } },
    },
  });

  const rows: ServicoRow[] = servicos.map((s) => ({
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    categoria: s.categoria,
    precoPadrao: Number(s.precoPadrao),
    tempoEstimadoMin: s.tempoEstimadoMin,
    ativo: s.ativo,
    osItems: s._count.osItems,
    quoteItems: s._count.quoteItems,
  }));

  const temFiltro = Boolean(q || categoria || ativo !== undefined);

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços da oficina com preços e tempos estimados."
        icon={Wrench}
        action={
          <Link href="/painel/servicos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo serviço
            </Button>
          </Link>
        }
      />

      <ServicosTable servicos={rows} temFiltro={temFiltro} />
    </div>
  );
}
