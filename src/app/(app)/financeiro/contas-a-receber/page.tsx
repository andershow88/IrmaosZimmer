import { ArrowDownCircle, Check, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import {
  ContasReceberList,
  type ContaReceberRow,
} from "@/components/financeiro/contas-receber-list";
import type {
  CustomerOption,
  OsOption,
} from "@/components/financeiro/conta-receber-form";

export const dynamic = "force-dynamic";

function toInputDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function ContasAReceberPage() {
  const [contas, clientes, ordens] = await Promise.all([
    prisma.accountReceivable.findMany({
      orderBy: [{ recebido: "asc" }, { vencimento: "asc" }],
      include: {
        customer: { select: { nome: true } },
        serviceOrder: { select: { numero: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
      take: 500,
    }),
    prisma.serviceOrder.findMany({
      where: { status: { notIn: ["CANCELADA"] } },
      orderBy: { dataAbertura: "desc" },
      select: {
        id: true,
        numero: true,
        total: true,
        customer: { select: { nome: true } },
      },
      take: 200,
    }),
  ]);

  const rows: ContaReceberRow[] = contas.map((c) => ({
    id: c.id,
    descricao: c.descricao,
    customerId: c.customerId,
    customerNome: c.customer?.nome ?? null,
    serviceOrderId: c.serviceOrderId,
    serviceOrderNumero: c.serviceOrder?.numero ?? null,
    valor: Number(c.valor),
    vencimento: c.vencimento.toISOString(),
    vencimentoInput: toInputDate(c.vencimento),
    recebido: c.recebido,
    dataRecebimento: c.dataRecebimento?.toISOString() ?? null,
  }));

  const opcoesClientes: CustomerOption[] = clientes;
  const opcoesOrdens: OsOption[] = ordens.map((o) => ({
    id: o.id,
    numero: o.numero,
    cliente: o.customer.nome,
    total: Number(o.total),
  }));

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const abertas = rows.filter((r) => !r.recebido);
  const totalAberto = abertas.reduce((acc, r) => acc + r.valor, 0);
  const totalRecebido = rows.filter((r) => r.recebido).reduce((acc, r) => acc + r.valor, 0);
  const vencidas = abertas.filter((r) => new Date(r.vencimento) < hoje);
  const totalVencido = vencidas.reduce((acc, r) => acc + r.valor, 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Em aberto"
          value={formatBRL(totalAberto)}
          icon={ArrowDownCircle}
          tone="warning"
          hint={`${abertas.length} conta(s)`}
        />
        <StatCard
          label="Vencidas"
          value={formatBRL(totalVencido)}
          icon={AlertTriangle}
          tone="danger"
          hint={`${vencidas.length} conta(s)`}
        />
        <StatCard
          label="Recebidas"
          value={formatBRL(totalRecebido)}
          icon={Check}
          tone="success"
          hint="Total já recebido"
        />
      </div>

      <ContasReceberList
        contas={rows}
        clientes={opcoesClientes}
        ordens={opcoesOrdens}
      />
    </div>
  );
}
