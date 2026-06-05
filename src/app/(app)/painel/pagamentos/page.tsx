import Link from "next/link";
import { CreditCard, Plus, Wallet, Clock, CircleDollarSign } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions-server";
import { formatBRL } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import {
  PagamentosTable,
  type PagamentoRow,
} from "@/components/pagamentos/pagamentos-table";
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
  await requirePageRole(["FINANCEIRO", "ADMINISTRADOR"]);
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

  const rows: PagamentoRow[] = pagamentos.map((p) => {
    const valorTotal = Number(p.valorTotal);
    const valorPago = Number(p.valorPago);
    return {
      id: p.id,
      numero: p.serviceOrder.numero,
      cliente: p.serviceOrder.customer.nome,
      veiculo: p.serviceOrder.vehicle
        ? `${p.serviceOrder.vehicle.marca} ${p.serviceOrder.vehicle.modelo}`
        : "—",
      placa: p.serviceOrder.vehicle?.placa ?? null,
      valorTotal,
      valorPago,
      saldo: Math.max(valorTotal - valorPago, 0),
      forma: p.forma,
      status: p.status,
      dataPagamento: p.dataPagamento ? p.dataPagamento.toISOString() : null,
    };
  });

  return (
    <div>
      <PageHeader
        title="Pagamentos"
        description="Controle de recebimentos e saldos das ordens de serviço."
        icon={CreditCard}
        action={
          <Link href="/painel/pagamentos/novo">
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

      <PagamentosTable pagamentos={rows} initialQuery={q} />
    </div>
  );
}
