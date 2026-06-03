import { ArrowUpCircle, Check, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import {
  ContasPagarList,
  type ContaPagarRow,
} from "@/components/financeiro/contas-pagar-list";
import type { SupplierOption } from "@/components/financeiro/conta-pagar-form";

export const dynamic = "force-dynamic";

function toInputDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function ContasAPagarPage() {
  const [contas, fornecedores] = await Promise.all([
    prisma.accountPayable.findMany({
      orderBy: [{ pago: "asc" }, { vencimento: "asc" }],
      include: { supplier: { select: { nome: true } } },
    }),
    prisma.supplier.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const rows: ContaPagarRow[] = contas.map((c) => ({
    id: c.id,
    descricao: c.descricao,
    supplierId: c.supplierId,
    supplierNome: c.supplier?.nome ?? null,
    valor: Number(c.valor),
    vencimento: c.vencimento.toISOString(),
    vencimentoInput: toInputDate(c.vencimento),
    pago: c.pago,
    dataPagamento: c.dataPagamento?.toISOString() ?? null,
  }));

  const opcoesFornecedores: SupplierOption[] = fornecedores;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const abertas = rows.filter((r) => !r.pago);
  const totalAberto = abertas.reduce((acc, r) => acc + r.valor, 0);
  const totalPago = rows.filter((r) => r.pago).reduce((acc, r) => acc + r.valor, 0);
  const vencidas = abertas.filter((r) => new Date(r.vencimento) < hoje);
  const totalVencido = vencidas.reduce((acc, r) => acc + r.valor, 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Em aberto"
          value={formatBRL(totalAberto)}
          icon={ArrowUpCircle}
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
          label="Pagas"
          value={formatBRL(totalPago)}
          icon={Check}
          tone="success"
          hint="Total já quitado"
        />
      </div>

      <ContasPagarList contas={rows} fornecedores={opcoesFornecedores} />
    </div>
  );
}
