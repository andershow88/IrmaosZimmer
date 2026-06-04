import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
  FileCheck2,
  Wrench,
  CalendarDays,
  CreditCard,
  TrendingUp,
  Receipt,
  BarChart3,
  CalendarClock,
  PackageX,
  Cake,
  BellRing,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { greeting, formatBRL, formatDateBR } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
} from "@/components/ui/card";
import { FaturamentoChart } from "@/components/dashboard/faturamento-chart";
import { ProximasEntregasList } from "@/components/dashboard/proximas-entregas-list";
import { AlertasEstoqueList } from "@/components/dashboard/alertas-estoque-list";
import {
  getDashboardStats,
  getFaturamentoUltimos6Meses,
  getProximasEntregas,
  getAlertasEstoqueBaixo,
  getAniversariantesDoMes,
  getRevisoesPendentesCount,
} from "@/server/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "";

  const [
    stats,
    faturamento,
    proximasEntregas,
    alertasEstoque,
    aniversariantes,
    revisoesPendentes,
  ] = await Promise.all([
    getDashboardStats(),
    getFaturamentoUltimos6Meses(),
    getProximasEntregas(),
    getAlertasEstoqueBaixo(),
    getAniversariantesDoMes(),
    getRevisoesPendentesCount(),
  ]);

  const hoje = formatDateBR(new Date());

  return (
    <div>
      <PageHeader
        title="Painel da oficina"
        description={`${greeting()}${firstName ? `, ${firstName}` : ""}! Visão geral de ${hoje}.`}
        icon={LayoutDashboard}
      />

      {/* Indicadores principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="OS abertas"
          value={stats.osAbertas}
          icon={ClipboardList}
          tone="accent"
          hint="Ordens em andamento"
        />
        <StatCard
          label="Aguardando diagnóstico"
          value={stats.veiculosAguardandoDiagnostico}
          icon={Stethoscope}
          tone="warning"
          hint="Veículos a avaliar"
        />
        <StatCard
          label="Orçamentos p/ aprovar"
          value={stats.orcamentosAguardandoAprovacao}
          icon={FileCheck2}
          tone="info"
          hint="Enviados ao cliente"
        />
        <StatCard
          label="Em execução"
          value={stats.servicosEmExecucao}
          icon={Wrench}
          tone="accent"
          hint="Serviços em andamento"
        />
        <StatCard
          label="Agendamentos de hoje"
          value={stats.agendamentosHoje}
          icon={CalendarDays}
          tone="info"
          hint="Agenda do dia"
        />
        <StatCard
          label="Pagamentos pendentes"
          value={formatBRL(stats.pagamentosPendentesSaldo)}
          icon={CreditCard}
          tone="warning"
          hint={`${stats.pagamentosPendentesCount} a receber`}
        />
        <StatCard
          label="Receita do mês"
          value={formatBRL(stats.receitaMes)}
          icon={TrendingUp}
          tone="success"
          hint="Pagamentos recebidos"
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(stats.ticketMedio)}
          icon={Receipt}
          tone="accent"
          hint="OS concluídas"
        />
      </div>

      {/* Gráfico + alertas de estoque */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <CardTitle>Faturamento dos últimos 6 meses</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <FaturamentoChart data={faturamento} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-danger" />
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <AlertasEstoqueList itens={alertasEstoque} />
          </CardBody>
        </Card>
      </div>

      {/* Próximas entregas */}
      <Card className="mt-6">
        <CardHeader className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-accent" />
          <CardTitle>Próximas entregas</CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <ProximasEntregasList itens={proximasEntregas} />
        </CardBody>
      </Card>

      {/* Avisos ao cliente: aniversariantes + revisões pendentes */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-accent" />
              <CardTitle>Aniversariantes do mês</CardTitle>
            </div>
            <Link
              href="/painel/avisos?tipo=ANIVERSARIO"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Ver avisos
            </Link>
          </CardHeader>
          <CardBody className="pt-0">
            {aniversariantes.length === 0 ? (
              <p className="py-4 text-sm text-muted">
                Nenhum aniversariante neste mês.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {aniversariantes.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <Link
                      href={`/painel/clientes/${a.id}`}
                      className="truncate font-medium text-foreground hover:text-accent transition"
                    >
                      {a.nome}
                    </Link>
                    <span className="shrink-0 text-sm text-muted">
                      dia {a.dia}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-warning" />
            <CardTitle>Revisões pendentes</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="flex flex-col items-start gap-2 py-2">
              <span className="text-3xl font-bold text-foreground">
                {revisoesPendentes}
              </span>
              <p className="text-sm text-muted">
                {revisoesPendentes === 1
                  ? "cliente para lembrar de revisão"
                  : "clientes para lembrar de revisão"}
              </p>
              <Link
                href="/painel/avisos?tipo=REVISAO"
                className="mt-1 text-xs font-semibold text-accent hover:underline"
              >
                Abrir avisos de revisão
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
