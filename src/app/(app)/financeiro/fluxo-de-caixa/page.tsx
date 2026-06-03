import {
  Activity,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportCard } from "@/components/relatorios/report-card";
import { PeriodoSelect } from "@/components/relatorios/periodo-select";
import { FluxoChart } from "@/components/financeiro/fluxo-chart";
import { getFluxoCaixa } from "@/server/financeiro";

export const dynamic = "force-dynamic";

const MESES_VALIDOS = [3, 6, 12];

export default async function FluxoDeCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ meses?: string }>;
}) {
  const sp = await searchParams;
  const mesesParam = Number(sp.meses);
  const meses = MESES_VALIDOS.includes(mesesParam) ? mesesParam : 6;

  const fluxo = await getFluxoCaixa(meses);
  const temFluxo = fluxo.series.some((s) => s.entradas > 0 || s.saidas > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <PeriodoSelect valor={meses} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Entradas no período"
          value={formatBRL(fluxo.totalEntradas)}
          icon={TrendingUp}
          tone="success"
          hint="Pagamentos pagos + recebimentos"
        />
        <StatCard
          label="Saídas no período"
          value={formatBRL(fluxo.totalSaidas)}
          icon={TrendingDown}
          tone="danger"
          hint="Contas a pagar quitadas"
        />
        <StatCard
          label="Resultado"
          value={formatBRL(fluxo.saldo)}
          icon={Scale}
          tone={fluxo.saldo >= 0 ? "success" : "danger"}
          hint="Entradas − saídas"
        />
      </div>

      <ReportCard
        title="Fluxo de caixa por mês"
        icon={Activity}
        description={`Entradas vs. saídas nos últimos ${meses} meses`}
      >
        {temFluxo ? (
          <FluxoChart data={fluxo.series} />
        ) : (
          <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border bg-surface/30">
            <p className="text-sm text-muted">Sem movimentação financeira no período.</p>
          </div>
        )}
      </ReportCard>

      {temFluxo ? (
        <Table>
          <THead>
            <TR>
              <TH>Período</TH>
              <TH className="text-right">Entradas</TH>
              <TH className="text-right">Saídas</TH>
              <TH className="text-right">Saldo</TH>
            </TR>
          </THead>
          <TBody>
            {fluxo.series.map((s) => (
              <TR key={s.periodo}>
                <TD className="font-medium">{s.periodo}</TD>
                <TD className="text-right tabular-nums text-success">
                  {formatBRL(s.entradas)}
                </TD>
                <TD className="text-right tabular-nums text-danger">
                  {formatBRL(s.saidas)}
                </TD>
                <TD
                  className={
                    "text-right tabular-nums font-medium " +
                    (s.saldo >= 0 ? "text-foreground" : "text-danger")
                  }
                >
                  {formatBRL(s.saldo)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState
          icon={Activity}
          title="Sem dados de fluxo de caixa"
          message="Registre pagamentos, recebimentos e contas pagas para visualizar o fluxo."
        />
      )}
    </div>
  );
}
