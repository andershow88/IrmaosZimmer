import Link from "next/link";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/relatorios/report-card";
import { FluxoChart } from "@/components/financeiro/fluxo-chart";
import { getFluxoCaixa } from "@/server/financeiro";
import { calcularSaldoSessao } from "@/lib/financeiro-calc";

export const dynamic = "force-dynamic";

export default async function FinanceiroOverviewPage() {
  const [pagaveis, recebiveis, sessaoAberta, fluxo] = await Promise.all([
    prisma.accountPayable.findMany({
      where: { pago: false },
      select: { valor: true },
    }),
    prisma.accountReceivable.findMany({
      where: { recebido: false },
      select: { valor: true },
    }),
    prisma.cashSession.findFirst({
      where: { status: "ABERTO" },
      include: { movements: { select: { tipo: true, valor: true } } },
    }),
    getFluxoCaixa(6),
  ]);

  const totalAPagar = pagaveis.reduce((acc, c) => acc + Number(c.valor), 0);
  const totalAReceber = recebiveis.reduce((acc, c) => acc + Number(c.valor), 0);
  const saldoCaixa = sessaoAberta
    ? calcularSaldoSessao(Number(sessaoAberta.valorAbertura), sessaoAberta.movements)
    : null;

  const temFluxo = fluxo.series.some((s) => s.entradas > 0 || s.saidas > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="A pagar (em aberto)"
          value={formatBRL(totalAPagar)}
          icon={ArrowUpCircle}
          tone="danger"
          hint={`${pagaveis.length} conta(s)`}
        />
        <StatCard
          label="A receber (em aberto)"
          value={formatBRL(totalAReceber)}
          icon={ArrowDownCircle}
          tone="success"
          hint={`${recebiveis.length} conta(s)`}
        />
        <StatCard
          label="Saldo previsto"
          value={formatBRL(totalAReceber - totalAPagar)}
          icon={Scale}
          tone="info"
          hint="A receber − a pagar"
        />
        <StatCard
          label="Caixa atual"
          value={saldoCaixa !== null ? formatBRL(saldoCaixa) : "Fechado"}
          icon={Wallet}
          tone="accent"
          hint={saldoCaixa !== null ? "Sessão aberta" : "Nenhum caixa aberto"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Entradas (6 meses)"
          value={formatBRL(fluxo.totalEntradas)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Saídas (6 meses)"
          value={formatBRL(fluxo.totalSaidas)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          label="Resultado (6 meses)"
          value={formatBRL(fluxo.saldo)}
          icon={Activity}
          tone={fluxo.saldo >= 0 ? "success" : "danger"}
        />
      </div>

      <ReportCard
        title="Fluxo de caixa"
        icon={Activity}
        description="Entradas (pagamentos pagos + recebimentos) vs. saídas (contas pagas) — últimos 6 meses"
      >
        {temFluxo ? (
          <FluxoChart data={fluxo.series} />
        ) : (
          <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border bg-surface/30">
            <p className="text-sm text-muted">Sem movimentação financeira no período.</p>
          </div>
        )}
      </ReportCard>

      <div className="flex flex-wrap gap-2">
        <Link href="/painel/financeiro/contas-a-pagar">
          <Button variant="outline" size="sm">
            <ArrowUpCircle className="h-4 w-4" />
            Contas a pagar
          </Button>
        </Link>
        <Link href="/painel/financeiro/contas-a-receber">
          <Button variant="outline" size="sm">
            <ArrowDownCircle className="h-4 w-4" />
            Contas a receber
          </Button>
        </Link>
        <Link href="/painel/financeiro/caixa">
          <Button variant="outline" size="sm">
            <Wallet className="h-4 w-4" />
            Abrir/fechar caixa
          </Button>
        </Link>
      </div>
    </div>
  );
}
