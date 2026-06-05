import type { ReactNode } from "react";
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
  Car,
  BellRing,
  History,
  AlertTriangle,
  Clock,
  Truck,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { greeting, formatBRL, formatDateBR } from "@/lib/utils";
import { formatDuracao } from "@/lib/horas";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaturamentoChart } from "@/components/dashboard/faturamento-chart";
import { AlertasEstoqueList } from "@/components/dashboard/alertas-estoque-list";
import { SectionCard } from "@/components/dashboard/section-card";
import { OSList } from "@/components/dashboard/os-list";
import { AgendaList } from "@/components/dashboard/agenda-list";
import {
  PagamentosPendentesList,
  ContasAPagarList,
} from "@/components/dashboard/financeiro-lists";
import { RevisoesList } from "@/components/dashboard/revisoes-list";
import { AtividadeList } from "@/components/dashboard/atividade-list";
import {
  getDashboardStats,
  getFaturamentoPorMeses,
  getAlertasEstoqueBaixo,
  getAgendaHoje,
  getVeiculosRecebidos,
  getOSAtrasadas,
  getOSAguardandoAprovacao,
  getOSAguardandoPecas,
  getEntregasHoje,
  getPagamentosPendentes,
  getContasAPagarProximas,
  getRevisoesAVencer,
  getAtividadeRecente,
  getMinhasOS,
  getHorasMecanico,
  BLOCOS_POR_PAPEL,
  type DashboardBloco,
} from "@/server/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "";
  const role = user.role;
  const blocos = BLOCOS_POR_PAPEL[role];
  const tem = (b: DashboardBloco) => blocos.includes(b);

  // Carrega apenas o que o papel precisa (queries condicionais e paralelas).
  const [
    stats,
    faturamento3,
    faturamento6,
    faturamento12,
    estoque,
    agendaHoje,
    veiculosRecebidos,
    osAtrasadas,
    aguardandoAprovacao,
    aguardandoPecas,
    entregasHoje,
    pagamentosPendentes,
    contasAPagar,
    revisoes,
    atividade,
    minhasOS,
    horas,
  ] = await Promise.all([
    getDashboardStats(),
    tem("faturamento") ? getFaturamentoPorMeses(3) : Promise.resolve([]),
    tem("faturamento") ? getFaturamentoPorMeses(6) : Promise.resolve([]),
    tem("faturamento") ? getFaturamentoPorMeses(12) : Promise.resolve([]),
    tem("estoqueCritico") ? getAlertasEstoqueBaixo() : Promise.resolve([]),
    tem("agendaHoje") ? getAgendaHoje() : Promise.resolve([]),
    tem("veiculosRecebidos") ? getVeiculosRecebidos() : Promise.resolve([]),
    tem("osAtrasadas")
      ? getOSAtrasadas(role === "MECANICO" ? user.id : undefined)
      : Promise.resolve([]),
    tem("aguardandoAprovacao")
      ? getOSAguardandoAprovacao()
      : Promise.resolve([]),
    tem("aguardandoPecas") ? getOSAguardandoPecas() : Promise.resolve([]),
    tem("entregasHoje") ? getEntregasHoje() : Promise.resolve([]),
    tem("pagamentosPendentes")
      ? getPagamentosPendentes()
      : Promise.resolve([]),
    tem("contasAPagar") ? getContasAPagarProximas() : Promise.resolve([]),
    tem("revisoesAVencer") ? getRevisoesAVencer() : Promise.resolve([]),
    tem("atividadeRecente") ? getAtividadeRecente() : Promise.resolve([]),
    tem("minhasOS") ? getMinhasOS(user.id) : Promise.resolve([]),
    tem("minhasHoras")
      ? getHorasMecanico(user.id)
      : Promise.resolve({ emAberto: 0, minutosHoje: 0 }),
  ]);

  const hoje = formatDateBR(new Date());

  // Indicadores principais (stat-cards) por papel — priorizam ação/urgência.
  const statCards = buildStatCards({
    role,
    stats,
    osAtrasadas: osAtrasadas.length,
    aguardandoAprovacao: aguardandoAprovacao.length,
    aguardandoPecas: aguardandoPecas.length,
    minhasOS: minhasOS.length,
    estoqueCriticoCount: estoque.length,
    horas,
  });

  // Mapeia cada bloco ao seu cartão; renderiza só os do papel, na ordem definida.
  // "faturamento" é tratado fora desta grade (full width, abaixo).
  const blockMap: Record<DashboardBloco, ReactNode> = {
    faturamento: null,
    agendaHoje: (
      <SectionCard
        title="Agenda de hoje"
        icon={CalendarDays}
        tone="info"
        count={agendaHoje.length}
        verTudoHref="/painel/agenda"
      >
        <AgendaList
          itens={agendaHoje}
          emptyTitle="Nenhum agendamento hoje"
          emptyMessage="Os agendamentos do dia aparecerão aqui."
        />
      </SectionCard>
    ),
    veiculosRecebidos: (
      <SectionCard
        title="Veículos recebidos"
        icon={Car}
        tone="accent"
        count={veiculosRecebidos.length}
        verTudoHref="/painel/agenda"
      >
        <AgendaList
          variante="recebidos"
          itens={veiculosRecebidos}
          emptyTitle="Nenhum veículo aguardando"
          emptyMessage="Veículos recebidos prontos para abrir OS aparecerão aqui."
        />
      </SectionCard>
    ),
    osAtrasadas: (
      <SectionCard
        title="OS atrasadas"
        icon={AlertTriangle}
        tone="danger"
        count={osAtrasadas.length}
        verTudoHref="/painel/ordens-servico"
      >
        <OSList
          itens={osAtrasadas}
          emptyTitle="Nenhuma OS atrasada"
          emptyMessage="Tudo dentro do prazo de entrega."
        />
      </SectionCard>
    ),
    aguardandoAprovacao: (
      <SectionCard
        title="Aguardando aprovação"
        icon={FileCheck2}
        tone="warning"
        count={aguardandoAprovacao.length}
        verTudoHref="/painel/ordens-servico?status=AGUARDANDO_APROVACAO"
      >
        <OSList
          itens={aguardandoAprovacao}
          mostrarPrazo={false}
          emptyTitle="Nada aguardando aprovação"
          emptyMessage="OS aguardando o cliente aparecerão aqui."
        />
      </SectionCard>
    ),
    aguardandoPecas: (
      <SectionCard
        title="Aguardando peças"
        icon={PackageX}
        tone="warning"
        count={aguardandoPecas.length}
        verTudoHref="/painel/ordens-servico?status=AGUARDANDO_PECAS"
      >
        <OSList
          itens={aguardandoPecas}
          mostrarPrazo={false}
          emptyTitle="Nenhuma OS aguardando peças"
          emptyMessage="OS paradas por falta de peça aparecerão aqui."
        />
      </SectionCard>
    ),
    entregasHoje: (
      <SectionCard
        title="Entregas de hoje"
        icon={CalendarClock}
        tone="accent"
        count={entregasHoje.length}
        verTudoHref="/painel/ordens-servico"
      >
        <OSList
          itens={entregasHoje}
          emptyTitle="Nenhuma entrega prevista hoje"
          emptyMessage="OS com previsão de entrega para hoje aparecerão aqui."
        />
      </SectionCard>
    ),
    pagamentosPendentes: (
      <SectionCard
        title="Pagamentos pendentes"
        icon={CreditCard}
        tone="warning"
        count={pagamentosPendentes.length}
        verTudoHref="/painel/pagamentos"
      >
        <PagamentosPendentesList itens={pagamentosPendentes} />
      </SectionCard>
    ),
    contasAPagar: (
      <SectionCard
        title="Contas a pagar"
        icon={Receipt}
        tone="danger"
        count={contasAPagar.length}
        verTudoHref="/painel/financeiro/contas-a-pagar"
      >
        <ContasAPagarList itens={contasAPagar} />
      </SectionCard>
    ),
    estoqueCritico: (
      <SectionCard
        title="Estoque crítico"
        icon={PackageX}
        tone="danger"
        count={estoque.length}
        verTudoHref="/painel/estoque"
      >
        <AlertasEstoqueList itens={estoque} />
      </SectionCard>
    ),
    revisoesAVencer: (
      <SectionCard
        title="Revisões a vencer"
        icon={BellRing}
        tone="warning"
        count={revisoes.length}
        verTudoHref="/painel/avisos?tipo=REVISAO"
        verTudoLabel="Ver avisos"
      >
        <RevisoesList itens={revisoes} />
      </SectionCard>
    ),
    atividadeRecente: (
      <SectionCard title="Atividade recente" icon={History} tone="info">
        <AtividadeList itens={atividade} />
      </SectionCard>
    ),
    minhasOS: (
      <SectionCard
        title="Minhas ordens de serviço"
        icon={Wrench}
        tone="accent"
        count={minhasOS.length}
        verTudoHref="/painel/ordens-servico"
      >
        <OSList
          itens={minhasOS}
          mostrarStatus
          emptyTitle="Nenhuma OS atribuída"
          emptyMessage="Ordens atribuídas a você aparecerão aqui."
        />
      </SectionCard>
    ),
    minhasHoras: (
      <SectionCard title="Minhas horas" icon={Clock} tone="info">
        <div className="flex flex-wrap items-center gap-6 py-2">
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatDuracao(horas.minutosHoje)}
            </p>
            <p className="text-xs text-muted">lançadas hoje</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-2xl font-bold tabular-nums text-foreground">
              {horas.emAberto}
              {horas.emAberto > 0 && (
                <Badge variant="accent">em andamento</Badge>
              )}
            </p>
            <p className="text-xs text-muted">apontamentos abertos</p>
          </div>
        </div>
      </SectionCard>
    ),
  };

  // Faturamento é tratado separadamente (full width com gráfico).
  const blocosLista = blocos.filter((b) => b !== "faturamento");

  return (
    <div>
      <PageHeader
        title="Painel da oficina"
        description={`${greeting()}${firstName ? `, ${firstName}` : ""}! Visão geral de ${hoje}.`}
        icon={LayoutDashboard}
        action={
          <Badge variant="outline" className="capitalize">
            {ROLE_LABELS[role]}
          </Badge>
        }
      />

      {/* Indicadores principais (acionáveis, por papel) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards}
      </div>

      {/* Gráfico de faturamento (papéis com acesso financeiro) */}
      {tem("faturamento") && (
        <Card className="mt-6">
          <CardHeader className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <CardTitle>Faturamento</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <FaturamentoChart
              periodos={{
                "3": faturamento3,
                "6": faturamento6,
                "12": faturamento12,
              }}
            />
          </CardBody>
        </Card>
      )}

      {/* Seções acionáveis na ordem de relevância do papel */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {blocosLista.map((b) => (
          <div key={b}>{blockMap[b]}</div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat-cards por papel                                               */
/* ------------------------------------------------------------------ */

function buildStatCards({
  role,
  stats,
  osAtrasadas,
  aguardandoAprovacao,
  aguardandoPecas,
  minhasOS,
  estoqueCriticoCount,
  horas,
}: {
  role: import("@/lib/roles").Role;
  stats: Awaited<ReturnType<typeof getDashboardStats>>;
  osAtrasadas: number;
  aguardandoAprovacao: number;
  aguardandoPecas: number;
  minhasOS: number;
  estoqueCriticoCount: number;
  horas: { emAberto: number; minutosHoje: number };
}): ReactNode {
  const C = StatCard;

  if (role === "MECANICO") {
    return (
      <>
        <C label="Minhas OS" value={minhasOS} icon={Wrench} tone="accent" hint="Atribuídas a você" />
        <C label="Aguardando peças" value={aguardandoPecas} icon={PackageX} tone="warning" hint="Paradas por peça" />
        <C label="OS atrasadas" value={osAtrasadas} icon={AlertTriangle} tone="danger" hint="Previsão vencida" />
        <C label="Apontamentos abertos" value={horas.emAberto} icon={Clock} tone="info" hint={formatDuracao(horas.minutosHoje) + " hoje"} />
      </>
    );
  }

  if (role === "FINANCEIRO") {
    return (
      <>
        <C label="A receber" value={formatBRL(stats.pagamentosPendentesSaldo)} icon={CreditCard} tone="warning" hint={`${stats.pagamentosPendentesCount} pagamentos`} />
        <C label="Receita do mês" value={formatBRL(stats.receitaMes)} icon={TrendingUp} tone="success" hint="Pagamentos recebidos" />
        <C label="Ticket médio" value={formatBRL(stats.ticketMedio)} icon={Receipt} tone="accent" hint="OS concluídas" />
        <C label="OS abertas" value={stats.osAbertas} icon={ClipboardList} tone="info" hint="Em andamento" />
      </>
    );
  }

  if (role === "ESTOQUE") {
    return (
      <>
        <C label="Estoque crítico" value={estoqueCriticoCount} icon={PackageX} tone="danger" hint="Peças no/abaixo do mínimo" />
        <C label="Aguardando peças" value={aguardandoPecas} icon={Truck} tone="warning" hint="OS paradas por peça" />
        <C label="OS abertas" value={stats.osAbertas} icon={ClipboardList} tone="accent" hint="Em andamento" />
        <C label="Em execução" value={stats.servicosEmExecucao} icon={Wrench} tone="info" hint="Serviços em andamento" />
      </>
    );
  }

  if (role === "ATENDENTE") {
    return (
      <>
        <C label="Agendamentos hoje" value={stats.agendamentosHoje} icon={CalendarDays} tone="info" hint="Agenda do dia" />
        <C label="OS atrasadas" value={osAtrasadas} icon={AlertTriangle} tone="danger" hint="Previsão vencida" />
        <C label="Aguardando aprovação" value={aguardandoAprovacao} icon={FileCheck2} tone="warning" hint="OS com o cliente" />
        <C label="Orçamentos p/ aprovar" value={stats.orcamentosAguardandoAprovacao} icon={FileCheck2} tone="accent" hint="Enviados ao cliente" />
      </>
    );
  }

  // ADMINISTRADOR — visão completa, urgências primeiro.
  return (
    <>
      <C label="OS atrasadas" value={osAtrasadas} icon={AlertTriangle} tone="danger" hint="Previsão vencida" />
      <C label="Aguardando aprovação" value={aguardandoAprovacao} icon={FileCheck2} tone="warning" hint="OS com o cliente" />
      <C label="Aguardando peças" value={aguardandoPecas} icon={PackageX} tone="warning" hint="OS paradas por peça" />
      <C label="Agendamentos hoje" value={stats.agendamentosHoje} icon={CalendarDays} tone="info" hint="Agenda do dia" />
      <C label="OS abertas" value={stats.osAbertas} icon={ClipboardList} tone="accent" hint="Em andamento" />
      <C label="Aguardando diagnóstico" value={stats.veiculosAguardandoDiagnostico} icon={Stethoscope} tone="info" hint="Veículos a avaliar" />
      <C label="A receber" value={formatBRL(stats.pagamentosPendentesSaldo)} icon={CreditCard} tone="warning" hint={`${stats.pagamentosPendentesCount} pagamentos`} />
      <C label="Receita do mês" value={formatBRL(stats.receitaMes)} icon={TrendingUp} tone="success" hint="Pagamentos recebidos" />
    </>
  );
}
