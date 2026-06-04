import Link from "next/link";
import { notFound } from "next/navigation";
import {
  User,
  Pencil,
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Car,
  ClipboardList,
  CalendarDays,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { ClienteDelete } from "@/components/clientes/cliente-delete";

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
    },
  });

  if (!cliente) notFound();

  const contatos = [
    cliente.telefone && {
      icon: Phone,
      label: "Telefone",
      value: cliente.telefone,
    },
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

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        description={
          cliente.tipoPessoa === "JURIDICA" ? "Pessoa jurídica" : "Pessoa física"
        }
        icon={User}
        action={
          <div className="flex items-center gap-2">
            <Link href="/painel/clientes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link href={`/painel/clientes/${cliente.id}/editar`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <ClienteDelete id={cliente.id} nome={cliente.nome} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dados do cliente */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Dados</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    cliente.tipoPessoa === "JURIDICA" ? "info" : "default"
                  }
                >
                  {cliente.tipoPessoa === "JURIDICA"
                    ? "Pessoa jurídica"
                    : "Pessoa física"}
                </Badge>
                {cliente.lgpdConsent ? (
                  <Badge variant="success">
                    <ShieldCheck className="h-3 w-3" />
                    LGPD
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <ShieldOff className="h-3 w-3" />
                    Sem consentimento
                  </Badge>
                )}
              </div>

              {cliente.cpfCnpj && (
                <InfoRow
                  label={cliente.tipoPessoa === "JURIDICA" ? "CNPJ" : "CPF"}
                  value={cliente.cpfCnpj}
                />
              )}

              {contatos.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-foreground">
                  <c.icon className="h-4 w-4 shrink-0 text-muted" />
                  <span>{c.value}</span>
                </div>
              ))}

              {enderecoLinha && (
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <span>
                    {enderecoLinha}
                    {cliente.cep ? ` — ${cliente.cep}` : ""}
                  </span>
                </div>
              )}

              {cliente.observacoes && (
                <div className="border-t border-border pt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    Observações
                  </p>
                  <p className="whitespace-pre-wrap text-foreground">
                    {cliente.observacoes}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-3 text-xs text-muted">
                Cadastrado em {formatDateBR(cliente.createdAt)}
              </div>
            </CardBody>
          </Card>

          {/* Veículos */}
          <Card>
            <CardHeader>
              <CardTitle>
                Veículos ({cliente.vehicles.length})
              </CardTitle>
            </CardHeader>
            <CardBody>
              {cliente.vehicles.length === 0 ? (
                <p className="text-sm text-muted">
                  Nenhum veículo cadastrado.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cliente.vehicles.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2"
                    >
                      <Car className="h-4 w-4 shrink-0 text-muted" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {v.marca} {v.modelo}
                          {v.ano ? ` · ${v.ano}` : ""}
                        </p>
                        <p className="text-xs text-muted">{v.placa}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Histórico + agendamentos */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted" />
                  Histórico de atendimentos ({cliente.serviceOrders.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {cliente.serviceOrders.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted">
                  Este cliente ainda não possui ordens de serviço.
                </p>
              ) : (
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
                    {cliente.serviceOrders.map((os) => (
                      <TR key={os.id}>
                        <TD className="font-semibold">{os.numero}</TD>
                        <TD className="text-muted">
                          {os.vehicle.modelo} · {os.vehicle.placa}
                        </TD>
                        <TD className="text-muted">
                          {formatDateBR(os.dataAbertura)}
                        </TD>
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
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted" />
                  Agendamentos ({cliente.appointments.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {cliente.appointments.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted">
                  Nenhum agendamento registrado.
                </p>
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
                        <TD className="text-muted">
                          {formatDateTimeBR(ag.dataHora)}
                        </TD>
                        <TD>{ag.servicoDesejado || "—"}</TD>
                        <TD className="text-muted">
                          {ag.vehicle
                            ? `${ag.vehicle.modelo} · ${ag.vehicle.placa}`
                            : "—"}
                        </TD>
                        <TD>
                          <StatusBadge
                            kind="agendamento"
                            status={ag.status}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
