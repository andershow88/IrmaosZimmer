import Link from "next/link";
import { CreditCard, Plus, Wallet, Clock, CircleDollarSign } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PagamentosFiltros } from "@/components/pagamentos/pagamentos-filtros";
import { FORMA_LABELS } from "@/components/pagamentos/constants";
import type { FormaPagamento, StatusPagamento, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_VALUES: StatusPagamento[] = [
  "PENDENTE",
  "PARCIAL",
  "PAGO",
  "VENCIDO",
  "CANCELADO",
];
const FORMA_VALUES = Object.keys(FORMA_LABELS) as FormaPagamento[];

type SearchParams = Promise<{ q?: string; status?: string; forma?: string }>;

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const statusFiltro = STATUS_VALUES.includes(sp.status as StatusPagamento)
    ? (sp.status as StatusPagamento)
    : undefined;
  const formaFiltro = FORMA_VALUES.includes(sp.forma as FormaPagamento)
    ? (sp.forma as FormaPagamento)
    : undefined;

  const where: Prisma.PaymentWhereInput = {
    ...(statusFiltro ? { status: statusFiltro } : {}),
    ...(formaFiltro ? { forma: formaFiltro } : {}),
    ...(q
      ? {
          serviceOrder: {
            OR: [
              { numero: { contains: q, mode: "insensitive" } },
              { customer: { nome: { contains: q, mode: "insensitive" } } },
            ],
          },
        }
      : {}),
  };

  const [pagamentos, agregados] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        serviceOrder: {
          select: {
            numero: true,
            customer: { select: { nome: true } },
            vehicle: { select: { marca: true, modelo: true, placa: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PENDENTE", "PARCIAL", "VENCIDO"] } },
      select: { valorTotal: true, valorPago: true },
    }),
  ]);

  const totalPendente = agregados.reduce(
    (acc, p) => acc + Math.max(Number(p.valorTotal) - Number(p.valorPago), 0),
    0
  );
  const totalRecebido = pagamentos
    .filter((p) => p.status !== "CANCELADO")
    .reduce((acc, p) => acc + Number(p.valorPago), 0);
  const qtdAbertos = agregados.length;

  return (
    <div>
      <PageHeader
        title="Pagamentos"
        description="Controle de recebimentos e saldos das ordens de serviço."
        icon={CreditCard}
        action={
          <Link href="/pagamentos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo pagamento
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo pendente"
          value={formatBRL(totalPendente)}
          icon={Clock}
          tone="warning"
          hint="A receber (pendente, parcial e vencido)"
        />
        <StatCard
          label="Recebido (filtro atual)"
          value={formatBRL(totalRecebido)}
          icon={Wallet}
          tone="success"
          hint="Soma dos valores pagos listados"
        />
        <StatCard
          label="Em aberto"
          value={qtdAbertos}
          icon={CircleDollarSign}
          tone="info"
          hint="Pagamentos não quitados"
        />
      </div>

      <PagamentosFiltros />

      {pagamentos.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum pagamento encontrado"
          message="Ajuste os filtros ou registre um novo pagamento para uma ordem de serviço."
          action={
            <Link href="/pagamentos/novo">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo pagamento
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>OS / Cliente</TH>
              <TH>Veículo</TH>
              <TH className="text-right">Valor total</TH>
              <TH className="text-right">Valor pago</TH>
              <TH className="text-right">Saldo</TH>
              <TH>Forma</TH>
              <TH>Status</TH>
              <TH>Data</TH>
            </TR>
          </THead>
          <TBody>
            {pagamentos.map((p) => {
              const saldo = Math.max(Number(p.valorTotal) - Number(p.valorPago), 0);
              const veiculo = p.serviceOrder.vehicle
                ? `${p.serviceOrder.vehicle.marca} ${p.serviceOrder.vehicle.modelo}`
                : "—";
              return (
                <TR key={p.id}>
                  <TD>
                    <Link
                      href={`/pagamentos/${p.id}`}
                      className="font-semibold text-foreground hover:text-accent"
                    >
                      {p.serviceOrder.numero}
                    </Link>
                    <p className="text-xs text-muted">{p.serviceOrder.customer.nome}</p>
                  </TD>
                  <TD>
                    <span className="text-sm">{veiculo}</span>
                    {p.serviceOrder.vehicle?.placa && (
                      <p className="text-xs text-muted">{p.serviceOrder.vehicle.placa}</p>
                    )}
                  </TD>
                  <TD className="text-right tabular-nums">{formatBRL(p.valorTotal)}</TD>
                  <TD className="text-right tabular-nums">{formatBRL(p.valorPago)}</TD>
                  <TD className="text-right tabular-nums font-medium">{formatBRL(saldo)}</TD>
                  <TD className="text-sm">{FORMA_LABELS[p.forma]}</TD>
                  <TD>
                    <StatusBadge kind="pagamento" status={p.status} />
                  </TD>
                  <TD className="text-sm text-muted">
                    {p.dataPagamento ? formatDateBR(p.dataPagamento) : "—"}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
