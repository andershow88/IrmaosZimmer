import { ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { InspecaoForm } from "@/components/checklists/inspecao-form";

export const dynamic = "force-dynamic";

const STATUS_OS_ATIVAS = [
  "ABERTA",
  "AGUARDANDO_DIAGNOSTICO",
  "AGUARDANDO_APROVACAO",
  "APROVADA",
  "EM_EXECUCAO",
  "AGUARDANDO_PECAS",
] as const;

export default async function NovaInspecaoPage() {
  await requireUser();

  const [veiculos, ordens, mecanicos] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        id: true,
        marca: true,
        modelo: true,
        placa: true,
        customer: { select: { nome: true } },
      },
    }),
    prisma.serviceOrder.findMany({
      where: { status: { in: [...STATUS_OS_ATIVAS] } },
      orderBy: { dataAbertura: "desc" },
      select: { id: true, numero: true, vehicleId: true },
    }),
    prisma.user.findMany({
      where: { ativo: true, role: { in: ["MECANICO", "ADMINISTRADOR"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const veiculoOptions = veiculos.map((v) => ({
    id: v.id,
    label: `${v.marca} ${v.modelo} (${v.placa})`,
    clienteNome: v.customer.nome,
  }));

  return (
    <div>
      <PageHeader
        title="Nova inspeção"
        description="Registre um checklist digital de inspeção do veículo."
        icon={ClipboardCheck}
      />

      <InspecaoForm
        veiculos={veiculoOptions}
        ordens={ordens}
        mecanicos={mecanicos}
      />
    </div>
  );
}
