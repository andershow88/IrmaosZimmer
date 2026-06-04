import {
  BarChart3,
  PieChart as PieChartIcon,
  Wrench,
  Package,
  Users,
  AlertTriangle,
  UserCog,
  FileCheck2,
  TrendingUp,
  Percent,
  Coins,
  Timer,
} from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { formatBRL, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getRelatoriosData } from "@/server/relatorios";
import { ReportCard } from "@/components/relatorios/report-card";
import { ReceitaChart } from "@/components/relatorios/receita-chart";
import { OsStatusChart } from "@/components/relatorios/os-status-chart";
import { RankingChart } from "@/components/relatorios/ranking-chart";
import { ProdutividadeChart } from "@/components/relatorios/produtividade-chart";
import { OrcamentosChart } from "@/components/relatorios/orcamentos-chart";
import { PeriodoSelect } from "@/components/relatorios/periodo-select";
import { MargemChart } from "@/components/relatorios/margem-chart";
import { ComissaoChart } from "@/components/relatorios/comissao-chart";
import { ProdutividadeHorasChart } from "@/components/relatorios/produtividade-horas-chart";
import { ExportButton } from "@/components/relatorios/export-button";
import { CHART_COLORS } from "@/components/relatorios/chart-theme";

export const dynamic = "force-dynamic";

const MESES_VALIDOS = [3, 6, 12];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ meses?: string }>;
}) {
  await requirePageRole(["FINANCEIRO", "ADMINISTRADOR"]);

  const sp = await searchParams;
  const mesesParam = Number(sp.meses);
  const meses = MESES_VALIDOS.includes(mesesParam) ? mesesParam : 6;

  const data = await getRelatoriosData(meses);

  const semDados =
    data.osTotal === 0 &&
    data.receitaTotalPeriodo === 0 &&
    data.servicosMaisVendidos.length === 0 &&
    data.pecasMaisUsadas.length === 0 &&
    data.clientesMaisFrequentes.length === 0 &&
    data.estoqueBaixo.length === 0 &&
    data.produtividadeMecanicos.length === 0;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Indicadores e tendências da oficina."
        icon={BarChart3}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodoSelect valor={meses} />
            <ExportButton meses={meses} />
          </div>
        }
      />

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita no período"
          value={formatBRL(data.receitaTotalPeriodo)}
          icon={TrendingUp}
          tone="success"
          hint={`Últimos ${meses} meses (pagamentos pagos)`}
        />
        <StatCard
          label="Ordens de serviço"
          value={formatNumber(data.osTotal)}
          icon={Wrench}
          tone="accent"
          hint="Total cadastradas"
        />
        <StatCard
          label="Margem no período"
          value={formatBRL(data.margemTotalPeriodo)}
          icon={Coins}
          tone="info"
          hint="Mão de obra + peças − custo das peças"
        />
        <StatCard
          label="Peças em falta"
          value={formatNumber(data.estoqueBaixo.length)}
          icon={AlertTriangle}
          tone="danger"
          hint="Abaixo do estoque mínimo"
        />
      </div>

      {semDados ? (
        <div className="mt-6">
          <EmptyState
            icon={BarChart3}
            title="Ainda não há dados para os relatórios"
            message="Cadastre ordens de serviço, pagamentos e movimentações para visualizar os indicadores."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Receita por período */}
          <ReportCard
            title="Receita por período"
            icon={TrendingUp}
            description={`Pagamentos pagos nos últimos ${meses} meses`}
            className="lg:col-span-2"
          >
            {data.receitaPorMes.some((m) => m.valor > 0) ? (
              <ReceitaChart data={data.receitaPorMes} />
            ) : (
              <SemDadosGrafico texto="Nenhum pagamento pago no período." />
            )}
          </ReportCard>

          {/* Margem por período */}
          <ReportCard
            title="Margem por período"
            icon={Percent}
            description="Receita (mão de obra + peças) menos o custo das peças, por mês de abertura da OS"
            className="lg:col-span-2"
          >
            {data.margemPorMes.some((m) => m.receita > 0 || m.custo > 0) ? (
              <MargemChart data={data.margemPorMes} />
            ) : (
              <SemDadosGrafico texto="Sem ordens de serviço no período para calcular a margem." />
            )}
          </ReportCard>

          {/* Comissão por mecânico */}
          <ReportCard
            title="Comissão por mecânico"
            icon={Coins}
            description="Faturamento das OS atribuídas × percentual de comissão do mecânico"
            className="lg:col-span-2"
          >
            {data.comissaoMecanicos.length > 0 ? (
              <ComissaoChart data={data.comissaoMecanicos} />
            ) : (
              <SemDadosGrafico texto="Nenhuma OS atribuída a mecânicos no período." />
            )}
          </ReportCard>

          {/* Produtividade em horas: disponíveis x executadas x vendidas */}
          <ReportCard
            title="Produtividade em horas"
            icon={Timer}
            description={`Horas disponíveis, executadas e vendidas por mecânico — últimos ${data.produtividadeHorasDias} dias`}
            className="lg:col-span-2"
          >
            {data.produtividadeHoras.length > 0 ? (
              <ProdutividadeHorasChart
                data={data.produtividadeHoras}
                gargalo={data.gargaloHoras}
              />
            ) : (
              <SemDadosGrafico texto="Nenhum mecânico ativo cadastrado para medir produtividade." />
            )}
          </ReportCard>

          {/* OS por status */}
          <ReportCard
            title="Ordens por status"
            icon={PieChartIcon}
            description="Distribuição atual das OS"
          >
            {data.osPorStatus.length > 0 ? (
              <OsStatusChart data={data.osPorStatus} />
            ) : (
              <SemDadosGrafico texto="Nenhuma ordem de serviço cadastrada." />
            )}
          </ReportCard>

          {/* Orçamentos aprovados vs rejeitados */}
          <ReportCard
            title="Orçamentos aprovados vs. rejeitados"
            icon={FileCheck2}
            description="Comparativo de decisões dos clientes"
          >
            {data.orcamentos.aprovados + data.orcamentos.rejeitados > 0 ? (
              <OrcamentosChart data={data.orcamentos} />
            ) : (
              <SemDadosGrafico texto="Nenhum orçamento aprovado ou rejeitado." />
            )}
          </ReportCard>

          {/* Serviços mais vendidos */}
          <ReportCard
            title="Serviços mais vendidos"
            icon={Wrench}
            description="Por quantidade em ordens de serviço"
          >
            {data.servicosMaisVendidos.length > 0 ? (
              <RankingChart
                data={data.servicosMaisVendidos}
                color={CHART_COLORS.accent}
                unidadeLabel="Quantidade"
              />
            ) : (
              <SemDadosGrafico texto="Nenhum serviço lançado em OS." />
            )}
          </ReportCard>

          {/* Peças mais usadas */}
          <ReportCard
            title="Peças mais usadas"
            icon={Package}
            description="Por quantidade em ordens de serviço"
          >
            {data.pecasMaisUsadas.length > 0 ? (
              <RankingChart
                data={data.pecasMaisUsadas}
                color={CHART_COLORS.info}
                unidadeLabel="Quantidade"
              />
            ) : (
              <SemDadosGrafico texto="Nenhuma peça lançada em OS." />
            )}
          </ReportCard>

          {/* Produtividade por mecânico */}
          <ReportCard
            title="Produtividade por mecânico"
            icon={UserCog}
            description="Ordens de serviço atribuídas"
          >
            {data.produtividadeMecanicos.length > 0 ? (
              <ProdutividadeChart data={data.produtividadeMecanicos} />
            ) : (
              <SemDadosGrafico texto="Nenhuma OS atribuída a mecânicos." />
            )}
          </ReportCard>

          {/* Clientes mais frequentes */}
          <ReportCard
            title="Clientes mais frequentes"
            icon={Users}
            description="Por número de ordens de serviço"
          >
            {data.clientesMaisFrequentes.length > 0 ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Cliente</TH>
                    <TH className="text-right">Ordens</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.clientesMaisFrequentes.map((c, i) => (
                    <TR key={`${c.nome}-${i}`}>
                      <TD className="font-medium">{c.nome}</TD>
                      <TD className="text-right tabular-nums">
                        {formatNumber(c.ordens)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <SemDadosGrafico texto="Nenhum cliente com ordens de serviço." />
            )}
          </ReportCard>

          {/* Estoque baixo */}
          <ReportCard
            title="Estoque baixo"
            icon={AlertTriangle}
            description="Peças no/abaixo do estoque mínimo"
            className="lg:col-span-2"
          >
            {data.estoqueBaixo.length > 0 ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Peça</TH>
                    <TH>Código</TH>
                    <TH className="text-right">Em estoque</TH>
                    <TH className="text-right">Mínimo</TH>
                    <TH className="text-right">Situação</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.estoqueBaixo.map((p) => {
                    const zerado = p.quantidade <= 0;
                    return (
                      <TR key={p.id}>
                        <TD className="font-medium">{p.nome}</TD>
                        <TD className="text-muted">{p.codigoInterno}</TD>
                        <TD className="text-right tabular-nums">
                          {formatNumber(p.quantidade)}
                        </TD>
                        <TD className="text-right tabular-nums">
                          {formatNumber(p.estoqueMinimo)}
                        </TD>
                        <TD className="text-right">
                          <Badge variant={zerado ? "danger" : "warning"}>
                            {zerado ? "Esgotado" : "Baixo"}
                          </Badge>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            ) : (
              <SemDadosGrafico texto="Nenhuma peça abaixo do estoque mínimo." />
            )}
          </ReportCard>
        </div>
      )}
    </div>
  );
}

function SemDadosGrafico({ texto }: { texto: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border bg-surface/30">
      <p className="text-sm text-muted">{texto}</p>
    </div>
  );
}
