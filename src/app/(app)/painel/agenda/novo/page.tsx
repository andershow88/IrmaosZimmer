import Link from "next/link";
import { CalendarPlus, ArrowLeft } from "lucide-react";
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

export default async function NovoAgendamentoPage() {
  await requireUser();

  const [clientes, veiculos, mecanicos] = await Promise.all([
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
        title="Novo agendamento"
        description="Agende um cliente para um serviço na oficina."
        icon={CalendarPlus}
        action={
          <Link href="/painel/agenda">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <AgendamentoForm
        clientes={clienteOptions}
        veiculos={veiculoOptions}
        mecanicos={mecanicoOptions}
      />
    </div>
  );
}
