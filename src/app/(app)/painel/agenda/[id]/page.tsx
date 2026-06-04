import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  ArrowLeft,
  Pencil,
  User,
  Car,
  Wrench,
  Clock,
  Phone,
  StickyNote,
  Hammer,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTimeBR } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusActions } from "@/components/agenda/status-actions";
import { WhatsappActions } from "@/components/agenda/whatsapp-actions";

export const dynamic = "force-dynamic";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default async function AgendamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const agendamento = await prisma.appointment.findUnique({
    where: { id },
    include: {
      customer: {
        select: { nome: true, telefone: true, whatsapp: true },
      },
      vehicle: {
        select: { marca: true, modelo: true, placa: true, ano: true, cor: true },
      },
      mecanico: { select: { name: true } },
    },
  });

  if (!agendamento) notFound();

  const veiculoTexto = agendamento.vehicle
    ? `${agendamento.vehicle.marca} ${agendamento.vehicle.modelo}` +
      (agendamento.vehicle.placa ? ` · ${agendamento.vehicle.placa}` : "")
    : "Sem veículo informado";

  const telefone =
    agendamento.customer.whatsapp ?? agendamento.customer.telefone ?? null;

  return (
    <div>
      <PageHeader
        title="Detalhes do agendamento"
        description={`${agendamento.customer.nome} · ${formatDateTimeBR(agendamento.dataHora)}`}
        icon={CalendarClock}
        action={
          <div className="flex gap-2">
            <Link href="/painel/agenda">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link href={`/painel/agenda/${agendamento.id}/editar`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Informações principais */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Informações</CardTitle>
            <StatusBadge kind="agendamento" status={agendamento.status} />
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoRow icon={User} label="Cliente" value={agendamento.customer.nome} />
            <InfoRow icon={Car} label="Veículo" value={veiculoTexto} />
            <InfoRow
              icon={Clock}
              label="Data e hora"
              value={format(agendamento.dataHora, "EEEE, dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            />
            <InfoRow
              icon={Clock}
              label="Duração estimada"
              value={`${agendamento.duracaoMin} minutos`}
            />
            <InfoRow
              icon={Wrench}
              label="Serviço desejado"
              value={agendamento.servicoDesejado ?? "Não informado"}
            />
            <InfoRow
              icon={Hammer}
              label="Mecânico responsável"
              value={agendamento.mecanico?.name ?? "Não definido"}
            />
            <InfoRow
              icon={Phone}
              label="Contato"
              value={telefone ?? "Não cadastrado"}
            />
            {agendamento.observacoes && (
              <div className="sm:col-span-2">
                <InfoRow
                  icon={StickyNote}
                  label="Observações"
                  value={agendamento.observacoes}
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Ações */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Ações de status</CardTitle>
            </CardHeader>
            <CardBody>
              <StatusActions
                agendamentoId={agendamento.id}
                status={agendamento.status}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp</CardTitle>
            </CardHeader>
            <CardBody>
              <WhatsappActions
                telefone={telefone}
                cliente={agendamento.customer.nome}
                veiculo={veiculoTexto}
                dataHora={formatDateTimeBR(agendamento.dataHora)}
                servico={agendamento.servicoDesejado ?? undefined}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
