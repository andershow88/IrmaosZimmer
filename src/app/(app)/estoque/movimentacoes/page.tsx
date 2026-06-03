import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
} from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { formatDateTimeBR, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import {
  MovimentacaoForm,
  type PecaOption,
} from "@/components/estoque/movimentacao-form";

export const dynamic = "force-dynamic";

const TIPO_LABEL = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
} as const;

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

  return (
    <div>
      <PageHeader
        title="Movimentações de estoque"
        description="Registre entradas, saídas e ajustes de inventário."
        icon={ArrowLeftRight}
        action={
          <Link href="/estoque">
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
              {movements.length === 0 ? (
                <EmptyState
                  icon={ArrowLeftRight}
                  title="Nenhuma movimentação registrada"
                  message="Use o formulário ao lado para registrar a primeira movimentação."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Data</TH>
                      <TH>Peça</TH>
                      <TH>Tipo</TH>
                      <TH className="text-right">Qtd.</TH>
                      <TH>Motivo</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {movements.map((m) => (
                      <TR key={m.id}>
                        <TD className="whitespace-nowrap text-sm text-muted">
                          {formatDateTimeBR(m.createdAt)}
                        </TD>
                        <TD>
                          <span className="font-medium text-foreground">
                            {m.part.nome}
                          </span>
                          <span className="block text-xs text-muted">
                            {m.part.codigoInterno}
                          </span>
                        </TD>
                        <TD>
                          {m.tipo === "ENTRADA" && (
                            <Badge variant="success">
                              <ArrowDownToLine className="h-3 w-3" />
                              {TIPO_LABEL.ENTRADA}
                            </Badge>
                          )}
                          {m.tipo === "SAIDA" && (
                            <Badge variant="danger">
                              <ArrowUpFromLine className="h-3 w-3" />
                              {TIPO_LABEL.SAIDA}
                            </Badge>
                          )}
                          {m.tipo === "AJUSTE" && (
                            <Badge variant="info">
                              <SlidersHorizontal className="h-3 w-3" />
                              {TIPO_LABEL.AJUSTE}
                            </Badge>
                          )}
                        </TD>
                        <TD className="text-right tabular-nums font-semibold">
                          {m.tipo === "ENTRADA" ? "+" : m.tipo === "SAIDA" ? "−" : ""}
                          {formatNumber(m.quantidade)}
                        </TD>
                        <TD className="max-w-xs">
                          <span className="text-sm text-muted">
                            {m.motivo ?? "—"}
                          </span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
