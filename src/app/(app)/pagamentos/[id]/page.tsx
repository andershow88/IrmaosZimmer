import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ImprimirRecibo } from "@/components/pagamentos/imprimir-recibo";
import { ExcluirPagamento } from "@/components/pagamentos/excluir-pagamento";
import { FORMA_LABELS } from "@/components/pagamentos/constants";

export const dynamic = "force-dynamic";

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const pagamento = await prisma.payment.findUnique({
    where: { id },
    include: {
      serviceOrder: {
        include: {
          customer: true,
          vehicle: true,
          items: true,
        },
      },
    },
  });

  if (!pagamento) notFound();

  const os = pagamento.serviceOrder;
  const cliente = os.customer;
  const veiculo = os.vehicle;
  const valorTotal = Number(pagamento.valorTotal);
  const valorPago = Number(pagamento.valorPago);
  const saldo = Math.max(valorTotal - valorPago, 0);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Barra de ações — oculta na impressão */}
      <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
        <Link href="/pagamentos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex gap-2">
          <ImprimirRecibo />
          <Link href={`/pagamentos/${pagamento.id}/editar`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <ExcluirPagamento id={pagamento.id} redirectTo="/pagamentos" />
        </div>
      </div>

      {/* Recibo */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm print:border-0 print:shadow-none print:p-0">
        {/* Cabeçalho da oficina */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent print:hidden">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Irmãos Zimmer</h1>
              <p className="text-sm text-muted">Oficina mecânica</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recibo</p>
            <p className="text-sm font-medium text-foreground">OS {os.numero}</p>
            <p className="text-xs text-muted">
              {pagamento.dataPagamento
                ? formatDateBR(pagamento.dataPagamento)
                : formatDateBR(pagamento.createdAt)}
            </p>
          </div>
        </div>

        {/* Dados cliente / veículo */}
        <div className="grid grid-cols-1 gap-6 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cliente</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{cliente.nome}</p>
            {cliente.cpfCnpj && (
              <p className="text-xs text-muted">{cliente.cpfCnpj}</p>
            )}
            {cliente.telefone && (
              <p className="text-xs text-muted">{cliente.telefone}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Veículo</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {veiculo.marca} {veiculo.modelo}
              {veiculo.ano ? ` ${veiculo.ano}` : ""}
            </p>
            <p className="text-xs text-muted">Placa {veiculo.placa}</p>
          </div>
        </div>

        {/* Itens da OS */}
        {os.items.length > 0 ? (
          <div className="pb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Itens da ordem de serviço
            </p>
            <Table>
              <THead>
                <TR>
                  <TH>Descrição</TH>
                  <TH className="text-center">Qtd.</TH>
                  <TH className="text-right">Unitário</TH>
                  <TH className="text-right">Subtotal</TH>
                </TR>
              </THead>
              <TBody>
                {os.items.map((item) => (
                  <TR key={item.id}>
                    <TD>{item.descricao}</TD>
                    <TD className="text-center tabular-nums">{item.quantidade}</TD>
                    <TD className="text-right tabular-nums">{formatBRL(item.precoUnitario)}</TD>
                    <TD className="text-right tabular-nums">{formatBRL(item.subtotal)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : null}

        {/* Valores */}
        <div className="border-t border-border pt-5">
          <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Mão de obra</span>
              <span className="tabular-nums">{formatBRL(os.valorMaoObra)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Peças</span>
              <span className="tabular-nums">{formatBRL(os.valorPecas)}</span>
            </div>
            {Number(os.desconto) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted">Desconto</span>
                <span className="tabular-nums">- {formatBRL(os.desconto)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
              <span>Valor total</span>
              <span className="tabular-nums">{formatBRL(valorTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-success">
              <span>Valor pago</span>
              <span className="tabular-nums">{formatBRL(valorPago)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
              <span>Saldo</span>
              <span className="tabular-nums">{formatBRL(saldo)}</span>
            </div>
          </div>
        </div>

        {/* Forma / status / observações */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-5 text-sm">
          <div>
            <span className="text-muted">Forma: </span>
            <span className="font-medium">{FORMA_LABELS[pagamento.forma]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Status:</span>
            <StatusBadge kind="pagamento" status={pagamento.status} />
          </div>
        </div>

        {pagamento.observacoes && (
          <div className="mt-4 rounded-xl border border-border bg-surface/40 p-3 text-sm print:border-0 print:bg-transparent print:p-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Observações
            </p>
            <p className="mt-1 whitespace-pre-wrap text-foreground">{pagamento.observacoes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted">
          Obrigado pela preferência! — Irmãos Zimmer
        </p>
      </div>
    </div>
  );
}
