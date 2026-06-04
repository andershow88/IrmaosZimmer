import Link from "next/link";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { OSForm, type ClienteOption } from "@/components/ordens/os-form";

export const dynamic = "force-dynamic";

export default async function NovaOSPage() {
  await requireUser();

  const [clientesRaw, mecanicos] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { nome: "asc" },
      include: {
        vehicles: {
          orderBy: { placa: "asc" },
          select: { id: true, placa: true, marca: true, modelo: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "MECANICO", ativo: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const clientes: ClienteOption[] = clientesRaw.map((c) => ({
    id: c.id,
    nome: c.nome,
    vehicles: c.vehicles,
  }));

  return (
    <div>
      <PageHeader
        title="Nova Ordem de Serviço"
        description="Abra uma nova OS para um cliente e veículo."
        icon={ClipboardList}
        action={
          <Link href="/painel/ordens-servico">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <OSForm clientes={clientes} mecanicos={mecanicos} />
    </div>
  );
}
