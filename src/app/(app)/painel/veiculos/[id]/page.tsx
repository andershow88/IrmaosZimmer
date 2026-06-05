import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Car,
  User,
  ClipboardList,
  ClipboardCheck,
  Camera,
  Gauge,
  ShieldCheck,
  Wrench,
  CalendarClock,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR, formatNumber } from "@/lib/utils";
import { isStatusOSAberta } from "@/lib/status-constants";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VeiculoAcoes } from "@/components/veiculos/veiculo-acoes";
import { COMBUSTIVEL_LABELS } from "@/components/veiculos/constants";
import { AnexoUpload } from "@/components/anexos/anexo-upload";
import { AnexosGaleria } from "@/components/anexos/anexos-galeria";

export const dynamic = "force-dynamic";

function DadoLinha({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export default async function VeiculoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const veiculo = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      placa: true,
      marca: true,
      modelo: true,
      ano: true,
      cor: true,
      quilometragem: true,
      chassi: true,
      renavam: true,
      combustivel: true,
      observacoes: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          nome: true,
          telefone: true,
          whatsapp: true,
        },
      },
      serviceOrders: {
        orderBy: { dataAbertura: "desc" },
        select: {
          id: true,
          numero: true,
          dataAbertura: true,
          status: true,
          total: true,
          quilometragem: true,
          problemaRelatado: true,
          warranties: {
            select: {
              id: true,
              descricao: true,
              validadeAte: true,
              observacoes: true,
              createdAt: true,
            },
          },
        },
      },
      inspections: {
        orderBy: { data: "desc" },
        select: {
          id: true,
          data: true,
          observacoes: true,
          mecanico: { select: { name: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!veiculo) notFound();

  // Anexos do veículo (Attachment.vehicleId não possui back-relation no schema).
  const anexos = await prisma.attachment.findMany({
    where: { vehicleId: veiculo.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, nome: true, tipo: true, createdAt: true },
  });

  const descricao = `${veiculo.marca} ${veiculo.modelo} — ${veiculo.placa}`;

  const osAbertas = veiculo.serviceOrders.filter((os) =>
    isStatusOSAberta(os.status)
  );

  // Garantias: pertencem às OS do veículo. Achatamos com o nº da OS.
  const garantias = veiculo.serviceOrders.flatMap((os) =>
    os.warranties.map((w) => ({ ...w, osId: os.id, osNumero: os.numero }))
  );

  // Histórico de quilometragem: snapshots registrados nas OS + km atual.
  const kmHistorico = veiculo.serviceOrders
    .filter((os) => os.quilometragem != null)
    .map((os) => ({
      km: os.quilometragem as number,
      data: os.dataAbertura,
      origem: `OS ${os.numero}`,
      osId: os.id,
    }))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Próxima revisão (informativo, sem regra de negócio): estima 6 meses após
  // o último atendimento/inspeção.
  const ultimoAtendimento =
    veiculo.serviceOrders[0]?.dataAbertura ?? veiculo.inspections[0]?.data ?? null;
  const proximaRevisao = ultimoAtendimento
    ? new Date(
        new Date(ultimoAtendimento).setMonth(
          new Date(ultimoAtendimento).getMonth() + 6
        )
      )
    : null;
  const revisaoVencida = proximaRevisao ? proximaRevisao < new Date() : false;

  return (
    <div>
      <PageHeader
        title={`${veiculo.marca} ${veiculo.modelo}`}
        description={veiculo.placa + (veiculo.ano ? ` • ${veiculo.ano}` : "")}
        icon={Car}
        action={
          <VeiculoAcoes
            veiculoId={veiculo.id}
            descricao={descricao}
            quilometragem={veiculo.quilometragem}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna esquerda: proprietário + resumo */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Proprietário</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/painel/clientes/${veiculo.customer.id}`}
                    className="font-semibold text-foreground hover:text-accent"
                  >
                    {veiculo.customer.nome}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {veiculo.customer.telefone ||
                      veiculo.customer.whatsapp ||
                      "Sem contato"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted">
                Cadastrado em {formatDateBR(veiculo.createdAt)}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-muted">
                  <Gauge className="h-4 w-4" aria-hidden="true" />
                  Quilometragem
                </span>
                <span className="font-semibold text-foreground">
                  {veiculo.quilometragem != null
                    ? `${formatNumber(veiculo.quilometragem)} km`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-muted">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  OS abertas
                </span>
                <span className="font-semibold text-foreground">
                  {osAbertas.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="inline-flex items-center gap-2 text-muted">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Próxima revisão
                </span>
                {proximaRevisao ? (
                  <span
                    className={
                      revisaoVencida
                        ? "font-semibold text-danger"
                        : "font-semibold text-foreground"
                    }
                  >
                    {formatDateBR(proximaRevisao)}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
              {revisaoVencida && (
                <p className="text-xs text-danger">
                  Revisão estimada vencida — sugira um agendamento ao cliente.
                </p>
              )}
              <p className="text-[11px] text-subtle">
                Estimativa informativa (6 meses após o último atendimento).
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Coluna direita: abas */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="dados">
            <TabsList aria-label="Seções do veículo">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="km">
                Quilometragem ({kmHistorico.length})
              </TabsTrigger>
              <TabsTrigger value="abertas">
                OS abertas ({osAbertas.length})
              </TabsTrigger>
              <TabsTrigger value="servicos">
                Histórico ({veiculo.serviceOrders.length})
              </TabsTrigger>
              <TabsTrigger value="checklists">
                Checklists ({veiculo.inspections.length})
              </TabsTrigger>
              <TabsTrigger value="garantias">
                Garantias ({garantias.length})
              </TabsTrigger>
              <TabsTrigger value="anexos">Anexos ({anexos.length})</TabsTrigger>
            </TabsList>

            {/* Dados do veículo */}
            <TabsContent value="dados">
              <Card>
                <CardBody>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                    <DadoLinha
                      label="Placa"
                      value={
                        <span className="font-mono tracking-wide">
                          {veiculo.placa}
                        </span>
                      }
                    />
                    <DadoLinha label="Marca" value={veiculo.marca} />
                    <DadoLinha label="Modelo" value={veiculo.modelo} />
                    <DadoLinha label="Ano" value={veiculo.ano} />
                    <DadoLinha label="Cor" value={veiculo.cor} />
                    <DadoLinha
                      label="Quilometragem"
                      value={
                        veiculo.quilometragem != null
                          ? `${formatNumber(veiculo.quilometragem)} km`
                          : null
                      }
                    />
                    <DadoLinha
                      label="Combustível"
                      value={
                        veiculo.combustivel ? (
                          <Badge variant="outline">
                            {COMBUSTIVEL_LABELS[veiculo.combustivel]}
                          </Badge>
                        ) : null
                      }
                    />
                    <DadoLinha label="Renavam" value={veiculo.renavam} />
                    <DadoLinha
                      label="Chassi"
                      value={
                        veiculo.chassi ? (
                          <span className="font-mono text-xs">
                            {veiculo.chassi}
                          </span>
                        ) : null
                      }
                    />
                  </dl>

                  {veiculo.observacoes && (
                    <div className="mt-5 border-t border-border pt-4">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                        Observações
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                        {veiculo.observacoes}
                      </dd>
                    </div>
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Histórico de quilometragem */}
            <TabsContent value="km">
              <Card>
                <CardBody className={kmHistorico.length === 0 ? "" : "p-0"}>
                  {kmHistorico.length === 0 ? (
                    <EmptyState
                      icon={Gauge}
                      title="Sem histórico de quilometragem"
                      message="A quilometragem é registrada a cada ordem de serviço ou pela ação “Registrar km”."
                    />
                  ) : (
                    <Table className="rounded-none border-0">
                      <THead>
                        <TR>
                          <TH>Data</TH>
                          <TH>Origem</TH>
                          <TH className="text-right">Quilometragem</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {kmHistorico.map((k) => (
                          <TR key={`${k.osId}-${k.km}`}>
                            <TD className="whitespace-nowrap text-muted">
                              {formatDateBR(k.data)}
                            </TD>
                            <TD>
                              <Link
                                href={`/painel/ordens-servico/${k.osId}`}
                                className="text-foreground hover:text-accent"
                              >
                                {k.origem}
                              </Link>
                            </TD>
                            <TD className="text-right font-medium tabular-nums">
                              {formatNumber(k.km)} km
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* OS abertas */}
            <TabsContent value="abertas">
              <Card>
                <CardBody className={osAbertas.length === 0 ? "" : "p-0"}>
                  {osAbertas.length === 0 ? (
                    <EmptyState
                      icon={ClipboardList}
                      title="Nenhuma OS em aberto"
                      message="Não há ordens de serviço em andamento para este veículo."
                    />
                  ) : (
                    <OsTabela ordens={osAbertas} />
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Histórico de serviços */}
            <TabsContent value="servicos">
              <Card>
                <CardBody className={veiculo.serviceOrders.length === 0 ? "" : "p-0"}>
                  {veiculo.serviceOrders.length === 0 ? (
                    <EmptyState
                      icon={Wrench}
                      title="Nenhum serviço"
                      message="Este veículo ainda não possui ordens de serviço."
                    />
                  ) : (
                    <OsTabela ordens={veiculo.serviceOrders} showProblema />
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Checklists / inspeções */}
            <TabsContent value="checklists">
              <Card>
                <CardBody className={veiculo.inspections.length === 0 ? "" : "p-0"}>
                  {veiculo.inspections.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="Nenhum checklist"
                      message="Este veículo ainda não possui inspeções registradas."
                    />
                  ) : (
                    <Table className="rounded-none border-0">
                      <THead>
                        <TR>
                          <TH>Data</TH>
                          <TH>Mecânico</TH>
                          <TH className="text-center">Itens</TH>
                          <TH>Observações</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {veiculo.inspections.map((insp) => (
                          <TR key={insp.id}>
                            <TD className="whitespace-nowrap">
                              <Link
                                href={`/painel/checklists/${insp.id}`}
                                className="font-medium text-foreground hover:text-accent"
                              >
                                {formatDateBR(insp.data)}
                              </Link>
                            </TD>
                            <TD>{insp.mecanico?.name || "—"}</TD>
                            <TD className="text-center tabular-nums">
                              {insp._count.items}
                            </TD>
                            <TD className="max-w-xs truncate text-muted">
                              {insp.observacoes || "—"}
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Garantias */}
            <TabsContent value="garantias">
              <Card>
                <CardBody className={garantias.length === 0 ? "" : "p-0"}>
                  {garantias.length === 0 ? (
                    <EmptyState
                      icon={ShieldCheck}
                      title="Nenhuma garantia"
                      message="Não há garantias registradas para este veículo."
                    />
                  ) : (
                    <Table className="rounded-none border-0">
                      <THead>
                        <TR>
                          <TH>Descrição</TH>
                          <TH>OS</TH>
                          <TH>Validade</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {garantias.map((g) => {
                          const vencida =
                            g.validadeAte != null &&
                            new Date(g.validadeAte) < new Date();
                          return (
                            <TR key={g.id}>
                              <TD className="font-medium text-foreground">
                                {g.descricao}
                                {g.observacoes && (
                                  <span className="block text-xs font-normal text-muted">
                                    {g.observacoes}
                                  </span>
                                )}
                              </TD>
                              <TD>
                                <Link
                                  href={`/painel/ordens-servico/${g.osId}`}
                                  className="text-foreground hover:text-accent"
                                >
                                  {g.osNumero}
                                </Link>
                              </TD>
                              <TD>
                                {g.validadeAte ? (
                                  <span
                                    className={
                                      vencida
                                        ? "text-danger"
                                        : "text-foreground"
                                    }
                                  >
                                    {formatDateBR(g.validadeAte)}
                                    {vencida ? " (vencida)" : ""}
                                  </span>
                                ) : (
                                  <span className="text-muted">Sem prazo</span>
                                )}
                              </TD>
                            </TR>
                          );
                        })}
                      </TBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Anexos / Fotos */}
            <TabsContent value="anexos">
              <Card>
                <CardHeader className="flex items-center justify-between gap-3">
                  <CardTitle>
                    <span className="inline-flex items-center gap-2">
                      <Camera className="h-4 w-4 text-accent" aria-hidden="true" />
                      Fotos e anexos
                    </span>
                  </CardTitle>
                  <AnexoUpload vehicleId={veiculo.id} label="Enviar foto" />
                </CardHeader>
                <CardBody>
                  <AnexosGaleria anexos={anexos} />
                </CardBody>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

type OsLinha = {
  id: string;
  numero: string;
  status: string;
  dataAbertura: Date;
  /** Decimal do Prisma — `formatBRL` aceita qualquer valor com `toString()`. */
  total: { toString(): string };
  problemaRelatado?: string | null;
};

function OsTabela({
  ordens,
  showProblema = false,
}: {
  ordens: OsLinha[];
  showProblema?: boolean;
}) {
  return (
    <Table className="rounded-none border-0">
      <THead>
        <TR>
          <TH>Número</TH>
          <TH>Abertura</TH>
          {showProblema && <TH>Problema</TH>}
          <TH>Status</TH>
          <TH className="text-right">Total</TH>
        </TR>
      </THead>
      <TBody>
        {ordens.map((os) => (
          <TR key={os.id}>
            <TD className="font-semibold">
              <Link
                href={`/painel/ordens-servico/${os.id}`}
                className="text-foreground hover:text-accent"
              >
                {os.numero}
              </Link>
            </TD>
            <TD className="whitespace-nowrap text-muted">
              {formatDateBR(os.dataAbertura)}
            </TD>
            {showProblema && (
              <TD className="max-w-xs truncate text-muted">
                {os.problemaRelatado || "—"}
              </TD>
            )}
            <TD>
              <StatusBadge kind="os" status={os.status} />
            </TD>
            <TD className="text-right tabular-nums">
              {formatBRL(os.total)}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
