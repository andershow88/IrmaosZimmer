import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Gauge,
  Calendar,
  MessageSquareWarning,
  Camera,
  ListChecks,
  StickyNote,
  ClipboardList,
} from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import {
  obterDetalheOficina,
  minutosExecutados as somaExecutados,
} from "@/server/oficina";
import { formatDateTimeBR } from "@/lib/utils";
import { formatDuracao } from "@/lib/horas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrioridadeBadge } from "@/components/ordens/prioridade-badge";
import { AnexoUpload } from "@/components/anexos/anexo-upload";
import { AnexosGaleria } from "@/components/anexos/anexos-galeria";
import { TimerTrabalho } from "@/components/oficina/timer-trabalho";
import { StatusControl } from "@/components/oficina/status-control";
import { NotasMecanico } from "@/components/oficina/notas-mecanico";
import { ChecklistView } from "@/components/oficina/checklist-view";
import { ItensTrabalho } from "@/components/oficina/itens-trabalho";

export const dynamic = "force-dynamic";

export default async function OficinaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageRole(["MECANICO", "ADMINISTRADOR"]);
  const { id } = await params;

  const os = await obterDetalheOficina(id, user);
  if (!os) notFound();

  const executados = somaExecutados(os.apontamentos);
  const previsto = os.tempoPrevistoMin > 0 ? os.tempoPrevistoMin : 0;
  const excedido = previsto > 0 && executados > previsto;

  const aberto = os.apontamentos.find((a) => a.id === os.apontamentoAbertoId);
  const inicioAberto = aberto ? aberto.inicio.getTime() : null;

  return (
    <div>
      <PageHeader
        title={os.veiculo}
        description={`${os.placa} · OS ${os.numero}`}
        icon={Car}
        action={
          <Link href="/painel/oficina">
            <Button variant="outline" className="min-h-11">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge kind="os" status={os.status} />
        <PrioridadeBadge prioridade={os.prioridade} />
        <span className="ml-auto text-sm text-muted">{os.cliente}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Coluna de ação (timer + status) — destaque no topo em mobile */}
        <div className="flex flex-col gap-5 lg:order-2">
          <TimerTrabalho
            serviceOrderId={os.id}
            apontamentoAbertoId={os.apontamentoAbertoId}
            inicioAberto={inicioAberto}
            minutosExecutados={executados}
            desabilitado={os.finalizada}
          />

          <Card>
            <CardHeader>
              <CardTitle>Atualizar status</CardTitle>
            </CardHeader>
            <CardBody>
              {os.finalizada ? (
                <p className="text-sm text-muted">
                  OS finalizada. Sem ações disponíveis.
                </p>
              ) : (
                <StatusControl serviceOrderId={os.id} status={os.status} />
              )}
            </CardBody>
          </Card>

          {/* Veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Veículo</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 shrink-0 text-muted" />
                <span className="font-medium text-foreground">
                  {os.veiculo}
                  {os.ano ? ` · ${os.ano}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-foreground">
                  {os.quilometragem != null
                    ? `${os.quilometragem.toLocaleString("pt-BR")} km`
                    : "Km não informado"}
                </span>
              </div>
              {os.previsaoEntrega && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-muted" />
                  <span className="text-foreground">
                    Previsão: {formatDateTimeBR(os.previsaoEntrega)}
                  </span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted">Tempo trabalhado</span>
                <span
                  className={
                    "font-semibold tabular-nums " +
                    (excedido ? "text-danger" : "text-foreground")
                  }
                >
                  {formatDuracao(executados)}
                  {previsto > 0 && (
                    <span className="text-xs font-normal text-subtle">
                      {" "}
                      / {formatDuracao(previsto)}
                    </span>
                  )}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Coluna de conteúdo principal */}
        <div className="flex flex-col gap-5 lg:order-1 lg:col-span-2">
          {/* Queixa do cliente */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4 text-accent" />
                  Queixa do cliente
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {os.queixa?.trim() || "Nenhuma queixa registrada."}
              </p>
            </CardBody>
          </Card>

          {/* Serviços e peças */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-accent" />
                  Serviços e peças
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ItensTrabalho servicos={os.servicos} pecas={os.pecas} />
            </CardBody>
          </Card>

          {/* Notas do mecânico (diagnóstico + nota interna) */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-accent" />
                  Diagnóstico e notas
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <NotasMecanico
                serviceOrderId={os.id}
                diagnostico={os.diagnostico ?? ""}
                obsInternas={os.obsInternas ?? ""}
                desabilitado={os.finalizada}
              />
            </CardBody>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-accent" />
                  Checklist
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ChecklistView checklists={os.checklists} />
            </CardBody>
          </Card>

          {/* Fotos / anexos */}
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Camera className="h-4 w-4 text-accent" />
                  Fotos e anexos
                </span>
              </CardTitle>
              {!os.finalizada && <AnexoUpload serviceOrderId={os.id} label="Adicionar foto" />}
            </CardHeader>
            <CardBody>
              <AnexosGaleria anexos={os.anexos} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
