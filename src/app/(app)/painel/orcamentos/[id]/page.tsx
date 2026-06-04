import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft, User, Car, Calendar, ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrcamento } from "@/components/orcamentos/get-orcamento";
import { ItensTable } from "@/components/orcamentos/itens-table";
import { OrcamentoActions } from "@/components/orcamentos/orcamento-actions";
import { ExplicarIAWrapper } from "@/components/orcamentos/explicar-ia-wrapper";

export const dynamic = "force-dynamic";

export default async function OrcamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const orcamento = await getOrcamento(id);
  if (!orcamento) notFound();

  const subtotal = orcamento.items.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <div>
      <PageHeader
        title={`Orçamento ${orcamento.numero}`}
        description="Detalhes, itens e ações do orçamento."
        icon={FileText}
        action={
          <Link href="/painel/orcamentos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Resumo */}
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge kind="orcamento" status={orcamento.status} />
                {orcamento.serviceOrderId && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <ClipboardList className="h-3.5 w-3.5" />
                    OS vinculada
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Total</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatBRL(orcamento.total)}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Cliente e veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente e veículo</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Cliente</p>
                  <p className="font-medium">{orcamento.cliente.nome}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Car className="mt-0.5 h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Veículo</p>
                  <p className="font-medium">
                    {orcamento.veiculo.marca} {orcamento.veiculo.modelo} •{" "}
                    {orcamento.veiculo.placa}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Criado em</p>
                  <p className="font-medium">{formatDateBR(orcamento.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Validade</p>
                  <p className="font-medium">
                    {orcamento.validade ? formatDateBR(orcamento.validade) : "—"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <CardTitle>Itens</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <ItensTable items={orcamento.items} />
              <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-foreground">
                    {formatBRL(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Desconto</span>
                  <span className="tabular-nums text-foreground">
                    - {formatBRL(orcamento.desconto)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatBRL(orcamento.total)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {orcamento.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {orcamento.observacoes}
                </p>
              </CardBody>
            </Card>
          )}

          {/* IA */}
          <Card>
            <CardHeader>
              <CardTitle>Assistente</CardTitle>
            </CardHeader>
            <CardBody>
              <ExplicarIAWrapper quoteId={orcamento.id} />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar de ações */}
        <div className="lg:col-span-1">
          <OrcamentoActions orcamento={orcamento} />
        </div>
      </div>
    </div>
  );
}
