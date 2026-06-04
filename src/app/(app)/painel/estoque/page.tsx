import Link from "next/link";
import {
  Package,
  Plus,
  ArrowLeftRight,
  Wrench,
  AlertTriangle,
  PackageX,
  DollarSign,
} from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { formatBRL, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PecasList, type PecaRow } from "@/components/estoque/pecas-list";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);

  const parts = await prisma.part.findMany({
    include: { supplier: { select: { nome: true } } },
    orderBy: { nome: "asc" },
  });

  const pecas: PecaRow[] = parts.map((p) => ({
    id: p.id,
    nome: p.nome,
    codigoInterno: p.codigoInterno,
    categoria: p.categoria,
    fornecedorNome: p.supplier?.nome ?? null,
    precoCusto: Number(p.precoCusto),
    precoVenda: Number(p.precoVenda),
    quantidade: p.quantidade,
    estoqueMinimo: p.estoqueMinimo,
    localizacao: p.localizacao,
  }));

  const categorias = Array.from(
    new Set(pecas.map((p) => p.categoria).filter((c): c is string => Boolean(c)))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const alertas = pecas
    .filter((p) => p.quantidade <= p.estoqueMinimo)
    .sort((a, b) => a.quantidade - a.estoqueMinimo - (b.quantidade - b.estoqueMinimo));

  const valorEstoque = pecas.reduce(
    (acc, p) => acc + p.precoCusto * p.quantidade,
    0
  );

  return (
    <div>
      <PageHeader
        title="Peças & Estoque"
        description="Cadastro de peças, preços e controle de estoque."
        icon={Package}
        action={
          <div className="flex items-center gap-2">
            <Link href="/painel/estoque/movimentacoes">
              <Button variant="secondary">
                <ArrowLeftRight className="h-4 w-4" />
                Movimentações
              </Button>
            </Link>
            <Link href="/painel/estoque/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Nova peça
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Peças cadastradas"
          value={formatNumber(pecas.length)}
          icon={Package}
          tone="accent"
        />
        <StatCard
          label="Estoque baixo"
          value={formatNumber(alertas.length)}
          icon={PackageX}
          tone={alertas.length > 0 ? "danger" : "success"}
          hint="No mínimo ou abaixo"
        />
        <StatCard
          label="Valor em estoque"
          value={formatBRL(valorEstoque)}
          icon={DollarSign}
          tone="info"
          hint="Custo × quantidade"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Atalhos:</span>
        <Link href="/painel/servicos">
          <Badge variant="outline" className="cursor-pointer hover:bg-surface">
            <Wrench className="h-3 w-3" />
            Serviços
          </Badge>
        </Link>
        <Link href="/painel/estoque/movimentacoes">
          <Badge variant="outline" className="cursor-pointer hover:bg-surface">
            <ArrowLeftRight className="h-3 w-3" />
            Movimentações
          </Badge>
        </Link>
      </div>

      {alertas.length > 0 && (
        <Card className="mb-6 border-danger/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-4 w-4" />
              Alertas de estoque baixo
            </CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="divide-y divide-border">
              {alertas.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/painel/estoque/${p.id}/editar`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {p.nome}
                    </Link>
                    <span className="ml-2 text-xs text-muted">{p.codigoInterno}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm tabular-nums text-foreground">
                      {formatNumber(p.quantidade)}
                    </span>
                    <span className="text-xs text-muted">
                      / mín. {formatNumber(p.estoqueMinimo)}
                    </span>
                    <Badge variant={p.quantidade === 0 ? "danger" : "warning"}>
                      {p.quantidade === 0 ? "Esgotado" : "Estoque baixo"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <PecasList pecas={pecas} categorias={categorias} />
    </div>
  );
}
