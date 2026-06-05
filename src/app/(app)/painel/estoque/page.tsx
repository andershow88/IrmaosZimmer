import Link from "next/link";
import {
  Package,
  Plus,
  ArrowLeftRight,
  Wrench,
  AlertTriangle,
  PackageX,
  DollarSign,
  Hourglass,
} from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { formatBRL, formatNumber, formatDateBR } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, nivelEstoque } from "@/components/ui/status-badge";
import { PecasList, type PecaRow } from "@/components/estoque/pecas-list";
import { getPecasParadas } from "@/server/estoque";

export const dynamic = "force-dynamic";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);

  const { q, categoria: categoriaParam } = await searchParams;
  const termo = q?.trim() ?? "";
  const categoriaFiltro = categoriaParam?.trim() ?? "";

  // Lista de peças (filtrada por busca/categoria), métricas globais e categorias
  // disponíveis são consultadas independentemente para que os cards e o filtro
  // reflitam sempre o universo completo, não o recorte exibido na tabela.
  const [parts, allParts, paradas] = await Promise.all([
    prisma.part.findMany({
      where: {
        AND: [
          termo
            ? {
                OR: [
                  { nome: { contains: termo, mode: "insensitive" } },
                  { codigoInterno: { contains: termo, mode: "insensitive" } },
                  { categoria: { contains: termo, mode: "insensitive" } },
                ],
              }
            : {},
          categoriaFiltro ? { categoria: categoriaFiltro } : {},
        ],
      },
      include: { supplier: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.part.findMany({
      select: {
        id: true,
        nome: true,
        codigoInterno: true,
        categoria: true,
        precoCusto: true,
        quantidade: true,
        estoqueMinimo: true,
      },
      orderBy: { nome: "asc" },
    }),
    getPecasParadas(),
  ]);

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

  const totalPecas = allParts.length;

  const categorias = Array.from(
    new Set(
      allParts.map((p) => p.categoria).filter((c): c is string => Boolean(c))
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  // Alertas e valor em estoque consideram o universo completo (independem do recorte).
  const alertas = allParts
    .filter((p) => p.quantidade <= p.estoqueMinimo)
    .sort(
      (a, b) =>
        a.quantidade - a.estoqueMinimo - (b.quantidade - b.estoqueMinimo)
    );

  const valorEstoque = allParts.reduce(
    (acc, p) => acc + Number(p.precoCusto) * p.quantidade,
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Peças cadastradas"
          value={formatNumber(totalPecas)}
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
        <StatCard
          label="Sem giro (+6 meses)"
          value={formatNumber(paradas.pecas.length)}
          icon={Hourglass}
          tone={paradas.pecas.length > 0 ? "warning" : "success"}
          hint={`${formatBRL(paradas.totalValorParado)} parados`}
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
                    <StatusBadge
                      kind="estoque"
                      status={nivelEstoque(p.quantidade, p.estoqueMinimo)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {paradas.pecas.length > 0 && (
        <Card className="mb-6 border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Hourglass className="h-4 w-4" />
              Sem giro há +6 meses
            </CardTitle>
            <p className="mt-1 text-xs text-muted">
              Peças com estoque sem nenhuma saída nos últimos 6 meses —{" "}
              {formatBRL(paradas.totalValorParado)} em capital parado.
            </p>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="divide-y divide-border">
              {paradas.pecas.map((p) => (
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
                    <p className="mt-0.5 text-xs text-muted">
                      {p.ultimaSaida
                        ? `Última saída: ${formatDateBR(p.ultimaSaida)}`
                        : "Nunca teve saída"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div>
                      <p className="text-xs text-muted">Qtd.</p>
                      <p className="text-sm tabular-nums text-foreground">
                        {formatNumber(p.quantidade)}
                      </p>
                    </div>
                    <Badge variant="warning" className="tabular-nums">
                      {formatBRL(p.valorParado)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <PecasList
        pecas={pecas}
        categorias={categorias}
        initialQuery={termo}
        initialCategoria={categoriaFiltro}
      />
    </div>
  );
}
