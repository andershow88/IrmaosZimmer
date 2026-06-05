import Link from "next/link";
import { notFound } from "next/navigation";
import {
  User,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Car,
  ClipboardList,
  CalendarDays,
  Wallet,
  ShieldCheck,
  ShieldOff,
  Cake,
  Clock,
  StickyNote,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import { ClienteAcoes } from "@/components/clientes/cliente-acoes";
import { isStatusOSAberta } from "@/lib/status-constants";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const cliente = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          placa: true,
          marca: true,
          modelo: true,
          ano: true,
          quilometragem: true,
        },
      },
      serviceOrders: {
        orderBy: { dataAbertura: "desc" },
        select: {
          id: true,
          numero: true,
          status: true,
          dataAbertura: true,
          total: true,
          vehicle: { select: { placa: true, modelo: true } },
          payments: {
            where: { status: { not: "PAGO" } },
            select: {
              id: true,
              valorTotal: true,
              valorPago: true,
              status: true,
              forma: true,
              dataPagamento: true,
            },
          },
        },
      },
      appointments: {
        orderBy: { dataHora: "desc" },
        select: {
          id: true,
          dataHora: true,
          status: true,
          servicoDesejado: true,
          vehicle: { select: { placa: true, modelo: true } },
        },
      },
      _count: { select: { quotes: true } },
    },
  });

  if (!cliente) notFound();

  const contatos = [
    cliente.telefone && { icon: Phone, label: "Telefone", value: cliente.telefone },
    cliente.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: cliente.whatsapp,
    },
    cliente.email && { icon: Mail, label: "E-mail", value: cliente.email },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string }[];

  const enderecoLinha = [cliente.endereco, cliente.cidade, cliente.estado]
    .filter(Boolean)
    .join(", ");

  // Separa OS abertas (em andamento) das demais (histórico).
  const osAbertas = cliente.serviceOrders.filter((os) =>
    isStatusOSAberta(os.status)
  );

  // Pagamentos pendentes (qualquer payment não-PAGO em qualquer OS).
  const pagamentosPendentes = cliente.serviceOrders.flatMap((os) =>
    os.payments.map((p) => ({
      ...p,
      osId: os.id,
      osNumero: os.numero,
      saldo: Number(p.valorTotal) - Number(p.valorPago),
    }))
  );
  const totalPendente = pagamentosPendentes.reduce((acc, p) => acc + p.saldo, 0);

  // Última interação: a data mais recente entre OS e agendamentos.
  const datas = [
    ...cliente.serviceOrders.map((os) => os.dataAbertura),
    ...cliente.appointments.map((a) => a.dataHora),
  ];
  const ultimaInteracao =
    datas.length > 0
      ? new Date(Math.max(...datas.map((d) => new Date(d).getTime())))
      : null;

  const whatsappLink = cliente.whatsapp
    ? waLink(
        cliente.whatsapp,
        `Olá, ${cliente.nome}! Aqui é da oficina Irmãos Zimmer.`
      )
    : cliente.telefone
      ? waLink(
          cliente.telefone,
          `Olá, ${cliente.nome}! Aqui é da oficina Irmãos Zimmer.`
        )
      : null;

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        description={
          cliente.tipoPessoa === "JURIDICA" ? "Pessoa jurídica" : "Pessoa física"
        }
        icon={User}
        action={
          <ClienteAcoes
            clienteId={cliente.id}
            nome={cliente.nome}
            whatsappLink={whatsappLink}
            totalVeiculos={cliente.vehicles.length}
            totalOrdens={cliente.serviceOrders.length}
            totalOrcamentos={cliente._count.quotes}
            veiculos={cliente.vehicles.map((v) => ({
              id: v.id,
              label: `${v.marca} ${v.modelo} — ${v.placa}`,
              quilometragem: v.quilometragem,
            }))}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna esquerda: contato + resumo */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={cliente.tipoPessoa === "JURIDICA" ? "info" : "default"}>
                  {cliente.tipoPessoa === "JURIDICA"
                    ? "Pessoa jurídica"
                    : "Pessoa física"}
                </Badge>
                {cliente.lgpdConsent ? (
                  <Badge variant="success">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    LGPD
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <ShieldOff className="h-3 w-3" aria-hidden="true" />
                    Sem consentimento
                  </Badge>
                )}
              </div>

              {cliente.cpfCnpj && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">
                    {cliente.tipoPessoa === "JURIDICA" ? "CNPJ" : "CPF"}
                  </span>
                  <span className="font-medium text-foreground">
                    {cliente.cpfCnpj}
                  </span>
                </div>
              )}

              {contatos.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-2 text-foreground"
                >
                  <c.icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  <span>{c.value}</span>
                </div>
              ))}

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Enviar mensagem no WhatsApp
                </a>
              )}

              {enderecoLinha && (
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span>
                    {enderecoLinha}
                    {cliente.cep ? ` — ${cliente.cep}` : ""}
                  </span>
                </div>
              )}

              {cliente.dataNascimento && (
                <div className="flex items-center gap-2 text-foreground">
                  <Cake className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  <span>{formatDateBR(cliente.dataNascimento)}</span>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <ResumoLinha
                icon={Car}
                label="Veículos"
                value={String(cliente.vehicles.length)}
              />
              <ResumoLinha
                icon={ClipboardList}
                label="OS abertas"
                value={String(osAbertas.length)}
              />
              <ResumoLinha
                icon={Wallet}
                label="Pagamentos pendentes"
                value={
                  pagamentosPendentes.length > 0
                    ? formatBRL(totalPendente)
                    : "—"
                }
                tone={pagamentosPendentes.length > 0 ? "danger" : undefined}
              />
              <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {ultimaInteracao
                  ? `Última interação em ${formatDateBR(ultimaInteracao)}`
                  : "Sem interações registradas"}
              </div>
              <div className="text-xs text-muted">
                Cadastrado em {formatDateBR(cliente.createdAt)}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Coluna direita: abas */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="veiculos">
            <TabsList aria-label="Seções do cliente">
              <TabsTrigger value="veiculos">
                Veículos ({cliente.vehicles.length})
              </TabsTrigger>
              <TabsTrigger value="abertas">
                OS abertas ({osAbertas.length})
              </TabsTrigger>
              <TabsTrigger value="historico">
                Histórico ({cliente.serviceOrders.length})
              </TabsTrigger>
              <TabsTrigger value="pagamentos">
                Pagamentos ({pagamentosPendentes.length})
              </TabsTrigger>
              <TabsTrigger value="agendamentos">
                Agendamentos ({cliente.appointments.length})
              </TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
            </TabsList>

            {/* Veículos */}
            <TabsContent value="veiculos">
              <Card>
                <CardBody className={cliente.vehicles.length === 0 ? "" : "p-0"}>
                  {cliente.vehicles.length === 0 ? (
                    <EmptyState
                      icon={Car}
                      title="Nenhum veículo"
                      message="Este cliente ainda não possui veículos cadastrados."
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {cliente.vehicles.map((v) => (
                        <li key={v.id}>
                          <Link
                            href={`/painel/veiculos/${v.id}`}
                            className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface/50"
                          >
                            <Car
                              className="h-4 w-4 shrink-0 text-muted"
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">
                                {v.marca} {v.modelo}
                                {v.ano ? ` · ${v.ano}` : ""}
                              </p>
                              <p className="text-xs text-muted">
                                {v.placa}
                                {v.quilometragem != null
                                  ? ` · ${v.quilometragem.toLocaleString(
                                      "pt-BR"
                                    )} km`
                                  : ""}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
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
                      message="Não há ordens de serviço em andamento para este cliente."
                    />
                  ) : (
                    <OsTabela ordens={osAbertas} />
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Histórico de atendimentos */}
            <TabsContent value="historico">
              <Card>
                <CardBody className={cliente.serviceOrders.length === 0 ? "" : "p-0"}>
                  {cliente.serviceOrders.length === 0 ? (
                    <EmptyState
                      icon={ClipboardList}
                      title="Sem atendimentos"
                      message="Este cliente ainda não possui ordens de serviço."
                    />
                  ) : (
                    <OsTabela ordens={cliente.serviceOrders} />
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Pagamentos pendentes */}
            <TabsContent value="pagamentos">
              <Card>
                <CardBody className={pagamentosPendentes.length === 0 ? "" : "p-0"}>
                  {pagamentosPendentes.length === 0 ? (
                    <EmptyState
                      icon={Wallet}
                      title="Nenhum pagamento pendente"
                      message="Todos os pagamentos deste cliente estão quitados."
                    />
                  ) : (
                    <Table className="rounded-none border-0">
                      <THead>
                        <TR>
                          <TH>OS</TH>
                          <TH>Status</TH>
                          <TH className="text-right">Total</TH>
                          <TH className="text-right">Saldo</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {pagamentosPendentes.map((p) => (
                          <TR key={p.id}>
                            <TD className="font-semibold">
                              <Link
                                href={`/painel/ordens-servico/${p.osId}`}
                                className="text-foreground hover:text-accent"
                              >
                                {p.osNumero}
                              </Link>
                            </TD>
                            <TD>
                              <StatusBadge kind="pagamento" status={p.status} />
                            </TD>
                            <TD className="text-right tabular-nums">
                              {formatBRL(p.valorTotal)}
                            </TD>
                            <TD className="text-right font-medium tabular-nums text-danger">
                              {formatBRL(p.saldo)}
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Agendamentos */}
            <TabsContent value="agendamentos">
              <Card>
                <CardBody className={cliente.appointments.length === 0 ? "" : "p-0"}>
                  {cliente.appointments.length === 0 ? (
                    <EmptyState
                      icon={CalendarDays}
                      title="Nenhum agendamento"
                      message="Nenhum agendamento registrado para este cliente."
                    />
                  ) : (
                    <Table className="rounded-none border-0">
                      <THead>
                        <TR>
                          <TH>Data / hora</TH>
                          <TH>Serviço</TH>
                          <TH>Veículo</TH>
                          <TH>Status</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {cliente.appointments.map((ag) => (
                          <TR key={ag.id}>
                            <TD className="whitespace-nowrap text-muted">
                              {formatDateTimeBR(ag.dataHora)}
                            </TD>
                            <TD>{ag.servicoDesejado || "—"}</TD>
                            <TD className="text-muted">
                              {ag.vehicle
                                ? `${ag.vehicle.modelo} · ${ag.vehicle.placa}`
                                : "—"}
                            </TD>
                            <TD>
                              <StatusBadge kind="agendamento" status={ag.status} />
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabsContent>

            {/* Observações */}
            <TabsContent value="observacoes">
              <Card>
                <CardBody>
                  {cliente.observacoes ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {cliente.observacoes}
                    </p>
                  ) : (
                    <EmptyState
                      icon={StickyNote}
                      title="Sem observações"
                      message="Nenhuma observação registrada para este cliente."
                    />
                  )}
                </CardBody>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ResumoLinha({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
      <span
        className={
          tone === "danger"
            ? "font-semibold text-danger"
            : "font-semibold text-foreground"
        }
      >
        {value}
      </span>
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
  vehicle: { placa: string; modelo: string };
};

function OsTabela({ ordens }: { ordens: OsLinha[] }) {
  return (
    <Table className="rounded-none border-0">
      <THead>
        <TR>
          <TH>OS</TH>
          <TH>Veículo</TH>
          <TH>Data</TH>
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
            <TD className="text-muted">
              {os.vehicle.modelo} · {os.vehicle.placa}
            </TD>
            <TD className="text-muted">{formatDateBR(os.dataAbertura)}</TD>
            <TD>
              <StatusBadge kind="os" status={os.status} />
            </TD>
            <TD className="text-right font-medium tabular-nums">
              {formatBRL(os.total)}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
