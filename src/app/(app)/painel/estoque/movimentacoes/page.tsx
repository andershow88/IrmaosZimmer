import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, History } from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MovimentacaoForm,
  type PecaOption,
} from "@/components/estoque/movimentacao-form";
import {
  MovimentacoesTable,
  type MovimentacaoRow,
} from "@/components/estoque/movimentacoes-table";

export const dynamic = "force-dynamic";

export default async function MovimentacoesPage() {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);

  const [parts, movements] = await Promise.all([
    prisma.part.findMany({
      select: { id: true, nome: true, codigoInterno: true, quantidade: true },
      orderBy: { nome: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      include: { part: { select: { nome: true, codigoInterno: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const pecas: PecaOption[] = parts.map((p) => ({
    id: p.id,
    nome: p.nome,
    codigoInterno: p.codigoInterno,
    quantidade: p.quantidade,
  }));

  const movimentacoes: MovimentacaoRow[] = movements.map((m) => ({
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    pecaNome: m.part.nome,
    pecaCodigo: m.part.codigoInterno,
    tipo: m.tipo,
    quantidade: m.quantidade,
    motivo: m.motivo,
  }));

  return (
    <div>
      <PageHeader
        title="Movimentações de estoque"
        description="Registre entradas, saídas e ajustes de inventário."
        icon={ArrowLeftRight}
        action={
          <Link href="/painel/estoque">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao estoque
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MovimentacaoForm pecas={pecas} />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted" />
                Histórico de movimentações
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <MovimentacoesTable movimentacoes={movimentacoes} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
