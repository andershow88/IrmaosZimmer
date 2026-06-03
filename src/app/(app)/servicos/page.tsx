import Link from "next/link";
import { Plus, Wrench, Pencil } from "lucide-react";
import type { CategoriaServico, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions-server";
import { formatBRL } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ServicoFiltros } from "@/components/servicos/servico-filtros";
import { ServicoToggle } from "@/components/servicos/servico-toggle";
import { ServicoDelete } from "@/components/servicos/servico-delete";
import { CATEGORIA_LABELS, formatTempoEstimado } from "@/components/servicos/categorias";

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
  });

  const temFiltro = Boolean(q || categoria || ativo !== undefined);

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços da oficina com preços e tempos estimados."
        icon={Wrench}
        action={
          <Link href="/servicos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo serviço
            </Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardBody>
          <ServicoFiltros />
        </CardBody>
      </Card>

      {servicos.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={temFiltro ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
          message={
            temFiltro
              ? "Ajuste os filtros ou a busca para ver outros serviços."
              : "Cadastre o primeiro serviço do catálogo para começar."
          }
          action={
            !temFiltro ? (
              <Link href="/servicos/novo">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Novo serviço
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>Categoria</TH>
              <TH className="text-right">Preço padrão</TH>
              <TH>Tempo estimado</TH>
              <TH>Situação</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {servicos.map((s) => (
              <TR key={s.id}>
                <TD>
                  <div className="font-medium text-foreground">{s.nome}</div>
                  {s.descricao && (
                    <div className="mt-0.5 line-clamp-1 max-w-md text-xs text-muted">
                      {s.descricao}
                    </div>
                  )}
                </TD>
                <TD>
                  <Badge variant="outline">{CATEGORIA_LABELS[s.categoria]}</Badge>
                </TD>
                <TD className="text-right font-semibold tabular-nums">
                  {formatBRL(s.precoPadrao)}
                </TD>
                <TD className="text-muted">
                  {formatTempoEstimado(s.tempoEstimadoMin)}
                </TD>
                <TD>
                  {s.ativo ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="default">Inativo</Badge>
                  )}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <ServicoToggle id={s.id} ativo={s.ativo} />
                    <Link href={`/servicos/${s.id}/editar`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${s.nome}`}
                        title="Editar"
                        className="text-muted hover:text-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <ServicoDelete id={s.id} nome={s.nome} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
