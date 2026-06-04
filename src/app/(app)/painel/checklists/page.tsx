import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  ListaInspecoes,
  type InspecaoRow,
} from "@/components/checklists/lista-inspecoes";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  await requireUser();

  const inspecoes = await prisma.inspection.findMany({
    orderBy: { data: "desc" },
    select: {
      id: true,
      data: true,
      vehicle: {
        select: {
          marca: true,
          modelo: true,
          placa: true,
          customer: { select: { nome: true } },
        },
      },
      serviceOrder: { select: { numero: true } },
      mecanico: { select: { name: true } },
      items: { select: { status: true } },
    },
  });

  const rows: InspecaoRow[] = inspecoes.map((i) => ({
    id: i.id,
    data: i.data.toISOString(),
    veiculo: `${i.vehicle.marca} ${i.vehicle.modelo}`,
    placa: i.vehicle.placa,
    cliente: i.vehicle.customer.nome,
    osNumero: i.serviceOrder?.numero ?? null,
    mecanico: i.mecanico?.name ?? null,
    totalItens: i.items.length,
    criticos: i.items.filter((it) => it.status === "CRITICO").length,
    atencao: i.items.filter((it) => it.status === "ATENCAO").length,
  }));

  return (
    <div>
      <PageHeader
        title="Inspeções"
        description="Checklists digitais de inspeção veicular."
        icon={ClipboardCheck}
        action={
          <Link href="/painel/checklists/novo" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Nova inspeção
          </Link>
        }
      />

      <ListaInspecoes inspecoes={rows} />
    </div>
  );
}
