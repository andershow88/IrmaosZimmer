import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  AgendamentoForm,
  type ClienteOption,
  type VeiculoOption,
  type MecanicoOption,
} from "@/components/agenda/agendamento-form";

export const dynamic = "force-dynamic";

export default async function EditarAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [agendamento, clientes, veiculos, mecanicos] = await Promise.all([
    prisma.appointment.findUnique({ where: { id } }),
    prisma.customer.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.vehicle.findMany({
      orderBy: { modelo: "asc" },
      select: { id: true, customerId: true, marca: true, modelo: true, placa: true },
    }),
    prisma.user.findMany({
      where: { ativo: true, role: { in: ["MECANICO", "ADMINISTRADOR"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!agendamento) notFound();

  const clienteOptions: ClienteOption[] = clientes;
  const veiculoOptions: VeiculoOption[] = veiculos.map((v) => ({
    id: v.id,
    customerId: v.customerId,
    label: `${v.marca} ${v.modelo}${v.placa ? ` · ${v.placa}` : ""}`,
  }));
  const mecanicoOptions: MecanicoOption[] = mecanicos.map((m) => ({
    id: m.id,
    nome: m.name,
  }));

  return (
    <div>
      <PageHeader
        title="Editar agendamento"
        description="Atualize os dados do agendamento."
        icon={CalendarClock}
        action={
          <Link href={`/agenda/${agendamento.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <AgendamentoForm
        agendamentoId={agendamento.id}
        clientes={clienteOptions}
        veiculos={veiculoOptions}
        mecanicos={mecanicoOptions}
        initialValues={{
          customerId: agendamento.customerId,
          vehicleId: agendamento.vehicleId ?? "",
          mecanicoId: agendamento.mecanicoId ?? "",
          servicoDesejado: agendamento.servicoDesejado ?? "",
          dataHora: format(agendamento.dataHora, "yyyy-MM-dd'T'HH:mm"),
          duracaoMin: agendamento.duracaoMin,
          observacoes: agendamento.observacoes ?? "",
        }}
      />
    </div>
  );
}
